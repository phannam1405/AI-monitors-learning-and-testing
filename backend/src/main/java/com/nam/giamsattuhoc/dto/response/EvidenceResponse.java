package com.nam.giamsattuhoc.dto.response;
import com.nam.giamsattuhoc.entity.MonitoringEvent;
import lombok.*;
import java.time.LocalDateTime;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EvidenceResponse {
    private Long id;
    private Long sessionId;
    private MonitoringEvent.EventType eventType;
    private LocalDateTime occurredAt;
    private Float durationSeconds;
    private Float confidence;
    private String clipUrl; // presigned URL từ MinIO
}
