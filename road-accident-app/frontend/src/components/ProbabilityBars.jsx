/**
 * ProbabilityBars — stateless component.
 * Renders horizontal probability bars for each severity class.
 *
 * Props:
 *   probMinor, probMajor, probFatal — numbers 0–1
 */
export default function ProbabilityBars({ probMinor = 0, probMajor = 0, probFatal = 0 }) {
  const bars = [
    { label: "Minor", value: probMinor, color: "var(--minor)" },
    { label: "Major", value: probMajor, color: "var(--major)" },
    { label: "Fatal", value: probFatal, color: "var(--fatal)" },
  ];

  return (
    <div className="prob-bars">
      <h3 className="prob-title">Class Probabilities</h3>
      {bars.map(({ label, value, color }) => (
        <div key={label} className="prob-row">
          <span id={`prob-${label.toLowerCase()}`} className="prob-label">{label}</span>
          <div
            className="prob-track"
            role="progressbar"
            aria-labelledby={`prob-${label.toLowerCase()}`}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={(value * 100).toFixed(1)}
          >
            <div
              className="prob-fill"
              style={{
                width: `${(value * 100).toFixed(1)}%`,
                background: color,
              }}
            />
          </div>
          <span className="prob-pct">{(value * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}
