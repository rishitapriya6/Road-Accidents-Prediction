
import pandas as pd
import joblib
from pathlib import Path

# Locate the dataset and trained model
base_dir = Path(__file__).resolve().parents[2]
data = pd.read_csv(base_dir / "indian_roads_dataset.csv")
model = joblib.load(Path(__file__).resolve().parent / "model.joblib")

# Use the same 14 features as your trained model
features = [
    "city", "state", "day_of_week", "road_type",
    "weather", "visibility", "traffic_density", "cause",
    "hour", "is_weekend", "lanes", "traffic_signal",
    "temperature", "is_peak_hour"
]

# Run predictions on the dataset
X = data[features]
predictions = model.predict(X)

# Keep rows the model predicts as fatal
results = data.loc[predictions == "fatal"].copy()
results["predicted_severity"] = predictions[predictions == "fatal"]

# Show actual vs predicted severity
columns = features + ["accident_severity", "predicted_severity"]
print(f"\nTotal rows predicted as FATAL: {len(results)}")
print(results[columns].head(20).to_string(index=False))

# Save every matching row to a CSV file
output = Path(__file__).resolve().parent / "predicted_fatal_cases.csv"
results[columns].to_csv(output, index=False)
print(f"\nAll matching rows saved to: {output}")
