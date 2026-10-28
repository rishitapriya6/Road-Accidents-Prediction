/**
 * api.js — centralised API helper
 * All backend calls go through this file.
 * Change BASE_URL here if the backend runs on a different host/port.
 */

export const BASE_URL = "http://localhost:8080/api";

/** POST /api/predictions — submit a new accident for prediction */
export async function createPrediction(data) {
  const res = await fetch(`${BASE_URL}/predictions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || JSON.stringify(err));
  }
  return res.json();
}

/** GET /api/predictions?severity=... — list all or filter by severity */
export async function fetchPredictions(severity = "") {
  const url = severity
    ? `${BASE_URL}/predictions?severity=${encodeURIComponent(severity)}`
    : `${BASE_URL}/predictions`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch predictions");
  return res.json();
}

/** GET /api/predictions/:id — fetch a single prediction */
export async function fetchPrediction(id) {
  const res = await fetch(`${BASE_URL}/predictions/${id}`);
  if (!res.ok) throw new Error("Prediction not found");
  return res.json();
}

/** PUT /api/predictions/:id — update inputs and re-predict */
export async function updatePrediction(id, data) {
  const res = await fetch(`${BASE_URL}/predictions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || JSON.stringify(err));
  }
  return res.json();
}

/** DELETE /api/predictions/:id */
export async function deletePrediction(id) {
  const res = await fetch(`${BASE_URL}/predictions/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete prediction");
}

/** GET /api/options — dropdown options for categorical fields */
export async function fetchOptions() {
  const res = await fetch(`${BASE_URL}/options`);
  if (!res.ok) throw new Error("Failed to fetch options");
  return res.json();
}

/** GET /api/model/metrics — model performance metrics */
export async function fetchMetrics() {
  const res = await fetch(`${BASE_URL}/model/metrics`);
  if (!res.ok) throw new Error("Failed to fetch metrics");
  return res.json();
}

/** URL for a report image served by the backend */
export function reportImageUrl(filename) {
  return `${BASE_URL}/reports/${filename}`;
}
