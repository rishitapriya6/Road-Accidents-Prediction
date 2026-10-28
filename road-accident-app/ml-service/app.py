"""
app.py — Flask ML service
Serves the trained Random Forest pipeline at POST /predict.
Run: python app.py
Port: 5000
"""

import os
import json

import joblib
import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

# ── Load model ────────────────────────────────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.joblib")
pipeline   = joblib.load(MODEL_PATH)

# Feature order must match what the pipeline was trained on
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
FEATURE_COLS = CATEGORICAL_COLS + NUMERIC_COLS

# ── Flask app ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)   # allow cross-origin requests (needed when backend calls this from Java)

@app.get("/")
def health():
    """Simple health-check endpoint."""
    return jsonify({"status": "ok", "model": "RandomForest"})


@app.post("/predict")
def predict():
    """
    Accepts JSON with the 16 snake_case features.
    Returns {"severity": "minor|major|fatal",
             "probabilities": {"minor": x, "major": y, "fatal": z}}
    """
    data = request.get_json(force=True)

    # Build a one-row DataFrame in exactly the training column order
    try:
        row = {col: [data[col]] for col in FEATURE_COLS}
    except KeyError as e:
        return jsonify({"error": f"Missing field: {e}"}), 400

    df_row = pd.DataFrame(row)

    # Predict class and class probabilities
    severity    = pipeline.predict(df_row)[0]
    proba_array = pipeline.predict_proba(df_row)[0]
    classes     = pipeline.classes_   # e.g. ['fatal', 'major', 'minor']

    proba_dict = {cls: round(float(p), 4) for cls, p in zip(classes, proba_array)}

    return jsonify({
        "severity": severity,
        "probabilities": proba_dict
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False)
