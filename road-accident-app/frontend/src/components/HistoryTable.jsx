import { Link, useNavigate } from "react-router-dom";
import { deletePrediction } from "../api";

/**
 * HistoryTable — stateless component.
 * Renders a table of all prediction records with View / Edit / Delete actions.
 *
 * Props:
 *   records  — array of prediction objects
 *   onDelete — callback(id) called after a successful delete
 */
export default function HistoryTable({ records, onDelete }) {
  const navigate = useNavigate();

  async function handleDelete(id) {
    if (!window.confirm("Delete this prediction record?")) return;
    await deletePrediction(id);
    onDelete(id);
  }

  const badgeClass = {
    minor: "badge-minor",
    major: "badge-major",
    fatal: "badge-fatal",
  };

  if (records.length === 0) {
    return <p className="empty-msg">No records found.</p>;
  }

  return (
    <div className="table-wrapper">
      <table className="history-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>City</th>
            <th>State</th>
            <th>Weather</th>
            <th>Cause</th>
            <th>Severity</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.city}</td>
              <td>{r.state}</td>
              <td>{r.weather}</td>
              <td>{r.cause}</td>
              <td>
                <span className={`severity-badge ${badgeClass[r.predictedSeverity] || ""}`}>
                  {r.predictedSeverity}
                </span>
              </td>
              <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</td>
              <td className="action-cell">
                <Link to={`/result/${r.id}`} className="btn btn-sm btn-view">View</Link>
                <Link to={`/history/${r.id}/edit`} className="btn btn-sm btn-edit">Edit</Link>
                <button
                  className="btn btn-sm btn-delete"
                  onClick={() => handleDelete(r.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
