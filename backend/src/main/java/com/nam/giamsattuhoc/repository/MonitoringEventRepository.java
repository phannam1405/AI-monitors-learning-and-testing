package com.nam.giamsattuhoc.repository;
import com.nam.giamsattuhoc.entity.MonitoringEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
public interface MonitoringEventRepository extends JpaRepository<MonitoringEvent, Long> {
    List<MonitoringEvent> findBySessionIdOrderByOccurredAtAsc(Long sessionId);
    List<MonitoringEvent> findBySessionIdAndEventType(Long sessionId, MonitoringEvent.EventType eventType);
    @Query("SELECT COUNT(e) FROM MonitoringEvent e WHERE e.session.id = :sessionId AND e.eventType = :type")
    int countBySessionIdAndEventType(Long sessionId, MonitoringEvent.EventType type);
}
