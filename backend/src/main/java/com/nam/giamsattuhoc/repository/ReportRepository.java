package com.nam.giamsattuhoc.repository;
import com.nam.giamsattuhoc.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface ReportRepository extends JpaRepository<Report, Long> {
    Optional<Report> findBySessionId(Long sessionId);
    List<Report> findBySessionStudentId(Long studentId);
    List<Report> findBySessionRoomId(Long roomId);
}
