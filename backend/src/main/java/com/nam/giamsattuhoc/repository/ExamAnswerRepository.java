package com.nam.giamsattuhoc.repository;
import com.nam.giamsattuhoc.entity.ExamAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ExamAnswerRepository extends JpaRepository<ExamAnswer, Long> {
    List<ExamAnswer> findBySubmissionId(Long submissionId);
}
