"""
train.py â€” Road Accident Severity Prediction
B.Tech (AI & ML) Academic Case Study

Trains a Random Forest classifier on the indian_roads_dataset.csv.
Target: accident_severity (minor / major / fatal)
16 input features: see FEATURE_COLS below.
"""

import json
import os
import sys

import joblib
import matplotlib
matplotlib.use("Agg")          # non-interactive backend (no display needed)
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix, f1_score
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

# â”€â”€ Paths â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA_PATH   = os.path.join(ROOT, "indian_roads_dataset.csv")
REPORTS_DIR = os.path.join(ROOT, "road-accident-app", "reports")
MODEL_PATH  = os.path.join(os.path.dirname(__file__), "model.joblib")
OPTIONS_PATH = os.path.join(os.path.dirname(__file__), "options.json")

os.makedirs(REPORTS_DIR, exist_ok=True)

# â”€â”€ Feature definitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# We use exactly 16 features. The following are EXCLUDED to avoid data leakage
# or because they are too sparse to be useful:
#   - vehicles_involved: outcome-correlated proxy (post-accident count)
#   - casualties:        direct outcome measure â€” pure leakage
#   - risk_score:        computed from the target, not an independent predictor
#   - festival:          ~99.4% missing; encoding would introduce noise
CATEGORICAL_COLS = [
    "city", "state", "day_of_week",
    "road_type", "weather", "visibility",
    "traffic_density", "cause"
]
NUMERIC_COLS = [
    "latitude", "longitude", "hour",
    "is_weekend", "lanes", "traffic_signal",
    "temperature", "is_peak_hour"
]
FEATURE_COLS = CATEGORICAL_COLS + NUMERIC_COLS   # order matters for ColumnTransformer
TARGET_COL = "accident_severity"

# â”€â”€ Load data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
print("Loading data â€¦")
df = pd.read_csv(DATA_PATH)
print(f"  Rows: {len(df)}, Columns: {len(df.columns)}")

X = df[FEATURE_COLS]
y = df[TARGET_COL]

print("\nClass distribution:")
print(y.value_counts())

# â”€â”€ Save options.json for the frontend dropdown menus â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
options = {col: sorted(df[col].dropna().unique().tolist()) for col in CATEGORICAL_COLS}
with open(OPTIONS_PATH, "w") as f:
    json.dump(options, f, indent=2)
print(f"\nSaved options.json â†’ {OPTIONS_PATH}")

# â”€â”€ Train / test split â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, stratify=y, random_state=42
)
print(f"\nTrain size: {len(X_train)}  Test size: {len(X_test)}")

# â”€â”€ Preprocessor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# OneHotEncoder with handle_unknown="ignore" so unseen categories at inference
# do not crash the pipeline.  sparse_output=False gives a dense array.
# No scaling: Random Forest is invariant to monotone transformations of features.
preprocessor = ColumnTransformer(
    transformers=[
        ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_COLS)
    ],
    remainder="passthrough"   # pass numeric columns through unchanged
)

# â”€â”€ Main pipeline: preprocessor â†’ Random Forest â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
pipeline = Pipeline([
    ("preprocessor", preprocessor),
    ("model", RandomForestClassifier(
        n_estimators=300,
        random_state=42,
        class_weight="balanced",   # addresses class imbalance without dropping rows
        n_jobs=-1
    ))
])

print("\nFitting Random Forest (300 trees, class_weight='balanced') â€¦")
pipeline.fit(X_train, y_train)
y_pred = pipeline.predict(X_test)

# â”€â”€ Baseline: always predict the majority class â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
dummy = DummyClassifier(strategy="most_frequent", random_state=42)
dummy.fit(X_train, y_train)
y_dummy = dummy.predict(X_test)

acc_model   = accuracy_score(y_test, y_pred)
acc_baseline = accuracy_score(y_test, y_dummy)

report_dict = classification_report(y_test, y_pred, output_dict=True)
report_str  = classification_report(y_test, y_pred)

macro_f1_model    = f1_score(y_test, y_pred,  average="macro")
macro_f1_baseline = f1_score(y_test, y_dummy, average="macro")

# Fatal recall (class "fatal")
fatal_recall_model    = report_dict.get("fatal", {}).get("recall", 0.0)
fatal_recall_baseline = classification_report(y_test, y_dummy, output_dict=True).get("fatal", {}).get("recall", 0.0)

print("\n" + "="*60)
print("MODEL RESULTS")
print("="*60)
print(f"Accuracy : {acc_model:.4f}")
print(report_str)
print("Confusion Matrix:")
print(confusion_matrix(y_test, y_pred, labels=["minor", "major", "fatal"]))

print("\n" + "="*60)
print("BASELINE (majority-class DummyClassifier)")
print("="*60)
print(f"Accuracy  : {acc_baseline:.4f}")
print(f"Macro-F1  : {macro_f1_baseline:.4f}")
print(f"Fatal recall: {fatal_recall_baseline:.4f}")

print("\n" + "="*60)
print("COMPARISON SUMMARY")
print("="*60)
print(f"{'Metric':<20} {'Model':>10} {'Baseline':>10}")
print(f"{'Accuracy':<20} {acc_model:>10.4f} {acc_baseline:>10.4f}")
print(f"{'Macro-F1':<20} {macro_f1_model:>10.4f} {macro_f1_baseline:>10.4f}")
print(f"{'Fatal Recall':<20} {fatal_recall_model:>10.4f} {fatal_recall_baseline:>10.4f}")

# â”€â”€ Save model â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
joblib.dump(pipeline, MODEL_PATH)
print(f"\nModel saved â†’ {MODEL_PATH}")

# â”€â”€ Save metrics.json â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
cm = confusion_matrix(y_test, y_pred, labels=["minor", "major", "fatal"])
metrics = {
    "accuracy": round(acc_model, 4),
    "macro_precision": round(report_dict["macro avg"]["precision"], 4),
    "macro_recall":    round(report_dict["macro avg"]["recall"], 4),
    "macro_f1":        round(report_dict["macro avg"]["f1-score"], 4),
    "weighted_f1":     round(report_dict["weighted avg"]["f1-score"], 4),
    "per_class": {
        cls: {
            "precision": round(report_dict[cls]["precision"], 4),
            "recall":    round(report_dict[cls]["recall"], 4),
            "f1":        round(report_dict[cls]["f1-score"], 4),
            "support":   int(report_dict[cls]["support"])
        }
        for cls in ["minor", "major", "fatal"]
    },
    "baseline_accuracy": round(acc_baseline, 4),
    "baseline_macro_f1": round(macro_f1_baseline, 4),
    "confusion_matrix": {
        "labels": ["minor", "major", "fatal"],
        "matrix": cm.tolist()
    }
}
metrics_path = os.path.join(REPORTS_DIR, "metrics.json")
with open(metrics_path, "w") as f:
    json.dump(metrics, f, indent=2)
print(f"Saved metrics.json â†’ {metrics_path}")

# â”€â”€ Plot: Confusion Matrix â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
fig, ax = plt.subplots(figsize=(6, 5))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=["minor", "major", "fatal"],
            yticklabels=["minor", "major", "fatal"], ax=ax)
ax.set_title("Confusion Matrix (Random Forest)")
ax.set_xlabel("Predicted")
ax.set_ylabel("Actual")
plt.tight_layout()
plt.savefig(os.path.join(REPORTS_DIR, "confusion_matrix.png"), dpi=150)
plt.close()
print("Saved confusion_matrix.png")

# â”€â”€ Plot: Feature Importance (top 10) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
rf = pipeline.named_steps["model"]
ohe_feature_names = pipeline.named_steps["preprocessor"].named_transformers_["cat"].get_feature_names_out(CATEGORICAL_COLS)
all_feature_names = list(ohe_feature_names) + NUMERIC_COLS

importances = rf.feature_importances_
indices = np.argsort(importances)[::-1][:10]

fig, ax = plt.subplots(figsize=(9, 5))
ax.barh([all_feature_names[i] for i in indices][::-1],
        importances[indices][::-1], color="steelblue")
ax.set_title("Top-10 Feature Importances (impurity-based)")
ax.set_xlabel("Mean Decrease in Impurity")
plt.tight_layout()
plt.savefig(os.path.join(REPORTS_DIR, "feature_importance.png"), dpi=150)
plt.close()
print("Saved feature_importance.png")

# â”€â”€ Plot: Class Distribution â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
counts = y.value_counts().reindex(["minor", "major", "fatal"])
colors = ["#2ecc71", "#f39c12", "#e74c3c"]
fig, ax = plt.subplots(figsize=(6, 4))
bars = ax.bar(counts.index, counts.values, color=colors, edgecolor="white")
for bar, count in zip(bars, counts.values):
    ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 50,
            f"{count} ({count/len(y)*100:.1f}%)", ha="center", fontsize=10)
ax.set_title("Class Distribution â€” accident_severity")
ax.set_ylabel("Count")
ax.set_ylim(0, counts.max() * 1.15)
plt.tight_layout()
plt.savefig(os.path.join(REPORTS_DIR, "class_distribution.png"), dpi=150)
plt.close()
print("Saved class_distribution.png")

print("\nTraining complete.")
