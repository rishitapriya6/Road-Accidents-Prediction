import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import FilterDropdown from "../components/FilterDropdown";
import HistoryTable from "../components/HistoryTable";
import { fetchPredictions } from "../api";
import "./HistoryPage.css";

/**
 * HistoryPage — lists all prediction records with optional severity filter.
 *
 * React Router:
 *   useSearchParams() reads and writes the ?severity= query parameter.
 *   This keeps the filter state in the URL (bookmarkable, shareable).
 */
export default function HistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const severity = searchParams.get("severity") || "";

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Re-fetch whenever the severity filter changes
  useEffect(() => {
    setLoading(true);
    fetchPredictions(severity)
      .then(setRecords)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [severity]);

  // Called by FilterDropdown when the user changes the filter
  function handleFilterChange(val) {
    if (val) {
      setSearchParams({ severity: val });
    } else {
      setSearchParams({});
    }
  }

  // Called by HistoryTable after a successful delete to remove the row locally
  function handleDelete(deletedId) {
    setRecords((prev) => prev.filter((r) => r.id !== deletedId));
  }

  return (
    <main className="history-page">
      <section className="page-header">
        <h1>Prediction History</h1>
        <p className="subtitle">Browse, filter, edit or delete past predictions.</p>
      </section>

      <FilterDropdown value={severity} onChange={handleFilterChange} />

      {error   && <div className="alert alert-error">{error}</div>}
      {loading && <p className="loading">Loading records…</p>}
      {!loading && !error && (
        <HistoryTable records={records} onDelete={handleDelete} />
      )}
    </main>
  );
}
