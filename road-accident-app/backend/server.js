
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const ML_URL = "http://127.0.0.1:8000";
const OPTIONS_FILE = path.join(__dirname, "../ml-service/options.json");
const DATA_FILE = path.join(__dirname, "predictions.json");

const readRecords = () => {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
};

const saveRecords = (records) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2));
};

const toModelInput = (data) => ({
  city: data.city,
  state: data.state,
  latitude: Number(data.latitude),
  longitude: Number(data.longitude),
  hour: Number(data.hour),
  day_of_week: data.day_of_week ?? data.dayOfWeek,
  is_weekend: Number(data.is_weekend ?? data.isWeekend),
  road_type: data.road_type ?? data.roadType,
  lanes: Number(data.lanes),
  traffic_signal: Number(data.traffic_signal ?? data.trafficSignal),
  weather: data.weather,
  visibility: data.visibility,
  temperature: Number(data.temperature),
  traffic_density: data.traffic_density ?? data.trafficDensity,
  cause: data.cause,
  is_peak_hour: Number(data.is_peak_hour ?? data.isPeakHour),
});

async function predict(input) {
  const response = await axios.post(`${ML_URL}/predict`, input);
  return response.data;
}

function makeRecord(input, result, id = randomUUID(), old = {}) {
  return {
    ...old,
    ...input,
    id,
    severity: result.severity,
    probMinor: result.probabilities.minor ?? 0,
    probMajor: result.probabilities.major ?? 0,
    probFatal: result.probabilities.fatal ?? 0,
    probabilities: result.probabilities,
    createdAt: old.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

app.get("/", (req, res) => {
  res.send("Road Accident Backend is running!");
});

app.get("/api/options", (req, res) => {
  try {
    res.json(JSON.parse(fs.readFileSync(OPTIONS_FILE, "utf8")));
  } catch (error) {
    res.status(500).json({ error: "Could not load dropdown options" });
  }
});

app.post("/api/predictions", async (req, res) => {
  try {
    const input = toModelInput(req.body);
    const result = await predict(input);
    const record = makeRecord(input, result);
    const records = readRecords();
    records.push(record);
    saveRecords(records);
    res.status(201).json(record);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Prediction could not be completed" });
  }
});

// Keep /api/predict available as well
app.post("/api/predict", async (req, res) => {
  try {
    res.json(await predict(toModelInput(req.body)));
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Could not get prediction from ML service" });
  }
});

app.get("/api/predictions", (req, res) => {
  let records = readRecords();
  if (req.query.severity) {
    records = records.filter(
      (r) => r.severity === req.query.severity
    );
  }
  res.json(records.reverse());
});

app.get("/api/predictions/:id", (req, res) => {
  const record = readRecords().find((r) => r.id === req.params.id);
  if (!record) return res.status(404).json({ error: "Prediction not found" });
  res.json(record);
});

app.put("/api/predictions/:id", async (req, res) => {
  try {
    const records = readRecords();
    const index = records.findIndex((r) => r.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Prediction not found" });
    }

    const input = toModelInput(req.body);
    const result = await predict(input);
    records[index] = makeRecord(input, result, req.params.id, records[index]);
    saveRecords(records);
    res.json(records[index]);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Could not update prediction" });
  }
});

app.delete("/api/predictions/:id", (req, res) => {
  const records = readRecords();
  const remaining = records.filter((r) => r.id !== req.params.id);
  if (remaining.length === records.length) {
    return res.status(404).json({ error: "Prediction not found" });
  }
  saveRecords(remaining);
  res.status(204).end();
});



const REPORTS_DIR = path.join(__dirname, "../reports");

// GET /api/model/metrics
app.get("/api/model/metrics", (req, res) => {
  try {
    const metricsPath = path.join(REPORTS_DIR, "metrics.json");
    const metrics = JSON.parse(fs.readFileSync(metricsPath, "utf8"));
    res.json(metrics);
  } catch (error) {
    console.error("Could not load model metrics:", error.message);
    res.status(500).json({ error: "Could not load model metrics" });
  }
});

// GET /api/reports/:filename
app.get("/api/reports/:filename", (req, res) => {
  const allowedFiles = [
    "confusion_matrix.png",
    "feature_importance.png",
    "class_distribution.png",
  ];

  const filename = req.params.filename;

  if (!allowedFiles.includes(filename)) {
    return res.status(404).json({ error: "Report not found" });
  }

  const imagePath = path.join(REPORTS_DIR, filename);

  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ error: "Report image does not exist" });
  }

  res.sendFile(imagePath);
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
