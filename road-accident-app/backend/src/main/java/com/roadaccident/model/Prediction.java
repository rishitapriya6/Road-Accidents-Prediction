package com.roadaccident.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * JPA Entity representing one road accident prediction record.
 * Stores the 16 input features + the ML prediction result + timestamp.
 * Mapped to the H2 table "predictions".
 */
@Entity
@Table(name = "predictions")
@Data                  // Lombok: generates getters, setters, toString, equals, hashCode
@NoArgsConstructor     // Lombok: no-arg constructor (required by JPA)
@AllArgsConstructor    // Lombok: all-args constructor
@Builder               // Lombok: builder pattern
public class Prediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Location ──────────────────────────────────────────────────────────────
    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "State is required")
    private String state;

    /** India latitude range: roughly 8°N to 37°N */
    @DecimalMin(value = "8.0",  message = "Latitude must be >= 8.0")
    @DecimalMax(value = "37.0", message = "Latitude must be <= 37.0")
    @NotNull(message = "Latitude is required")
    private Double latitude;

    /** India longitude range: roughly 68°E to 97°E */
    @DecimalMin(value = "68.0", message = "Longitude must be >= 68.0")
    @DecimalMax(value = "97.0", message = "Longitude must be <= 97.0")
    @NotNull(message = "Longitude is required")
    private Double longitude;

    // ── Time ─────────────────────────────────────────────────────────────────
    @Min(value = 0,  message = "Hour must be between 0 and 23")
    @Max(value = 23, message = "Hour must be between 0 and 23")
    @NotNull(message = "Hour is required")
    private Integer hour;

    @NotBlank(message = "Day of week is required")
    private String dayOfWeek;

    /** 1 = weekend, 0 = weekday */
    @Min(0) @Max(1)
    @NotNull
    private Integer isWeekend;

    // ── Road & Traffic ────────────────────────────────────────────────────────
    @NotBlank(message = "Road type is required")
    private String roadType;

    @Min(value = 1, message = "Lanes must be at least 1")
    @NotNull
    private Integer lanes;

    /** 1 = signal present, 0 = no signal */
    @Min(0) @Max(1)
    @NotNull
    private Integer trafficSignal;

    @NotBlank(message = "Traffic density is required")
    private String trafficDensity;

    /** 1 = peak hour, 0 = off-peak */
    @Min(0) @Max(1)
    @NotNull
    private Integer isPeakHour;

    // ── Environment ───────────────────────────────────────────────────────────
    @NotBlank(message = "Weather is required")
    private String weather;

    @NotBlank(message = "Visibility is required")
    private String visibility;

    /**
     * Temperature in Celsius.
     * Dataset observed range: 15–40°C.
     */
    @Min(value = 15, message = "Temperature must be >= 15°C")
    @Max(value = 40, message = "Temperature must be <= 40°C")
    @NotNull
    private Integer temperature;

    // ── Cause ─────────────────────────────────────────────────────────────────
    @NotBlank(message = "Cause is required")
    private String cause;

    // ── ML Prediction Results ─────────────────────────────────────────────────
    private String predictedSeverity;  // "minor", "major", or "fatal"
    private Double probMinor;
    private Double probMajor;
    private Double probFatal;

    /** Auto-populated timestamp when the record is first created */
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
