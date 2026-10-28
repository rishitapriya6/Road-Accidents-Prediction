package com.roadaccident.config;

import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

/**
 * Global exception handler.
 * Catches validation errors and ResponseStatusException and returns
 * readable JSON instead of the default Spring error page.
 *
 * @RestControllerAdvice = @ControllerAdvice + @ResponseBody
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handles @Valid Bean Validation failures.
     * Returns a map of field → error message, HTTP 400.
     *
     * Example response:
     * {
     *   "hour": "Hour must be between 0 and 23",
     *   "city": "City is required"
     * }
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, Object> errors = new LinkedHashMap<>();
        errors.put("status", 400);
        errors.put("error", "Validation failed");

        Map<String, String> fields = new LinkedHashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            fields.put(fe.getField(), fe.getDefaultMessage());
        }
        errors.put("fields", fields);
        return errors;
    }

    /**
     * Handles ResponseStatusException thrown explicitly in services/controllers.
     * Preserves the HTTP status code and reason message.
     */
    @ExceptionHandler(ResponseStatusException.class)
    public Map<String, Object> handleResponseStatus(
            ResponseStatusException ex,
            jakarta.servlet.http.HttpServletResponse response) {
        response.setStatus(ex.getStatusCode().value());
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", ex.getStatusCode().value());
        body.put("error", ex.getReason());
        return body;
    }

    /** Catch-all for unexpected errors. */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Map<String, Object> handleGeneric(Exception ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", 500);
        body.put("error", "Internal server error: " + ex.getMessage());
        return body;
    }
}
