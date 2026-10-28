import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import ResultCard from "../components/ResultCard";
import ProbabilityBars from "../components/ProbabilityBars";
import { fetchPrediction } from "../api";
import "./ResultPage.css";

/**
 * ResultPage — reads the :id route parameter, fetches the prediction record,
 * and displays ResultCard + ProbabilityBars.
 *
 * React Router: useParams() reads the :id from the URL.
 */
export default function ResultPage() {
  const { id } = useParams();   // React Router — route param
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPrediction(id)
      .then(setPrediction)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <main className="result-page"><p className="loading">Loading result…</p></main>;
  if (error)   return <main className="result-page"><div className="alert alert-error">{error}</div></main>;

  return (
    <main className="result-page">
      <ResultCard prediction={prediction} />
      <ProbabilityBars
        probMinor={prediction.probMinor}
        probMajor={prediction.probMajor}
        probFatal={prediction.probFatal}
      />
      <div className="result-actions">
        <Link to="/"         className="btn btn-secondary">New Prediction</Link>
        <Link to="/history"  className="btn btn-secondary">View History</Link>
        <Link to={`/history/${id}/edit`} className="btn btn-edit">Edit This Record</Link>
      </div>
    </main>
  );
}
