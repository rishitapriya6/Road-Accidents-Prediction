import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Navbar.css";

/**
 * Navbar — stateless navigation component with a dropdown for Model Info.
 * Uses NavLink for active-link styling.
 */
export default function Navbar() {
  const [modelOpen, setModelOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="brand-link">
          <span className="brand-icon">🚦</span>
          <span>RoadSafe AI</span>
        </Link>
      </div>
      <nav className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          Predict
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          History
        </NavLink>

        {/* Dropdown for Model Info */}
        <div
          className="nav-dropdown"
          onMouseEnter={() => setModelOpen(true)}
          onMouseLeave={() => setModelOpen(false)}
        >
          <NavLink
            to="/model"
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            Model Info ▾
          </NavLink>
          {modelOpen && (
            <div className="dropdown-menu">
              <Link to="/model/metrics" className="dropdown-item">Metrics</Link>
              <Link to="/model/eda"     className="dropdown-item">EDA Charts</Link>
              <Link to="/model/limitations" className="dropdown-item">Limitations</Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
