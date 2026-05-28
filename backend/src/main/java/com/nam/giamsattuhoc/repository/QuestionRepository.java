package com.nam.giamsattuhoc.repository;
import com.nam.giamsattuhoc.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByExamIdOrderByOrderIndexAsc(Long examId);
    int countByExamId(Long examId);
}
