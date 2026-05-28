package com.nam.giamsattuhoc.dto.response;
import lombok.*;
import java.time.LocalDateTime;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReportResponse {
    private Long id;
    private Long sessionId;
    private String studentName;
    private String roomName;
    private String mode;
    private Integer focusedSeconds;
    private Integer drowsySeconds;
    private Integer sleepSeconds;
    private Integer phoneSeconds;
    private Integer headDownCount;
    private Integer drowsyCount;
    private Integer sleepCount;
    private Integer phoneCount;
    private Integer cheatingCount;
    private Float focusPercentage;
    private LocalDateTime generatedAt;
    private String summaryJson;
}
