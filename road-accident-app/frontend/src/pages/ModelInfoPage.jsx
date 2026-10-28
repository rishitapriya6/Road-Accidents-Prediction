import { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { fetchMetrics, reportImageUrl } from "../api";
import "./ModelInfoPage.css";

/**
 * ModelInfoPage — contains nested routes via <Outlet />.
 * Nested routes (defined in App.jsx):
 *   /model/metrics     → MetricsView
 *   /model/eda         → EdaView
 *   /model/limitations → LimitationsView
 *
 * The sub-page components are defined below this file for simplicity.
 */
export default function ModelInfoPage() {
  return (
    <main className="model-page">
      <section className="page-header">
        <h1>Model Information</h1>
        <p className="subtitle">Performance metrics, EDA charts and known limitations.</p>
      </section>

      {/* Sub-navigation tabs */}
      <nav className="model-tabs">
        <NavLink to="metrics"     className={({ isActive }) => isActive ? "tab active" : "tab"}>Metrics</NavLink>
        <NavLink to="eda"         className={({ isActive }) => isActive ? "tab active" : "tab"}>EDA Charts</NavLink>
        <NavLink to="limitations" className={({ isActive }) => isActive ? "tab active" : "tab"}>Limitations</NavLink>
      </nav>

      {/* Nested route renders here */}
      <div className="model-content">
        <Outlet />
      </div>
    </main>
  );
}

/* ── MetricsView ─────────────────────────────────────────────────────────── */
export function MetricsView() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMetrics()
      .then(setMetrics)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="loading">Loading metrics…</p>;
  if (error)   return <div className="alert alert-error">{error}</div>;
  if (!metrics) return null;

  const classes = ["minor", "major", "fatal"];
  const { matrix, labels } = metrics.confusion_matrix;

  return (
    <div className="metrics-view">
      {/* Overall metrics */}
      <h2 className="section-title">Overall Performance</h2>
      <table className="metrics-table">
        <thead><tr><th>Metric</th><th>Model</th><th>Baseline (always Minor)</th></tr></thead>
        <tbody>
          <tr><td>Accuracy</td>         <td>{(metrics.accuracy * 100).toFixed(1)}%</td>        <td>{(metrics.baseline_accuracy * 100).toFixed(1)}%</td></tr>
          <tr><td>Macro Precision</td>  <td>{metrics.macro_precision.toFixed(3)}</td>           <td>—</td></tr>
          <tr><td>Macro Recall</td>     <td>{metrics.macro_recall.toFixed(3)}</td>              <td>—</td></tr>
          <tr><td>Macro F1</td>         <td>{metrics.macro_f1.toFixed(3)}</td>                  <td>{metrics.baseline_macro_f1.toFixed(3)}</td></tr>
          <tr><td>Weighted F1</td>      <td>{metrics.weighted_f1.toFixed(3)}</td>               <td>—</td></tr>
        </tbody>
      </table>

      {/* Per-class metrics */}
      <h2 className="section-title">Per-Class Metrics</h2>
      <table className="metrics-table">
        <thead><tr><th>Class</th><th>Precision</th><th>Recall</th><th>F1</th><th>Support</th></tr></thead>
        <tbody>
          {classes.map((cls) => (
            <tr key={cls}>
              <td><span className={`severity-badge badge-${cls}`}>{cls}</span></td>
              <td>{metrics.per_class[cls].precision.toFixed(3)}</td>
              <td>{metrics.per_class[cls].recall.toFixed(3)}</td>
              <td>{metrics.per_class[cls].f1.toFixed(3)}</td>
              <td>{metrics.per_class[cls].support}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Confusion matrix */}
      <h2 className="section-title">Confusion Matrix</h2>
      <img
        src={reportImageUrl("confusion_matrix.png")}
        alt="Confusion matrix heatmap"
        className="report-img"
      />
    </div>
  );
}

/* ── EdaView ─────────────────────────────────────────────────────────────── */
export function EdaView() {
  return (
    <div className="eda-view">
      <h2 className="section-title">Class Distribution</h2>
      <img src={reportImageUrl("class_distribution.png")} alt="Class distribution bar chart" className="report-img" />

      <h2 className="section-title">Top-10 Feature Importances</h2>
      <img src={reportImageUrl("feature_importance.png")} alt="Feature importance chart" className="report-img" />
    </div>
  );
}

/* ── LimitationsView ─────────────────────────────────────────────────────── */
export function LimitationsView() {
  const items = [
    "Classes are imbalanced (about 55% Minor, 30% Major, 15% Fatal).",
    "Fatal recall is 0% on the test set, so the model is unsuitable for safety-critical use.",
    "Accuracy (about 53.8%) is slightly below always predicting Minor (about 55.1%).",
    "Weather and road type show almost identical severity distributions, so predictors are weakly related to severity.",
    "Single 80:20 hold-out split, no cross-validation, no tuning in the default model.",
    "Dataset origin and labelling are undocumented; labels may not match official MoRTH categories.",
    "Impurity-based feature importance favours continuous variables.",
  ];

  return (
    <div className="limitations-view">
      <h2 className="section-title">Known Limitations</h2>
      <div className="disclaimer" style={{ marginBottom: "1rem" }}>
        ⚠️ This model is a baseline for academic study only. Do NOT use for safety-critical decisions.
      </div>
      <ul className="limitations-list">
        {items.map((item, i) => (
          <li key={i} className="limitation-item">{item}</li>
        ))}
      </ul>
    </div>
  );
}
