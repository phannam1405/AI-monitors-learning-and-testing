package com.nam.giamsattuhoc.dto.request;
import com.nam.giamsattuhoc.entity.Question;
import jakarta.validation.constraints.*;
import lombok.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CreateQuestionRequest {
    @NotBlank private String content;
    @NotBlank private String optionA;
    @NotBlank private String optionB;
    @NotBlank private String optionC;
    @NotBlank private String optionD;
    @NotNull private Question.Answer correctAnswer;
}
