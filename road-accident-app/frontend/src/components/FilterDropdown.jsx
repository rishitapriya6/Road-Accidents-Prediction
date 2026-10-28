import { useState } from "react";

/**
 * FilterDropdown — severity filter with an Apply button.
 */
export default function FilterDropdown({ value, onChange }) {
  const [selectedValue, setSelectedValue] = useState(value);

  function handleApply() {
    onChange(selectedValue);
  }

  return (
    <div className="filter-row">
      <label htmlFor="severity-filter" className="filter-label">
        Filter by Severity:
      </label>

      <select
        id="severity-filter"
        className="form-select"
        value={selectedValue}
        onChange={(e) => setSelectedValue(e.target.value)}
      >
        <option value="">All</option>
        <option value="minor">Minor</option>
        <option value="major">Major</option>
        <option value="fatal">Fatal</option>
      </select>

      <button
        type="button"
        className="btn btn-primary"
        onClick={handleApply}
      >
        Apply Filter
      </button>
    </div>
  );
}