package com.nam.giamsattuhoc.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "monitoring_events")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MonitoringEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private MonitoringSession session;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private EventType eventType;

    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;

    @Column(name = "duration_seconds")
    private Float durationSeconds;

    @Column(name = "clip_path", length = 500)
    private String clipPath;

    @Column(name = "confidence")
    private Float confidence;

    public enum EventType {
        DROWSY, SLEEP, PHONE, HEAD_DOWN, FULLSCREEN_EXIT, TAB_HIDDEN, CHEATING
    }
}
