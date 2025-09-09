package com.nxt.nxt.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.nxt.nxt.entity.StudentAnswer;

@Repository
public interface StudentAnswerRepository extends JpaRepository<StudentAnswer, Integer> {
    List<StudentAnswer> findByStudentIdAndExamId(UUID studentId, Integer examId);
}
