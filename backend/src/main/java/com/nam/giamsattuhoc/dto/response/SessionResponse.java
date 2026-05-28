package com.nam.giamsattuhoc.dto.response;
import com.nam.giamsattuhoc.entity.MonitoringSession;
import com.nam.giamsattuhoc.entity.Room;
import lombok.*;
import java.time.LocalDateTime;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SessionResponse {
    private Long id;
    private Long studentId;
    private String studentName;
    private Long roomId;
    private String roomName;
    private String roomCode;
    private Room.RoomType mode;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private MonitoringSession.SessionStatus status;
    private String evidenceFolder;
    private Integer tabHiddenCount;
    private Integer fullscreenExitCount;
}
