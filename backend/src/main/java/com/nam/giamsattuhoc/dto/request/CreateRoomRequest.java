package com.nam.giamsattuhoc.dto.request;
import com.nam.giamsattuhoc.entity.Room;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CreateRoomRequest {
    @NotBlank private String name;
    @NotNull private Room.RoomType type;
    @NotNull private Long subjectId;
    private Long examId;
    private LocalDateTime scheduledStart;
    private LocalDateTime scheduledEnd;
}
