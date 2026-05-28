package com.nam.giamsattuhoc.dto.response;
import com.nam.giamsattuhoc.entity.Question;
import lombok.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AnswerResultResponse {
    private Long questionId;
    private String questionContent;
    private Question.Answer selectedAnswer;
    private Question.Answer correctAnswer;
    private Boolean isCorrect;
}
