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

  const [result, setResult] = useState({
    severity: null,
    records: [],
    error: "",
  });
  const loading = result.severity !== severity;
  const records = loading ? [] : result.records;
  const error = loading ? "" : result.error;

  // Re-fetch whenever the severity filter changes
  useEffect(() => {
    let active = true;
    fetchPredictions(severity)
      .then((data) => {
        if (active) setResult({ severity, records: data, error: "" });
      })
      .catch((err) => {
        if (active) setResult({ severity, records: [], error: err.message });
      });
    return () => {
      active = false;
    };
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
    setResult((previous) => ({
      ...previous,
      records: previous.records.filter((record) => record.id !== deletedId),
    }));
  }

  return (
    <main className="history-page">
      <section className="page-header">
        <h1>Prediction History</h1>
        <p className="subtitle">Browse, filter, edit or delete past predictions.</p>
      </section>

      <FilterDropdown key={severity} value={severity} onChange={handleFilterChange} />

      {error   && <div className="alert alert-error">{error}</div>}
      {loading && <p className="loading">Loading records…</p>}
      {!loading && !error && (
        <HistoryTable records={records} onDelete={handleDelete} />
      )}
    </main>
  );
}
