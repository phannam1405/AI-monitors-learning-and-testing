package com.nam.giamsattuhoc.dto.request;
import com.nam.giamsattuhoc.entity.Question;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.Map;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class SubmitExamRequest {
    @NotNull private Long sessionId;
    private Map<Long, Question.Answer> answers;
    private Boolean isAutoSubmit = false;
}
