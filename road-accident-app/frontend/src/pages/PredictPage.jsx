import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FormField from "../components/FormField";
import { createPrediction, fetchOptions, updatePrediction } from "../api";
import "./PredictPage.css";

/**
 * PredictPage — controlled form with all 16 fields grouped in fieldsets.
 * Also used as the Edit form when `editId` and `initialData` props are passed.
 *
 * Props (optional, used in edit mode):
 *   editId      — prediction id being edited
 *   initialData — pre-filled form values
 */
export default function PredictPage({ editId = null, initialData = null }) {
  const navigate = useNavigate();
  const isEdit = editId !== null;

  // ── Form state ────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    city: "", state: "", latitude: "", longitude: "",
    hour: "", dayOfWeek: "", isWeekend: "0",
    roadType: "", lanes: "", trafficSignal: "0",
    weather: "", visibility: "", temperature: "",
    trafficDensity: "", cause: "", isPeakHour: "0",
  });

  // Dropdown options loaded from the backend
  const [options, setOptions] = useState(null);

  // Inline validation errors
  const [errors, setErrors] = useState({});

  // Loading / server error state
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  // Pre-fill form when editing an existing record
  useEffect(() => {
    if (initialData) {
      setForm({
        city:           initialData.city || "",
        state:          initialData.state || "",
        latitude:       String(initialData.latitude || ""),
        longitude:      String(initialData.longitude || ""),
        hour:           String(initialData.hour || ""),
        dayOfWeek:      initialData.dayOfWeek || "",
        isWeekend:      String(initialData.isWeekend || "0"),
        roadType:       initialData.roadType || "",
        lanes:          String(initialData.lanes || ""),
        trafficSignal:  String(initialData.trafficSignal || "0"),
        weather:        initialData.weather || "",
        visibility:     initialData.visibility || "",
        temperature:    String(initialData.temperature || ""),
        trafficDensity: initialData.trafficDensity || "",
        cause:          initialData.cause || "",
        isPeakHour:     String(initialData.isPeakHour || "0"),
      });
    }
  }, [initialData]);

  // Load dropdown options from the backend
  useEffect(() => {
    fetchOptions()
      .then(setOptions)
      .catch(() => setServerError("Could not load dropdown options. Is the backend running?"));
  }, []);

  // ── Generic change handler ────────────────────────────────────────────────
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear the error for this field when the user edits it
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  // ── Client-side validation ────────────────────────────────────────────────
  function validate() {
    const e = {};
    const required = ["city","state","dayOfWeek","roadType","weather","visibility","trafficDensity","cause"];
    required.forEach((f) => { if (!form[f]) e[f] = "This field is required"; });

    if (form.latitude  === "" || isNaN(form.latitude))  e.latitude  = "Required";
    if (form.longitude === "" || isNaN(form.longitude)) e.longitude = "Required";
    if (form.lanes     === "" || isNaN(form.lanes) || Number(form.lanes) < 1) e.lanes = "Must be >= 1";
    if (form.hour  === "" || isNaN(form.hour) || Number(form.hour) < 0 || Number(form.hour) > 23) {
      e.hour = "Hour must be 0–23";
    }
    if (form.temperature === "" || isNaN(form.temperature) || Number(form.temperature) < 15 || Number(form.temperature) > 40) {
      e.temperature = "Temperature must be 15–40 °C";
    }
    return e;
  }

  // ── Submit handler ────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Build the payload matching the Prediction entity's camelCase fields
    const payload = {
      city:           form.city,
      state:          form.state,
      latitude:       parseFloat(form.latitude),
      longitude:      parseFloat(form.longitude),
      hour:           parseInt(form.hour),
      dayOfWeek:      form.dayOfWeek,
      isWeekend:      parseInt(form.isWeekend),
      roadType:       form.roadType,
      lanes:          parseInt(form.lanes),
      trafficSignal:  parseInt(form.trafficSignal),
      weather:        form.weather,
      visibility:     form.visibility,
      temperature:    parseInt(form.temperature),
      trafficDensity: form.trafficDensity,
      cause:          form.cause,
      isPeakHour:     parseInt(form.isPeakHour),
    };

    setSubmitting(true);
    try {
      let saved;
      if (isEdit) {
        saved = await updatePrediction(editId, payload);
      } else {
        saved = await createPrediction(payload);
      }
      navigate(`/result/${saved.id}`);
    } catch (err) {
      setServerError(err.message || "Unexpected error. Check that Flask and the backend are running.");
    } finally {
      setSubmitting(false);
    }
  }

  // Dropdown options for binary fields
  const binaryOpts = [{ label: "No (0)", value: "0" }, { label: "Yes (1)", value: "1" }];

  return (
    <main className="predict-page">
      <section className="page-header">
        <h1>{isEdit ? "Edit Prediction" : "Predict Accident Severity"}</h1>
        <p className="subtitle">Fill in the accident conditions to get an AI-powered severity prediction.</p>
      </section>

      {serverError && <div className="alert alert-error">{serverError}</div>}

      <form onSubmit={handleSubmit} noValidate className="predict-form">

        {/* ── Fieldset 1: Location ── */}
        <fieldset className="form-fieldset">
          <legend>📍 Location</legend>
          <div className="field-grid">
            <FormField id="city"      label="City"      type="select"
              value={form.city}    onChange={handleChange}
              options={options?.city || []}    error={errors.city} />
            <FormField id="state"     label="State"     type="select"
              value={form.state}   onChange={handleChange}
              options={options?.state || []}   error={errors.state} />
            <FormField id="latitude"  label="Latitude"  type="number"
              value={form.latitude}  onChange={handleChange}
              step="0.0001" placeholder="e.g. 18.96"   error={errors.latitude} />
            <FormField id="longitude" label="Longitude" type="number"
              value={form.longitude} onChange={handleChange}
              step="0.0001" placeholder="e.g. 72.83"   error={errors.longitude} />
          </div>
        </fieldset>

        {/* ── Fieldset 2: Time ── */}
        <fieldset className="form-fieldset">
          <legend>🕐 Time</legend>
          <div className="field-grid">
            <FormField id="hour"       label="Hour (0–23)"  type="number"
              value={form.hour}     onChange={handleChange}
              min="0" max="23" placeholder="e.g. 14"   error={errors.hour} />
            <FormField id="dayOfWeek"  label="Day of Week"  type="select"
              value={form.dayOfWeek} onChange={handleChange}
              options={["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]}
              error={errors.dayOfWeek} />
            <div className="form-field">
              <label className="form-label">Is Weekend?</label>
              <select id="isWeekend" name="isWeekend" className="form-select"
                value={form.isWeekend} onChange={handleChange}>
                {binaryOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Is Peak Hour?</label>
              <select id="isPeakHour" name="isPeakHour" className="form-select"
                value={form.isPeakHour} onChange={handleChange}>
                {binaryOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </fieldset>

        {/* ── Fieldset 3: Road & Traffic ── */}
        <fieldset className="form-fieldset">
          <legend>🛣️ Road &amp; Traffic</legend>
          <div className="field-grid">
            <FormField id="roadType"       label="Road Type"       type="select"
              value={form.roadType}       onChange={handleChange}
              options={options?.road_type || []}        error={errors.roadType} />
            <FormField id="lanes"          label="Number of Lanes" type="number"
              value={form.lanes}          onChange={handleChange}
              min="1" max="6" placeholder="1–6"        error={errors.lanes} />
            <FormField id="trafficDensity" label="Traffic Density" type="select"
              value={form.trafficDensity} onChange={handleChange}
              options={options?.traffic_density || []}  error={errors.trafficDensity} />
            <div className="form-field">
              <label className="form-label">Traffic Signal?</label>
              <select id="trafficSignal" name="trafficSignal" className="form-select"
                value={form.trafficSignal} onChange={handleChange}>
                {binaryOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </fieldset>

        {/* ── Fieldset 4: Environment ── */}
        <fieldset className="form-fieldset">
          <legend>🌤️ Environment</legend>
          <div className="field-grid">
            <FormField id="weather"     label="Weather"            type="select"
              value={form.weather}    onChange={handleChange}
              options={options?.weather || []}      error={errors.weather} />
            <FormField id="visibility"  label="Visibility"         type="select"
              value={form.visibility} onChange={handleChange}
              options={options?.visibility || []}   error={errors.visibility} />
            <FormField id="temperature" label="Temperature (°C)" type="number"
              value={form.temperature} onChange={handleChange}
              min="15" max="40" placeholder="15–40"  error={errors.temperature} />
          </div>
        </fieldset>

        {/* ── Fieldset 5: Cause ── */}
        <fieldset className="form-fieldset">
          <legend>⚠️ Cause</legend>
          <div className="field-grid">
            <FormField id="cause" label="Primary Cause" type="select"
              value={form.cause} onChange={handleChange}
              options={options?.cause || []} error={errors.cause} />
          </div>
        </fieldset>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            {submitting ? "Predicting…" : isEdit ? "Update & Re-predict" : "Predict Severity"}
          </button>
        </div>
      </form>
    </main>
  );
}
