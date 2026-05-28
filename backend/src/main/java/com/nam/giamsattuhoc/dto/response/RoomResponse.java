package com.nam.giamsattuhoc.dto.response;
import com.nam.giamsattuhoc.entity.Room;
import lombok.*;
import java.time.LocalDateTime;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RoomResponse {
    private Long id;
    private String code;
    private String name;
    private Room.RoomType type;
    private Long examId;
    private String examTitle;
    private Long subjectId;
    private String subjectName;
    private String teacherName;
    private Boolean isOpen;
    private LocalDateTime scheduledStart;
    private LocalDateTime scheduledEnd;
    private LocalDateTime createdAt;
}
