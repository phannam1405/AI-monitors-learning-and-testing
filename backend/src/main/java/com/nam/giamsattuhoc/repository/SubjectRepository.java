package com.nam.giamsattuhoc.repository;
import com.nam.giamsattuhoc.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface SubjectRepository extends JpaRepository<Subject, Long> {
    boolean existsByCode(String code);
    List<Subject> findByTeacherId(Long teacherId);
}
