"""
improve.py — Optional experiment script
Stratified 5-fold CV, RandomizedSearchCV (macro-F1), SMOTE, permutation importance.
Results saved to reports/comparison.csv.
NOTE: This does NOT replace the model served by app.py (which uses train.py's output).
"""

import json
import os
import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd

from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.inspection import permutation_importance
from sklearn.metrics import f1_score, make_scorer, recall_score
from sklearn.model_selection import (
    RandomizedSearchCV, StratifiedKFold, cross_val_score, train_test_split
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA_PATH   = os.path.join(ROOT, "indian_roads_dataset.csv")
REPORTS_DIR = os.path.join(ROOT, "road-accident-app", "reports")

CATEGORICAL_COLS = [
    "city", "state", "day_of_week",
    "road_type", "weather", "visibility",
    "traffic_density", "cause"
]
NUMERIC_COLS = [
    "hour", "is_weekend", "lanes",
    "traffic_signal", "temperature", "is_peak_hour"
]
FEATURE_COLS = CATEGORICAL_COLS + NUMERIC_COLS
TARGET_COL = "accident_severity"

df = pd.read_csv(DATA_PATH)
X = df[FEATURE_COLS]
y = df[TARGET_COL]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, stratify=y, random_state=42
)

preprocessor = ColumnTransformer(
    transformers=[
        ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_COLS)
    ],
    remainder="passthrough"
)

# ── 1. Baseline Random Forest (same as train.py) ──────────────────────────────
print("1. Default RF — stratified 5-fold CV …")
default_pipe = Pipeline([
    ("preprocessor", preprocessor),
    ("model", RandomForestClassifier(n_estimators=300, random_state=42,
                                     class_weight="balanced", n_jobs=-1))
])
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scorer = make_scorer(f1_score, average="macro")

cv_default = cross_val_score(default_pipe, X_train, y_train, cv=cv, scoring=scorer, n_jobs=-1)
print(f"   CV macro-F1: {cv_default.mean():.4f} ± {cv_default.std():.4f}")

default_pipe.fit(X_train, y_train)
y_pred_default = default_pipe.predict(X_test)
fatal_recall_default = recall_score(y_test, y_pred_default, labels=["fatal"], average=None)[0]

# ── 2. RandomizedSearchCV ─────────────────────────────────────────────────────
print("\n2. RandomizedSearchCV (macro-F1) …")
param_grid = {
    "model__n_estimators": [100, 200, 300],
    "model__max_depth":    [None, 10, 20],
    "model__min_samples_split": [2, 5],
    "model__max_features": ["sqrt", "log2"]
}
search_pipe = Pipeline([
    ("preprocessor", preprocessor),
    ("model", RandomForestClassifier(random_state=42, class_weight="balanced", n_jobs=-1))
])
rscv = RandomizedSearchCV(
    search_pipe, param_grid, n_iter=10, cv=cv,
    scoring=scorer, random_state=42, n_jobs=-1, verbose=1
)
rscv.fit(X_train, y_train)
print(f"   Best params : {rscv.best_params_}")
print(f"   Best CV macro-F1: {rscv.best_score_:.4f}")

y_pred_tuned = rscv.best_estimator_.predict(X_test)
fatal_recall_tuned = recall_score(y_test, y_pred_tuned, labels=["fatal"], average=None)[0]

# ── 3. SMOTE pipeline ─────────────────────────────────────────────────────────
print("\n3. SMOTE + RandomForest (imbalanced-learn pipeline) …")
# We preprocess first (OHE), then apply SMOTE, then RF
X_train_enc = preprocessor.fit_transform(X_train)
X_test_enc  = preprocessor.transform(X_test)

smote_pipe = ImbPipeline([
    ("smote", SMOTE(random_state=42)),
    ("model", RandomForestClassifier(n_estimators=300, random_state=42, n_jobs=-1))
])
smote_pipe.fit(X_train_enc, y_train)
y_pred_smote = smote_pipe.predict(X_test_enc)
macro_f1_smote = f1_score(y_test, y_pred_smote, average="macro")
fatal_recall_smote = recall_score(y_test, y_pred_smote, labels=["fatal"], average=None)[0]
print(f"   Macro-F1 : {macro_f1_smote:.4f}  Fatal recall: {fatal_recall_smote:.4f}")

# ── 4. Permutation importance ─────────────────────────────────────────────────
print("\n4. Permutation importance (default model, test set) …")
ohe_names = preprocessor.named_transformers_["cat"].get_feature_names_out(CATEGORICAL_COLS)
all_names  = list(ohe_names) + NUMERIC_COLS
rf_model = default_pipe.named_steps["model"]
perm = permutation_importance(rf_model, X_test_enc, y_test,
                               n_repeats=5, random_state=42, n_jobs=-1,
                               scoring="f1_macro")
top5 = np.argsort(perm.importances_mean)[::-1][:5]
print("   Top-5 permutation importances:")
for i in top5:
    print(f"     {all_names[i]:<30} {perm.importances_mean[i]:.4f} ± {perm.importances_std[i]:.4f}")

# ── 5. Save comparison table ───────────────────────────────────────────────────
macro_f1_default = f1_score(y_test, y_pred_default, average="macro")
macro_f1_tuned   = f1_score(y_test, y_pred_tuned,   average="macro")

comparison = pd.DataFrame([
    {"experiment": "Default RF (train.py)",     "macro_f1": round(macro_f1_default, 4), "fatal_recall": round(fatal_recall_default, 4)},
    {"experiment": "RandomizedSearchCV RF",     "macro_f1": round(macro_f1_tuned,   4), "fatal_recall": round(fatal_recall_tuned,   4)},
    {"experiment": "SMOTE + RF (no class_weight)","macro_f1": round(macro_f1_smote,  4), "fatal_recall": round(fatal_recall_smote,  4)},
])
out_path = os.path.join(REPORTS_DIR, "comparison.csv")
comparison.to_csv(out_path, index=False)
print(f"\nSaved comparison.csv → {out_path}")
print("\n" + comparison.to_string(index=False))
print("\nimprove.py complete.")
