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

  return (
    <div className="metrics-view">
      {/* Overall metrics */}
      <h2 className="section-title">Overall Performance</h2>
      <p className="metrics-note">
        Evaluated on a stratified holdout set. The majority baseline always predicts Minor.
      </p>
      <div className="model-metric-cards">
        <article className="model-metric-card">
          <span>Accuracy</span>
          <strong>{(metrics.accuracy * 100).toFixed(1)}%</strong>
          <small>Majority baseline {(metrics.baseline_accuracy * 100).toFixed(1)}%</small>
        </article>
        <article className="model-metric-card">
          <span>Macro F1</span>
          <strong>{metrics.macro_f1.toFixed(3)}</strong>
          <small>Majority baseline {metrics.baseline_macro_f1.toFixed(3)}</small>
        </article>
        <article className="model-metric-card">
          <span>Macro precision</span>
          <strong>{metrics.macro_precision.toFixed(3)}</strong>
          <small>Equal weight per class</small>
        </article>
        <article className="model-metric-card">
          <span>Macro recall</span>
          <strong>{metrics.macro_recall.toFixed(3)}</strong>
          <small>Equal weight per class</small>
        </article>
        <article className="model-metric-card">
          <span>Weighted F1</span>
          <strong>{metrics.weighted_f1.toFixed(3)}</strong>
          <small>Weighted by class support</small>
        </article>
      </div>

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
    "The dataset is imbalanced: roughly 55% Minor, 30% Major, and 15% Fatal.",
    "On the reported holdout, Fatal recall is 4.9%, meaning most Fatal cases were missed. This model is not suitable for safety-critical decisions.",
    "Accuracy is 46.5%, below the 55.1% majority-class baseline, although macro-F1 (0.314) is higher than the baseline (0.237).",
    "The available pre-outcome inputs show weak relationships with severity; improving the model likely requires more informative features or better-labeled data.",
    "Evaluation uses a single stratified 80/20 holdout. Cross-validation comparisons are available in the ML training report but do not replace independent validation.",
    "The dataset origin and label-generation process are undocumented, so representativeness and label validity cannot be established.",
  ];

  return (
    <div className="limitations-view">
      <h2 className="section-title">Known Limitations</h2>
      <div className="disclaimer">
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
