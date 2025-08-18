package com.nxt.nxt.repositories;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.nxt.nxt.entity.StudentBestScore;

@Repository
public interface StudentBestScoreRepository extends JpaRepository<StudentBestScore, Integer> {
    Optional<StudentBestScore> findByStudentIdAndExamId(UUID studentId, Integer examId);

    @Query("SELECT s.bestPercentage FROM StudentBestScore s WHERE s.studentId = :studentId AND s.examId = :examId")
    Optional<BigDecimal> findBestPercentageByStudentIdAndExamId(UUID studentId, Integer examId);
}
