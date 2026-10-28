import { Link, NavLink } from "react-router-dom";
import "./Navbar.css";

const navigation = [
  { to: "/dashboard", label: "Overview", icon: "◫" },
  { to: "/", label: "Predict severity", icon: "＋", end: true },
  { to: "/history", label: "Prediction history", icon: "▤" },
];

export default function Navbar() {
  return (
    <aside className="sidebar">
      <Link to="/dashboard" className="brand-link">
        <span className="brand-mark" aria-hidden="true">R</span>
        <span className="brand-copy">
          <strong>RoadSafe</strong>
          <span>SEVERITY ANALYTICS</span>
        </span>
      </Link>

      <div className="sidebar-label">WORKSPACE</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navigation.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            <span className="nav-icon" aria-hidden="true">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-label model-label">MODEL</div>
      <nav className="sidebar-nav model-nav" aria-label="Model information">
        <NavLink
          to="/model/metrics"
          className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
        >
          <span className="nav-icon" aria-hidden="true">◷</span>
          <span>Performance</span>
        </NavLink>
        <NavLink
          to="/model/eda"
          className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
        >
          <span className="nav-icon" aria-hidden="true">▥</span>
          <span>Data exploration</span>
        </NavLink>
        <NavLink
          to="/model/limitations"
          className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
        >
          <span className="nav-icon" aria-hidden="true">ⓘ</span>
          <span>Limitations</span>
        </NavLink>
      </nav>

      <div className="sidebar-note">
        <span className="sidebar-note-indicator" aria-hidden="true" />
        <div>
          <strong>Academic project</strong>
          <span>Predictions are not safety guidance.</span>
        </div>
      </div>
    </aside>
  );
}
