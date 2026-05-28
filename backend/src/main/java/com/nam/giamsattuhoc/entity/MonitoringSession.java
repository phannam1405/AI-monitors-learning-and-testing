package com.nam.giamsattuhoc.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "monitoring_sessions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MonitoringSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Room.RoomType mode;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SessionStatus status = SessionStatus.ACTIVE;

    @Column(name = "evidence_folder", nullable = false, length = 300)
    private String evidenceFolder;

    @Column(name = "tab_hidden_count")
    @Builder.Default
    private Integer tabHiddenCount = 0;

    @Column(name = "fullscreen_exit_count")
    @Builder.Default
    private Integer fullscreenExitCount = 0;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL)
    private List<MonitoringEvent> events;

    @OneToOne(mappedBy = "session", cascade = CascadeType.ALL)
    private ExamSubmission submission;

    @OneToOne(mappedBy = "session", cascade = CascadeType.ALL)
    private Report report;

    public enum SessionStatus {
        ACTIVE, COMPLETED, INTERRUPTED
    }
}
