package com.nam.giamsattuhoc.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "exam_submissions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExamSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", unique = true, nullable = false)
    private MonitoringSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "total_score")
    private Float totalScore;

    @Column(name = "total_questions", nullable = false)
    private Integer totalQuestions;

    @Column(name = "correct_count")
    private Integer correctCount;

    @Column(name = "is_auto_submitted")
    @Builder.Default
    private Boolean isAutoSubmitted = false;

    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL)
    private List<ExamAnswer> answers;
}
