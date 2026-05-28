package com.nam.giamsattuhoc.repository;
import com.nam.giamsattuhoc.entity.MonitoringSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface MonitoringSessionRepository extends JpaRepository<MonitoringSession, Long> {
    Optional<MonitoringSession> findByStudentIdAndStatus(Long studentId, MonitoringSession.SessionStatus status);
    List<MonitoringSession> findByStudentId(Long studentId);
    List<MonitoringSession> findByRoomId(Long roomId);
    boolean existsByStudentIdAndStatus(Long studentId, MonitoringSession.SessionStatus status);
}
