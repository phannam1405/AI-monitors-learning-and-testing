package com.nam.giamsattuhoc.controller;
import com.nam.giamsattuhoc.dto.response.ApiResponse;
import com.nam.giamsattuhoc.entity.MonitoringEvent;
import com.nam.giamsattuhoc.service.EvidenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
@RestController
@RequestMapping("/api/evidence")
@RequiredArgsConstructor
public class EvidenceController {
    private final EvidenceService evidenceService;
    @PostMapping("/upload")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<?> upload(
            @RequestParam Long sessionId,
            @RequestParam MonitoringEvent.EventType eventType,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime occurredAt,
            @RequestParam(required = false) Float confidence,
            @RequestParam(required = false) Float durationSeconds,
            @RequestParam("file") MultipartFile file) {
        return ApiResponse.success(evidenceService.uploadEvidence(
                sessionId, eventType, occurredAt, confidence, durationSeconds, file));
    }
    @GetMapping("/session/{sessionId}")
    public ApiResponse<?> getBySession(@PathVariable Long sessionId) {
        return ApiResponse.success(evidenceService.getEvidenceBySession(sessionId));
    }
}
