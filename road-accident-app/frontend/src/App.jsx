import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import PredictPage from "./pages/PredictPage";
import ResultPage from "./pages/ResultPage";
import HistoryPage from "./pages/HistoryPage";
import EditPage from "./pages/EditPage";
import ModelInfoPage, { MetricsView, EdaView, LimitationsView } from "./pages/ModelInfoPage";
import NotFoundPage from "./pages/NotFoundPage";

/**
 * App — root component.
 * Defines all React Router routes:
 *   /                  → PredictPage (new prediction form)
 *   /result/:id        → ResultPage (show prediction result)
 *   /history           → HistoryPage (list with ?severity= filter)
 *   /history/:id/edit  → EditPage (pre-filled form, PUT on submit)
 *   /model             → ModelInfoPage (layout with nested routes + Outlet)
 *     /model/metrics     → MetricsView
 *     /model/eda         → EdaView
 *     /model/limitations → LimitationsView
 *   *                  → NotFoundPage (catch-all)
 */
export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* ── Main pages ── */}
        <Route path="/"               element={<PredictPage />} />
        <Route path="/result/:id"     element={<ResultPage />} />
        <Route path="/history"        element={<HistoryPage />} />
        <Route path="/history/:id/edit" element={<EditPage />} />

        {/* ── Model Info with nested routes ── */}
        <Route path="/model" element={<ModelInfoPage />}>
          {/* Redirect /model → /model/metrics by default */}
          <Route index element={<Navigate to="metrics" replace />} />
          <Route path="metrics"     element={<MetricsView />} />
          <Route path="eda"         element={<EdaView />} />
          <Route path="limitations" element={<LimitationsView />} />
        </Route>

        {/* ── 404 ── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <footer className="app-footer">
        <p>RoadSafe AI — B.Tech (AI &amp; ML) Academic Project. Not for safety-critical use.</p>
      </footer>
    </BrowserRouter>
  );
}
