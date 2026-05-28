package com.nam.giamsattuhoc.dto.response;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SubmissionResponse {
    private Long id;
    private Long sessionId;
    private Long examId;
    private String examTitle;
    private String studentName;
    private LocalDateTime submittedAt;
    private Float totalScore;
    private Integer totalQuestions;
    private Integer correctCount;
    private Boolean isAutoSubmitted;
    private List<AnswerResultResponse> answers;
}
