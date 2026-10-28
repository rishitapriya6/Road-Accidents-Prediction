import { Link } from "react-router-dom";

/**
 * NotFoundPage — friendly 404 page shown when no route matches.
 */
export default function NotFoundPage() {
  return (
    <main style={{ textAlign: "center", padding: "5rem 1rem" }}>
      <div style={{ fontSize: "4rem" }}>🚧</div>
      <h1 style={{ color: "#1a237e", fontSize: "2rem", margin: "1rem 0 0.5rem" }}>
        404 — Page Not Found
      </h1>
      <p style={{ color: "#555", marginBottom: "1.5rem" }}>
        The page you're looking for doesn't exist.
      </p>
      <Link to="/" className="btn btn-primary">Go to Predict Page</Link>
    </main>
  );
}
