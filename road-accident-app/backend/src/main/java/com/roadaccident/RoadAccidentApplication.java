package com.roadaccident;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main entry point for the Road Accident Severity Prediction backend.
 * Spring Boot auto-configures web server, JPA, H2, and component scanning.
 */
@SpringBootApplication
public class RoadAccidentApplication {
    public static void main(String[] args) {
        SpringApplication.run(RoadAccidentApplication.class, args);
    }
}
