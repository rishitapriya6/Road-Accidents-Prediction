/**
 * ResultCard — stateless component; props only, no internal state.
 * Displays the predicted severity with a colour-coded badge.
 *
 * Props:
 *   prediction: {Severity, probMinor, probMajor, probFatal,
 *                 city, state, weather, cause, createdAt, ... }
 */
export default function ResultCard({ prediction }) {
  const { severity, city, state, weather, cause, createdAt } = prediction;

  // Colour scheme: green = minor, orange = major, red = fatal
  const badgeClass = {
    minor: "badge-minor",
    major: "badge-major",
    fatal: "badge-fatal",
  }[severity] || "badge-minor";

  const label = severity
    ? severity.charAt(0).toUpperCase() + severity.slice(1)
    : "Unknown";

  return (
    <div className="result-card">
      <div className="result-header">
        <h2 className="result-title">Prediction Result</h2>
        <span className={`severity-badge ${badgeClass}`}>{label}</span>
      </div>

      <div className="result-details">
        <div className="detail-row"><span className="detail-label">Location</span><span>{city}, {state}</span></div>
        <div className="detail-row"><span className="detail-label">Weather</span><span>{weather}</span></div>
        <div className="detail-row"><span className="detail-label">Cause</span><span>{cause}</span></div>
        {createdAt && (
          <div className="detail-row">
            <span className="detail-label">Recorded</span>
            <span>{new Date(createdAt).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Permanent disclaimer as required */}
      <div className="disclaimer">
        ⚠️ Baseline model. Fatal recall on the test set was 0%. Not suitable for safety-critical use.
      </div>
    </div>
  );
}
