/**
 * ProbabilityBars — stateless component.
 * Renders horizontal probability bars for each severity class.
 *
 * Props:
 *   probMinor, probMajor, probFatal — numbers 0–1
 */
export default function ProbabilityBars({ probMinor = 0, probMajor = 0, probFatal = 0 }) {
  const bars = [
    { label: "Minor", value: probMinor, color: "#2e7d32" },
    { label: "Major", value: probMajor, color: "#e65100" },
    { label: "Fatal", value: probFatal, color: "#b71c1c" },
  ];

  return (
    <div className="prob-bars">
      <h3 className="prob-title">Class Probabilities</h3>
      {bars.map(({ label, value, color }) => (
        <div key={label} className="prob-row">
          <span className="prob-label">{label}</span>
          <div className="prob-track">
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
