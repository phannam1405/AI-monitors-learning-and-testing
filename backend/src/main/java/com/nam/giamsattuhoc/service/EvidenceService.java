package com.nam.giamsattuhoc.service;

import com.nam.giamsattuhoc.dto.response.EvidenceResponse;
import com.nam.giamsattuhoc.entity.MonitoringEvent;
import com.nam.giamsattuhoc.entity.MonitoringSession;
import com.nam.giamsattuhoc.entity.User;
import com.nam.giamsattuhoc.exception.AppException;
import com.nam.giamsattuhoc.exception.ErrorCode;
import com.nam.giamsattuhoc.repository.MonitoringEventRepository;
import com.nam.giamsattuhoc.repository.MonitoringSessionRepository;
import com.nam.giamsattuhoc.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EvidenceService {

    private final MonitoringSessionRepository sessionRepository;
    private final MonitoringEventRepository eventRepository;
    private final MinioService minioService;
    private final SecurityUtil securityUtil;

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH'h'mm'm'ss's'");

    /**
     * Nhận clip 3s từ browser upload, lưu MinIO, ghi event vào DB.
     */
    @Transactional
    public EvidenceResponse uploadEvidence(
            Long sessionId,
            MonitoringEvent.EventType eventType,
            LocalDateTime occurredAt,
            Float confidence,
            Float durationSeconds,
            MultipartFile file) {

        MonitoringSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException(ErrorCode.SESSION_NOT_FOUND));

        // Tạo object name trong MinIO
        // e.g. nguyenvana_CNWEB_23-05-2026/drowsy/clip_14h22m30s.webm
        String timeStr = occurredAt.format(TIME_FMT);
        String objectName = session.getEvidenceFolder()
                + eventType.name().toLowerCase() + "/"
                + "clip_" + timeStr + ".webm";

        String savedPath;
        try {
            savedPath = minioService.uploadFile(file, objectName);
        } catch (Exception e) {
            log.error("Upload failed for session {}", sessionId, e);
            throw new AppException(ErrorCode.UPLOAD_FAILED);
        }

        // Lưu event vào DB
        MonitoringEvent event = MonitoringEvent.builder()
                .session(session)
                .eventType(eventType)
                .occurredAt(occurredAt)
                .durationSeconds(durationSeconds)
                .clipPath(savedPath)
                .confidence(confidence)
                .build();
        event = eventRepository.save(event);

        String presignedUrl = minioService.getPresignedUrl(savedPath);

        return EvidenceResponse.builder()
                .id(event.getId())
                .sessionId(sessionId)
                .eventType(eventType)
                .occurredAt(occurredAt)
                .durationSeconds(durationSeconds)
                .confidence(confidence)
                .clipUrl(presignedUrl)
                .build();
    }

    /**
     * Lấy danh sách chứng cứ của 1 session — GV và chính SV đó mới xem được.
     */
    public List<EvidenceResponse> getEvidenceBySession(Long sessionId) {
        User current = securityUtil.getCurrentUser();
        MonitoringSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException(ErrorCode.SESSION_NOT_FOUND));

        // Check quyền: chính SV hoặc GV của phòng đó hoặc ADMIN
        boolean isOwner = session.getStudent().getId().equals(current.getId());
        boolean isTeacher = session.getRoom().getTeacher().getId().equals(current.getId());
        boolean isAdmin = current.getRole() == User.Role.ADMIN;
        if (!isOwner && !isTeacher && !isAdmin)
            throw new AppException(ErrorCode.UNAUTHORIZED);

        return eventRepository.findBySessionIdOrderByOccurredAtAsc(sessionId)
                .stream()
                .filter(e -> e.getClipPath() != null)
                .map(e -> {
                    String url = minioService.getPresignedUrl(e.getClipPath());
                    return EvidenceResponse.builder()
                            .id(e.getId())
                            .sessionId(sessionId)
                            .eventType(e.getEventType())
                            .occurredAt(e.getOccurredAt())
                            .durationSeconds(e.getDurationSeconds())
                            .confidence(e.getConfidence())
                            .clipUrl(url)
                            .build();
                })
                .toList();
    }
}
