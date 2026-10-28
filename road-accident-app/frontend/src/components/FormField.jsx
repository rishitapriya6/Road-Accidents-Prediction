/**
 * FormField — stateless reusable field wrapper.
 * Renders a label, either a text input or a select, and an inline error message.
 *
 * Props:
 *   id       — HTML id (also used as the name attribute)
 *   label    — visible label text
 *   type     — "text" | "number" | "select"
 *   value    — controlled value
 *   onChange — change handler
 *   options  — array of strings (used when type === "select")
 *   error    — validation error message (shown in red below the input)
 *   ...rest  — any other props forwarded to <input> (e.g. min, max, step)
 */
export default function FormField({ id, label, type = "text", value, onChange, options = [], error, ...rest }) {
  return (
    <div className="form-field">
      <label htmlFor={id} className="form-label">{label}</label>
      {type === "select" ? (
        <select
          id={id}
          name={id}
          className={`form-select ${error ? "input-error" : ""}`}
          value={value}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-required={Boolean(rest.required)}
          {...rest}
        >
          <option value="">Select</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt.charAt(0).toUpperCase() + opt.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          name={id}
          type={type}
          className={`form-input ${error ? "input-error" : ""}`}
          value={value}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-required={Boolean(rest.required)}
          {...rest}
        />
      )}
      {error && <span id={`${id}-error`} className="field-error">{error}</span>}
    </div>
  );
}
