package com.nam.giamsattuhoc.dto.request;
import com.nam.giamsattuhoc.entity.MonitoringEvent;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class LogEventRequest {
    @NotNull private MonitoringEvent.EventType eventType;
    @NotNull private LocalDateTime occurredAt;
    private Float durationSeconds;
    private Float confidence;
}
