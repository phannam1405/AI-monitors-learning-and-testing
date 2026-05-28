package com.nam.giamsattuhoc.repository;
import com.nam.giamsattuhoc.entity.ExamSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface ExamSubmissionRepository extends JpaRepository<ExamSubmission, Long> {
    Optional<ExamSubmission> findBySessionId(Long sessionId);
    List<ExamSubmission> findByStudentId(Long studentId);
    boolean existsBySessionId(Long sessionId);
}
