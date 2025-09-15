package com.nxt.nxt.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.nxt.nxt.entity.EssayEvaluation;

@Repository
public interface EssayEvaluationRepository extends JpaRepository<EssayEvaluation, Long> {
    
    /**
     * Find essay evaluation by student and question
     */
    Optional<EssayEvaluation> findByStudentIdAndQuestionId(UUID studentId, Integer questionId);
    
    /**
     * Find all essay evaluations for a student
     */
    List<EssayEvaluation> findByStudentIdOrderByCreatedAtDesc(UUID studentId);
    
    /**
     * Find essay evaluation by student, topic and essay content (for matching during submission)
     */
    @Query("SELECT e FROM EssayEvaluation e WHERE e.studentId = :studentId AND e.topic = :topic AND e.essayText = :essayText ORDER BY e.createdAt DESC")
    Optional<EssayEvaluation> findByStudentIdAndTopicAndEssayText(@Param("studentId") UUID studentId, 
                                                                  @Param("topic") String topic, 
                                                                  @Param("essayText") String essayText);
    
    /**
     * Delete old evaluations to prevent database bloat
     */
    @Query("DELETE FROM EssayEvaluation e WHERE e.createdAt < :cutoffDate")
    void deleteOldEvaluations(@Param("cutoffDate") java.time.LocalDateTime cutoffDate);
}
