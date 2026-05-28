package com.nam.giamsattuhoc.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CreateExamRequest {
    @NotNull private Long subjectId;
    @NotBlank private String title;
    @NotBlank @Size(min=4) private String password;
    @NotNull @Min(5) @Max(300) private Integer durationMinutes;
    private Boolean shuffleQuestions = true;
    private Boolean shuffleAnswers = true;
}
