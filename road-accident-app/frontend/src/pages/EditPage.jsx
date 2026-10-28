import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import PredictPage from "./PredictPage";
import { fetchPrediction } from "../api";

/**
 * EditPage — wraps PredictPage in "edit mode".
 * Reads the :id route param, fetches the existing record, then
 * passes editId and initialData down to PredictPage so the form is pre-filled.
 *
 * React Router: useParams() extracts the :id from /history/:id/edit.
 */
export default function EditPage() {
  const { id } = useParams();
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPrediction(id)
      .then(setPrediction)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <main style={{ padding: "2rem" }}><p>Loading record…</p></main>;
  if (error)   return <main style={{ padding: "2rem" }}><div className="alert alert-error">{error}</div></main>;

  // Reuse PredictPage with editId and initialData (the same controlled form)
  return <PredictPage editId={id} initialData={prediction} />;
}
