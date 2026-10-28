package com.roadaccident.repository;

import com.roadaccident.model.Prediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for Prediction entities.
 * Extends JpaRepository, so basic CRUD (save, findById, findAll, deleteById)
 * is provided automatically by Spring — no SQL needed for those operations.
 *
 * JPA / Hibernate note:
 *   - The @Query below uses HQL (Hibernate Query Language), not SQL.
 *   - HQL operates on entity class names and field names (Java camelCase),
 *     not on table/column names.  Hibernate translates it to SQL at runtime.
 */
@Repository
public interface PredictionRepository extends JpaRepository<Prediction, Long> {

    /**
     * HQL query to filter predictions by severity (case-insensitive).
     * "p.predictedSeverity" refers to the Java field, not the DB column.
     *
     * @param severity one of "minor", "major", "fatal"
     * @return list of matching Prediction entities
     */
    @Query("SELECT p FROM Prediction p WHERE LOWER(p.predictedSeverity) = LOWER(:severity)")
    List<Prediction> findBySeverity(@Param("severity") String severity);
}
