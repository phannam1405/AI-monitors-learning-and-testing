package com.nam.giamsattuhoc.dto.response;
import com.nam.giamsattuhoc.entity.Question;
import lombok.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class QuestionResponse {
    private Long id;
    private String content;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private Integer orderIndex;
    // correctAnswer chỉ trả trong kết quả chấm, không trả khi đang thi
    private Question.Answer correctAnswer;
}
