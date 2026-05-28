package com.nam.giamsattuhoc.dto.response;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExamResponse {
    private Long id;
    private Long subjectId;
    private String subjectName;
    private String title;
    private Integer durationMinutes;
    private Boolean isActive;
    private Boolean shuffleQuestions;
    private Boolean shuffleAnswers;
    private Integer questionCount;
    private LocalDateTime createdAt;
    // không trả password, không trả correctAnswer khi lấy đề
    private List<QuestionResponse> questions;
}
