
package com.nxt.nxt.repositories;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.nxt.nxt.entity.StudentBestScore;

@Repository
public interface StudentBestScoreRepository extends JpaRepository<StudentBestScore, Integer> {
    Optional<StudentBestScore> findByStudentIdAndExamId(UUID studentId, Integer examId);

    @Query("SELECT MAX(s.bestPercentage) FROM StudentBestScore s WHERE s.studentId = :studentId")
    Optional<BigDecimal> findBestPercentageByStudentId(UUID studentId);

    @Query("SELECT s FROM StudentBestScore s WHERE s.studentId = :studentId ORDER BY s.createdAt DESC")
    List<StudentBestScore> findLast5ByStudentIdOrderByCreatedAtDesc(UUID studentId, org.springframework.data.domain.Pageable pageable);
}
