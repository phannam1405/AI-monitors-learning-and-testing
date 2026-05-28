package com.nam.giamsattuhoc.repository;
import com.nam.giamsattuhoc.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findBySubjectId(Long subjectId);
    List<Exam> findByCreatedById(Long teacherId);
}
