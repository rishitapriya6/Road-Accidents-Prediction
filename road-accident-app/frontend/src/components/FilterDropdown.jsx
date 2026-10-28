/**
 * FilterDropdown — stateless component.
 * Updates the URL query string when the user picks a severity filter.
 *
 * Props:
 *   value    — current selected severity (string)
 *   onChange — callback(value) when selection changes
 */
export default function FilterDropdown({ value, onChange }) {
  return (
    <div className="filter-row">
      <label htmlFor="severity-filter" className="filter-label">Filter by Severity:</label>
      <select
        id="severity-filter"
        className="form-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All</option>
        <option value="minor">Minor</option>
        <option value="major">Major</option>
        <option value="fatal">Fatal</option>
      </select>
    </div>
  );
}
