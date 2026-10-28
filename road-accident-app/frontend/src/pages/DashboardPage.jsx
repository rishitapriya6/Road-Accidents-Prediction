import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMetrics, fetchPredictions } from "../api";
import "./DashboardPage.css";

const severityTypes = [
  { key: "minor", label: "Minor", color: "var(--minor)" },
  { key: "major", label: "Major", color: "var(--major)" },
  { key: "fatal", label: "Fatal", color: "var(--fatal)" },
];

function getLastSevenDays(records) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return {
      date,
      key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      count: 0,
    };
  });

  records.forEach((record) => {
    if (!record.createdAt) return;
    const created = new Date(record.createdAt);
    if (Number.isNaN(created.getTime())) return;
    const key = `${created.getFullYear()}-${created.getMonth()}-${created.getDate()}`;
    const day = days.find((item) => item.key === key);
    if (day) day.count += 1;
  });

  return days;
}

export default function DashboardPage() {
  const [records, setRecords] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetchPredictions(), fetchMetrics()])
      .then(([predictionData, metricData]) => {
        setRecords(predictionData);
        setMetrics(metricData);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const severityCounts = useMemo(() => {
    const counts = { minor: 0, major: 0, fatal: 0 };
    records.forEach((record) => {
      if (Object.hasOwn(counts, record.severity)) counts[record.severity] += 1;
    });
    return counts;
  }, [records]);
  const trend = useMemo(() => getLastSevenDays(records), [records]);
  const maxTrend = Math.max(1, ...trend.map((day) => day.count));
  const latestRecords = records.slice(0, 5);

  return (
    <main className="dashboard-page">
      <section className="dashboard-heading">
        <div>
          <p className="eyebrow">ROAD SAFETY · ANALYTICS</p>
          <h1>Overview</h1>
          <p className="subtitle">A clear view of your prediction activity and model performance.</p>
        </div>
        <Link to="/" className="btn btn-primary dashboard-cta">＋ New prediction</Link>
      </section>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {loading && <p className="loading" role="status">Loading dashboard data…</p>}

      {!loading && !error && (
        <>
          <section className="dashboard-metrics" aria-label="Summary metrics">
            <article className="summary-card">
              <span className="summary-icon rose-icon" aria-hidden="true">▤</span>
              <div>
                <p className="summary-label">Total predictions</p>
                <strong className="summary-value">{records.length.toLocaleString()}</strong>
                <span className="summary-caption">Saved in prediction history</span>
              </div>
            </article>
            <article className="summary-card">
              <span className="summary-icon green-icon" aria-hidden="true">✓</span>
              <div>
                <p className="summary-label">Model accuracy</p>
                <strong className="summary-value">
                  {metrics ? `${(metrics.accuracy * 100).toFixed(1)}%` : "—"}
                </strong>
                <span className="summary-caption">Held-out evaluation</span>
              </div>
            </article>
            <article className="summary-card">
              <span className="summary-icon blush-icon" aria-hidden="true">↗</span>
              <div>
                <p className="summary-label">Macro F1</p>
                <strong className="summary-value">
                  {metrics ? metrics.macro_f1.toFixed(3) : "—"}
                </strong>
                <span className="summary-caption">Balanced class performance</span>
              </div>
            </article>
            <article className="summary-card">
              <span className="summary-icon amber-icon" aria-hidden="true">!</span>
              <div>
                <p className="summary-label">Fatal predictions</p>
                <strong className="summary-value">{severityCounts.fatal.toLocaleString()}</strong>
                <span className="summary-caption">From saved records</span>
              </div>
            </article>
          </section>

          <section className="dashboard-charts">
            <article className="dashboard-card distribution-card">
              <div className="card-heading">
                <div>
                  <h2>Severity distribution</h2>
                  <p>Predicted severity across saved records</p>
                </div>
                <Link to="/history" className="subtle-link">View history <span aria-hidden="true">→</span></Link>
              </div>
              {records.length === 0 ? (
                <div className="chart-empty">
                  <p>No prediction data yet.</p>
                  <Link to="/" className="btn btn-secondary btn-sm">Create your first prediction</Link>
                </div>
              ) : (
                <div className="distribution-chart">
                  {severityTypes.map(({ key, label, color }) => {
                    const count = severityCounts[key];
                    const percentage = (count / records.length) * 100;
                    return (
                      <div className="distribution-row" key={key}>
                        <div className="distribution-label">
                          <span className={`severity-dot dot-${key}`} />
                          <span>{label}</span>
                        </div>
                        <div
                          className="distribution-track"
                          role="img"
                          aria-label={`${label}: ${count} predictions, ${percentage.toFixed(1)} percent`}
                        >
                          <span
                            className="distribution-fill"
                            style={{ width: `${percentage}%`, backgroundColor: color }}
                          />
                        </div>
                        <strong className="distribution-count">{count}</strong>
                        <span className="distribution-percent">{percentage.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                  <div className="distribution-total">
                    <span>Records represented</span>
                    <strong>{records.length.toLocaleString()}</strong>
                  </div>
                </div>
              )}
            </article>

            <article className="dashboard-card trend-card">
              <div className="card-heading">
                <div>
                  <h2>Recent activity</h2>
                  <p>Prediction records created · last 7 days</p>
                </div>
              </div>
              <div className="activity-chart" aria-label="Prediction records created during the last 7 days">
                {trend.map((day) => (
                  <div className="activity-day" key={day.key}>
                    <span className="activity-count">{day.count || ""}</span>
                    <div className="activity-bar-wrap">
                      <span
                        className="activity-bar"
                        style={{ height: `${Math.max(4, (day.count / maxTrend) * 100)}%` }}
                        role="img"
                        aria-label={`${day.count} predictions on ${day.date.toLocaleDateString()}`}
                      />
                    </div>
                    <span className="activity-label">{day.label}</span>
                  </div>
                ))}
              </div>
              <p className="chart-footnote">Based on prediction record timestamps.</p>
            </article>
          </section>

          <section className="dashboard-card recent-card">
            <div className="card-heading">
              <div>
                <h2>Recent predictions</h2>
                <p>Latest activity from your prediction history</p>
              </div>
              <Link to="/history" className="subtle-link">All predictions <span aria-hidden="true">→</span></Link>
            </div>
            {latestRecords.length === 0 ? (
              <div className="empty-state">Your recent predictions will appear here.</div>
            ) : (
              <div className="recent-list">
                {latestRecords.map((record) => (
                  <Link to={`/result/${record.id}`} className="recent-item" key={record.id}>
                    <span className={`severity-dot dot-${record.severity || "minor"}`} aria-hidden="true" />
                    <span className="recent-location">
                      <strong>{record.city}, {record.state}</strong>
                      <span>{record.weather} · {record.cause}</span>
                    </span>
                    <span className={`severity-badge badge-${record.severity || "minor"}`}>
                      {record.severity || "Unknown"}
                    </span>
                    <time className="recent-date">
                      {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : "—"}
                    </time>
                    <span className="recent-arrow" aria-hidden="true">→</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
          <p className="dashboard-disclaimer">
            Model outputs are estimates from historical data and are not intended for safety-critical decisions.
          </p>
        </>
      )}
    </main>
  );
}
