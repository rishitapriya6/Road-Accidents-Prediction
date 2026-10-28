package com.roadaccident.service;

import com.roadaccident.model.Prediction;
import com.roadaccident.repository.PredictionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

/**
 * Business logic layer between the controller and the repository/Flask service.
 * Responsibilities:
 *   1. Build the snake_case JSON payload Flask expects.
 *   2. Call Flask /predict via RestTemplate.
 *   3. Populate the Prediction entity with results.
 *   4. Delegate persistence to PredictionRepository.
 */
@Service
public class PredictionService {

    @Autowired
    private PredictionRepository repository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${ml.service.url}")
    private String mlServiceUrl;  // e.g. http://localhost:5000

    // ── CRUD helpers ──────────────────────────────────────────────────────────

    /** Return all predictions, or filter by severity if provided. */
    public List<Prediction> findAll(String severity) {
        if (severity != null && !severity.isBlank()) {
            return repository.findBySeverity(severity.trim());
        }
        return repository.findAll();
    }

    /** Find by id; throw 404 if not found. */
    public Prediction findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Prediction not found with id: " + id));
    }

    /**
     * Call Flask, fill in prediction fields, save and return the entity.
     *
     * @param prediction entity with all 16 input fields set (but prediction fields null)
     * @return saved entity (with id and prediction fields populated)
     */
    public Prediction predictAndSave(Prediction prediction) {
        callFlaskAndFill(prediction);
        return repository.save(prediction);
    }

    /**
     * Re-predict with new inputs, then save.
     * Used by the PUT /api/predictions/{id} endpoint.
     */
    public Prediction updateAndRepredict(Long id, Prediction updated) {
        Prediction existing = findById(id);

        // Copy updated input fields onto the existing entity
        copyInputFields(updated, existing);

        // Re-run prediction with new inputs
        callFlaskAndFill(existing);

        return repository.save(existing);
    }

    /** Delete a record; throw 404 if not found. */
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Prediction not found with id: " + id);
        }
        repository.deleteById(id);
    }

    // ── Flask integration ─────────────────────────────────────────────────────

    /**
     * Builds the snake_case map Flask expects, calls POST /predict,
     * and fills the prediction result fields on the entity in-place.
     *
     * If Flask is unreachable, throws HTTP 503 with a clear message.
     */
    @SuppressWarnings("unchecked")
    private void callFlaskAndFill(Prediction p) {
        // Build payload with the exact snake_case keys the Python model expects
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("city",            p.getCity());
        payload.put("state",           p.getState());
        payload.put("day_of_week",     p.getDayOfWeek());
        payload.put("road_type",       p.getRoadType());
        payload.put("weather",         p.getWeather());
        payload.put("visibility",      p.getVisibility());
        payload.put("traffic_density", p.getTrafficDensity());
        payload.put("cause",           p.getCause());
        payload.put("latitude",        p.getLatitude());
        payload.put("longitude",       p.getLongitude());
        payload.put("hour",            p.getHour());
        payload.put("is_weekend",      p.getIsWeekend());
        payload.put("lanes",           p.getLanes());
        payload.put("traffic_signal",  p.getTrafficSignal());
        payload.put("temperature",     p.getTemperature());
        payload.put("is_peak_hour",    p.getIsPeakHour());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        ResponseEntity<Map> response;
        try {
            response = restTemplate.postForEntity(mlServiceUrl + "/predict", request, Map.class);
        } catch (ResourceAccessException e) {
            // Flask is down or unreachable
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "ML service is unavailable. Make sure Flask is running on " + mlServiceUrl);
        }

        Map<String, Object> body = response.getBody();
        if (body == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Empty response from ML service");
        }

        p.setPredictedSeverity((String) body.get("severity"));

        Map<String, Number> proba = (Map<String, Number>) body.get("probabilities");
        if (proba != null) {
            p.setProbMinor(proba.getOrDefault("minor", 0.0).doubleValue());
            p.setProbMajor(proba.getOrDefault("major", 0.0).doubleValue());
            p.setProbFatal(proba.getOrDefault("fatal", 0.0).doubleValue());
        }
    }

    /** Copy all 16 input fields from src → dst (leaving id, result fields, createdAt intact). */
    private void copyInputFields(Prediction src, Prediction dst) {
        dst.setCity(src.getCity());
        dst.setState(src.getState());
        dst.setLatitude(src.getLatitude());
        dst.setLongitude(src.getLongitude());
        dst.setHour(src.getHour());
        dst.setDayOfWeek(src.getDayOfWeek());
        dst.setIsWeekend(src.getIsWeekend());
        dst.setRoadType(src.getRoadType());
        dst.setLanes(src.getLanes());
        dst.setTrafficSignal(src.getTrafficSignal());
        dst.setTrafficDensity(src.getTrafficDensity());
        dst.setIsPeakHour(src.getIsPeakHour());
        dst.setWeather(src.getWeather());
        dst.setVisibility(src.getVisibility());
        dst.setTemperature(src.getTemperature());
        dst.setCause(src.getCause());
    }
}
