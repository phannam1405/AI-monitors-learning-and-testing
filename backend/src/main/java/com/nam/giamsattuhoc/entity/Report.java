package com.nam.giamsattuhoc.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", unique = true, nullable = false)
    private MonitoringSession session;

    @Column(name = "focused_seconds")
    @Builder.Default
    private Integer focusedSeconds = 0;

    @Column(name = "drowsy_seconds")
    @Builder.Default
    private Integer drowsySeconds = 0;

    @Column(name = "sleep_seconds")
    @Builder.Default
    private Integer sleepSeconds = 0;

    @Column(name = "phone_seconds")
    @Builder.Default
    private Integer phoneSeconds = 0;

    @Column(name = "head_down_count")
    @Builder.Default
    private Integer headDownCount = 0;

    @Column(name = "drowsy_count")
    @Builder.Default
    private Integer drowsyCount = 0;

    @Column(name = "sleep_count")
    @Builder.Default
    private Integer sleepCount = 0;

    @Column(name = "phone_count")
    @Builder.Default
    private Integer phoneCount = 0;

    @Column(name = "cheating_count")
    @Builder.Default
    private Integer cheatingCount = 0;

    @Column(name = "focus_percentage", nullable = false)
    private Float focusPercentage;

    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;

    // Timeline JSON: [{minute: 1, state: "focused"}, ...]
    @Column(name = "summary_json", columnDefinition = "JSON")
    private String summaryJson;
}
