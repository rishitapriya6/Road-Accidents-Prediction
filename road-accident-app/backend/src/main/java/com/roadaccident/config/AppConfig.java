package com.roadaccident.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.config.annotation.*;

/**
 * Application-level configuration beans.
 *
 * CORS: Allow the React dev server (http://localhost:5173) to call this backend.
 * RestTemplate: Used by PredictionService to call the Flask ML service.
 */
@Configuration
public class AppConfig implements WebMvcConfigurer {

    /**
     * CORS configuration.
     * In production you would restrict this to the deployed frontend URL.
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5173")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }

    /**
     * RestTemplate bean for making HTTP calls to the Flask service.
     * Declared as a @Bean so Spring can inject it anywhere via @Autowired.
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
