"""Compare and safely train road-accident severity models."""

import json
import os
import shutil
import tempfile
from datetime import datetime

import joblib
import numpy as np
import pandas as pd
from imblearn.over_sampling import RandomOverSampler
from imblearn.pipeline import Pipeline as ImbPipeline
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import ExtraTreesClassifier, HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.preprocessing import OneHotEncoder


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA_PATH = os.path.join(ROOT, "indian_roads_dataset.csv")
REPORTS_DIR = os.path.join(ROOT, "road-accident-app", "reports")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.joblib")
COMPARISON_PATH = os.path.join(REPORTS_DIR, "model_comparison.json")

CATEGORICAL_COLS = [
    "city", "state", "day_of_week",
    "road_type", "weather", "visibility",
    "traffic_density", "cause",
]
NUMERIC_COLS = [
    "hour", "is_weekend", "lanes",
    "traffic_signal", "temperature", "is_peak_hour",
]
FEATURE_COLS = CATEGORICAL_COLS + NUMERIC_COLS
SERVING_FEATURE_COLS = CATEGORICAL_COLS + [
    "latitude", "longitude",
] + NUMERIC_COLS
TARGET_COL = "accident_severity"
LABELS = ["minor", "major", "fatal"]
RANDOM_STATE = 42


def build_preprocessor():
    return ColumnTransformer(
        transformers=[
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL_COLS,
            )
        ],
        remainder="passthrough",
    )


def build_candidates():
    return {
        "RandomForest + ROS": ImbPipeline([
            ("preprocessor", build_preprocessor()),
            ("oversampler", RandomOverSampler(random_state=RANDOM_STATE)),
            ("model", RandomForestClassifier(
                n_estimators=300,
                random_state=RANDOM_STATE,
                min_samples_leaf=2,
                max_features="sqrt",
                n_jobs=-1,
            )),
        ]),
        "RandomForest": ImbPipeline([
            ("preprocessor", build_preprocessor()),
            ("model", RandomForestClassifier(
                n_estimators=300,
                random_state=RANDOM_STATE,
                min_samples_leaf=2,
                max_features="sqrt",
                n_jobs=-1,
            )),
        ]),
        "ExtraTrees": ImbPipeline([
            ("preprocessor", build_preprocessor()),
            ("model", ExtraTreesClassifier(
                n_estimators=300,
                random_state=RANDOM_STATE,
                min_samples_leaf=2,
                max_features="sqrt",
                n_jobs=-1,
            )),
        ]),
        "HistGradientBoosting": ImbPipeline([
            ("preprocessor", build_preprocessor()),
            ("model", HistGradientBoostingClassifier(
                max_iter=150,
                learning_rate=0.08,
                l2_regularization=1.0,
                class_weight="balanced",
                random_state=RANDOM_STATE,
            )),
        ]),
    }


def measure(estimator, X, y):
    predictions = estimator.predict(X)
    class_report = classification_report(
        y,
        predictions,
        labels=LABELS,
        output_dict=True,
        zero_division=0,
    )
    return {
        "accuracy": float(accuracy_score(y, predictions)),
        "macro_f1": float(f1_score(y, predictions, average="macro")),
        "per_class": {
            label: {
                "precision": float(class_report[label]["precision"]),
                "recall": float(class_report[label]["recall"]),
                "f1": float(class_report[label]["f1-score"]),
                "support": int(class_report[label]["support"]),
            }
            for label in LABELS
        },
        "confusion_matrix": confusion_matrix(
            y, predictions, labels=LABELS
        ).tolist(),
    }


def validate_serving_compatibility(estimator, serving_row):
    expected_names = getattr(estimator, "feature_names_in_", None)
    if expected_names is None or list(expected_names) != FEATURE_COLS:
        raise ValueError(
            "Model input feature names do not match the ML service's trained features."
        )

    prediction = estimator.predict(serving_row)
    probabilities = estimator.predict_proba(serving_row)
    if len(prediction) != 1 or prediction[0] not in LABELS:
        raise ValueError("Model returned an invalid severity label.")
    if probabilities.shape != (1, len(LABELS)):
        raise ValueError("Model returned an incompatible probability shape.")
    if not np.isfinite(probabilities).all() or not np.isclose(
        probabilities.sum(), 1.0, atol=1e-6
    ):
        raise ValueError("Model returned invalid class probabilities.")


def write_report(report):
    os.makedirs(REPORTS_DIR, exist_ok=True)
    with open(COMPARISON_PATH, "w", encoding="utf-8") as file:
        json.dump(report, file, indent=2)


def promote_model(candidate, X, y, serving_row):
    candidate.fit(X, y)
    validate_serving_compatibility(candidate, serving_row)

    file_descriptor, temporary_path = tempfile.mkstemp(
        prefix=".model_candidate_",
        suffix=".joblib",
        dir=os.path.dirname(MODEL_PATH),
    )
    os.close(file_descriptor)
    try:
        joblib.dump(candidate, temporary_path)
        verified_model = joblib.load(temporary_path)
        validate_serving_compatibility(verified_model, serving_row)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = os.path.join(
            os.path.dirname(MODEL_PATH),
            f"model_before_training_{timestamp}.joblib",
        )
        while os.path.exists(backup_path):
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            backup_path = os.path.join(
                os.path.dirname(MODEL_PATH),
                f"model_before_training_{timestamp}.joblib",
            )

        shutil.copy2(MODEL_PATH, backup_path)
        os.replace(temporary_path, MODEL_PATH)
    finally:
        if os.path.exists(temporary_path):
            os.remove(temporary_path)

    return backup_path


def main():
    df = pd.read_csv(DATA_PATH)
    required_columns = set(FEATURE_COLS + SERVING_FEATURE_COLS + [TARGET_COL])
    missing_columns = sorted(required_columns.difference(df.columns))
    if missing_columns:
        raise ValueError(f"Dataset is missing required columns: {missing_columns}")
    if df[FEATURE_COLS + [TARGET_COL]].isna().any().any():
        raise ValueError("Dataset contains missing values in model features or target.")
    if set(df[TARGET_COL].unique()) != set(LABELS):
        raise ValueError(f"Unexpected target labels: {sorted(df[TARGET_COL].unique())}")

    X = df[FEATURE_COLS]
    y = df[TARGET_COL]
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        stratify=y,
        random_state=RANDOM_STATE,
    )
    serving_test = df.loc[X_test.index, SERVING_FEATURE_COLS]
    serving_sample = serving_test.iloc[[0]]

    incumbent = joblib.load(MODEL_PATH)
    validate_serving_compatibility(incumbent, serving_sample)
    incumbent_test = measure(incumbent, serving_test, y_test)

    dummy = DummyClassifier(strategy="most_frequent", random_state=RANDOM_STATE)
    dummy.fit(X_train, y_train)
    baseline_test = measure(dummy, X_test, y_test)

    cv = StratifiedKFold(
        n_splits=5,
        shuffle=True,
        random_state=RANDOM_STATE,
    )
    candidates = build_candidates()
    candidate_results = {}
    fitted_candidates = {}

    print(f"Dataset: {len(df)} rows; train: {len(X_train)}; holdout: {len(X_test)}")
    print("Cross-validating candidates on training folds only...")
    for name, candidate in candidates.items():
        cv_scores = cross_validate(
            candidate,
            X_train,
            y_train,
            cv=cv,
            scoring={"macro_f1": "f1_macro", "accuracy": "accuracy"},
            n_jobs=1,
            return_train_score=False,
        )
        candidate.fit(X_train, y_train)
        fitted_candidates[name] = candidate
        candidate_results[name] = {
            "cv_macro_f1_mean": float(cv_scores["test_macro_f1"].mean()),
            "cv_macro_f1_std": float(cv_scores["test_macro_f1"].std()),
            "cv_accuracy_mean": float(cv_scores["test_accuracy"].mean()),
            "cv_accuracy_std": float(cv_scores["test_accuracy"].std()),
            "holdout": measure(candidate, X_test, y_test),
        }
        print(
            f"  {name}: CV macro-F1 "
            f"{candidate_results[name]['cv_macro_f1_mean']:.4f} "
            f"+/- {candidate_results[name]['cv_macro_f1_std']:.4f}; "
            f"holdout macro-F1 {candidate_results[name]['holdout']['macro_f1']:.4f}"
        )

    selected_name = max(
        candidate_results,
        key=lambda name: candidate_results[name]["cv_macro_f1_mean"],
    )
    selected = candidate_results[selected_name]
    incumbent_cv = candidate_results["RandomForest + ROS"]["cv_macro_f1_mean"]
    promotion = {
        "promoted": False,
        "reason": (
            "No candidate improved both training-fold CV macro-F1 over the "
            "incumbent algorithm and holdout macro-F1 over the incumbent."
        ),
        "backup_path": None,
    }
    if (
        selected_name != "RandomForest + ROS"
        and selected["cv_macro_f1_mean"] > incumbent_cv
        and selected["holdout"]["macro_f1"] > incumbent_test["macro_f1"]
    ):
        backup_path = promote_model(
            fitted_candidates[selected_name],
            X,
            y,
            serving_sample,
        )
        promotion = {
            "promoted": True,
            "reason": (
                "The CV-selected candidate exceeded the incumbent on training-fold "
                "CV macro-F1 and untouched holdout macro-F1."
            ),
            "backup_path": backup_path,
        }

    report = {
        "dataset": {
            "rows": int(len(df)),
            "columns": int(len(df.columns)),
            "target_counts": {
                str(label): int(count)
                for label, count in y.value_counts().reindex(LABELS).items()
            },
            "excluded_post_outcome_features": [
                "vehicles_involved",
                "casualties",
                "risk_score",
            ],
        },
        "evaluation": {
            "split": "stratified 80/20 holdout",
            "random_state": RANDOM_STATE,
            "cross_validation": "5-fold stratified CV on training partition",
            "labels": LABELS,
            "features": FEATURE_COLS,
            "serving_input_features": SERVING_FEATURE_COLS,
            "oversampling": (
                "RandomOverSampler is inside the training pipeline and runs "
                "only during fit, including within CV folds."
            ),
        },
        "incumbent": incumbent_test,
        "majority_baseline": baseline_test,
        "candidates": candidate_results,
        "selected_by_cv": selected_name,
        "promotion": promotion,
    }
    write_report(report)

    print("\nHoldout comparison:")
    print(
        f"  Incumbent: accuracy {incumbent_test['accuracy']:.4f}, "
        f"macro-F1 {incumbent_test['macro_f1']:.4f}, "
        f"fatal precision {incumbent_test['per_class']['fatal']['precision']:.4f}, "
        f"fatal recall {incumbent_test['per_class']['fatal']['recall']:.4f}"
    )
    print(
        f"  Majority baseline: accuracy {baseline_test['accuracy']:.4f}, "
        f"macro-F1 {baseline_test['macro_f1']:.4f}"
    )
    print(f"Selected by CV: {selected_name}")
    print(f"Promotion: {promotion['reason']}")
    print(f"Saved evaluation report: {COMPARISON_PATH}")


if __name__ == "__main__":
    main()
