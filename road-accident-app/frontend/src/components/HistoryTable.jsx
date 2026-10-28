import { Link } from "react-router-dom";
import { useState } from "react";
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
  const [deleteError, setDeleteError] = useState("");

  async function handleDelete(id) {
    if (!window.confirm("Delete this prediction record?")) return;
    setDeleteError("");
    try {
      await deletePrediction(id);
      onDelete(id);
    } catch (error) {
      setDeleteError(error.message || "Could not delete this prediction.");
    }
  }

  const badgeClass = {
    minor: "badge-minor",
    major: "badge-major",
    fatal: "badge-fatal",
  };

  return (
    <>
      {deleteError && <div className="alert alert-error" role="alert">{deleteError}</div>}
      {records.length === 0 ? (
        <p className="empty-msg">No records found. Predictions you create will appear here.</p>
      ) : (
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
                <span className={`severity-badge ${badgeClass[r.severity] || ""}`}>
                  {r.severity}
                </span>
              </td>
              <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</td>
              <td className="action-cell">
                <Link to={`/result/${r.id}`} className="btn btn-sm btn-view">View</Link>
                <Link to={`/history/${r.id}/edit`} className="btn btn-sm btn-edit">Edit</Link>
                <button
                  type="button"
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
      )}
    </>
  );
}
