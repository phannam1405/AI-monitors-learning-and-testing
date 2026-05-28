package com.nam.giamsattuhoc.dto.response;
import lombok.*;
import java.time.LocalDateTime;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SubjectResponse {
    private Long id;
    private String name;
    private String code;
    private String description;
    private String teacherName;
    private Long teacherId;
    private LocalDateTime createdAt;
}
