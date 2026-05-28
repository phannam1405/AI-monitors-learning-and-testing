package com.nam.giamsattuhoc.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "exam_answers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExamAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    private ExamSubmission submission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Enumerated(EnumType.STRING)
    @Column(name = "selected_answer")
    private Question.Answer selectedAnswer;

    @Column(name = "is_correct")
    private Boolean isCorrect;
}
