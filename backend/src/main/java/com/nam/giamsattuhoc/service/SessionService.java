package com.nam.giamsattuhoc.service;

import com.nam.giamsattuhoc.dto.request.LogEventRequest;
import com.nam.giamsattuhoc.dto.request.StartSessionRequest;
import com.nam.giamsattuhoc.dto.response.SessionResponse;
import com.nam.giamsattuhoc.entity.*;
import com.nam.giamsattuhoc.exception.AppException;
import com.nam.giamsattuhoc.exception.ErrorCode;
import com.nam.giamsattuhoc.repository.MonitoringEventRepository;
import com.nam.giamsattuhoc.repository.MonitoringSessionRepository;
import com.nam.giamsattuhoc.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionService {

    private final MonitoringSessionRepository sessionRepository;
    private final MonitoringEventRepository eventRepository;
    private final RoomService roomService;
    private final ReportService reportService;
    private final SecurityUtil securityUtil;

    @Transactional
    public SessionResponse startSession(StartSessionRequest request) {
        User student = securityUtil.getCurrentUser();

        // Kiểm tra nếu SV đã có session đang active
        if (sessionRepository.existsByStudentIdAndStatus(student.getId(), MonitoringSession.SessionStatus.ACTIVE))
            throw new AppException(ErrorCode.SESSION_ALREADY_ACTIVE);

        Room room = roomService.findById(request.getRoomId());
        if (!room.getIsOpen()) throw new AppException(ErrorCode.ROOM_NOT_OPEN);

        // Tạo tên folder evidence: hovaten_mamoi_ngaythang
        String folderName = buildFolderName(student, room);

        MonitoringSession session = MonitoringSession.builder()
                .student(student)
                .room(room)
                .mode(room.getType())
                .startTime(LocalDateTime.now())
                .status(MonitoringSession.SessionStatus.ACTIVE)
                .evidenceFolder(folderName)
                .tabHiddenCount(0)
                .fullscreenExitCount(0)
                .build();

        return toResponse(sessionRepository.save(session));
    }

    @Transactional
    public SessionResponse endSession(Long sessionId) {
        MonitoringSession session = findActiveSessionById(sessionId);
        checkSessionOwnership(session);

        session.setEndTime(LocalDateTime.now());
        session.setStatus(MonitoringSession.SessionStatus.COMPLETED);
        MonitoringSession saved = sessionRepository.save(session);

        // Tạo báo cáo tổng kết
        reportService.generateReport(saved);

        return toResponse(saved);
    }

    /**
     * Heartbeat — SV gửi mỗi 10 giây để server biết session còn sống.
     * Nếu server không nhận heartbeat > 60s → session bị đánh dấu INTERRUPTED.
     */
    public void heartbeat(Long sessionId) {
        MonitoringSession session = findById(sessionId);
        if (session.getStatus() != MonitoringSession.SessionStatus.ACTIVE)
            throw new AppException(ErrorCode.SESSION_NOT_ACTIVE);
        // Đơn giản: cập nhật updated_at (JPA tự xử lý nếu có @UpdateTimestamp)
        // Ở đây chỉ cần verify session tồn tại và đang active là đủ cho MVP
        log.debug("Heartbeat received for session {}", sessionId);
    }

    @Transactional
    public void logEvent(Long sessionId, LogEventRequest request) {
        MonitoringSession session = findById(sessionId);

        // Cập nhật counter trên session
        if (request.getEventType() == MonitoringEvent.EventType.TAB_HIDDEN) {
            session.setTabHiddenCount(session.getTabHiddenCount() + 1);
            sessionRepository.save(session);
        } else if (request.getEventType() == MonitoringEvent.EventType.FULLSCREEN_EXIT) {
            session.setFullscreenExitCount(session.getFullscreenExitCount() + 1);
            sessionRepository.save(session);
        }

        MonitoringEvent event = MonitoringEvent.builder()
                .session(session)
                .eventType(request.getEventType())
                .occurredAt(request.getOccurredAt())
                .durationSeconds(request.getDurationSeconds())
                .confidence(request.getConfidence())
                .build();
        eventRepository.save(event);
    }

    public List<SessionResponse> getMySessionHistory() {
        User student = securityUtil.getCurrentUser();
        return sessionRepository.findByStudentId(student.getId())
                .stream().map(this::toResponse).toList();
    }

    public List<SessionResponse> getSessionsByRoom(Long roomId) {
        return sessionRepository.findByRoomId(roomId)
                .stream().map(this::toResponse).toList();
    }

    public MonitoringSession findById(Long id) {
        return sessionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SESSION_NOT_FOUND));
    }

    private MonitoringSession findActiveSessionById(Long id) {
        MonitoringSession session = findById(id);
        if (session.getStatus() != MonitoringSession.SessionStatus.ACTIVE)
            throw new AppException(ErrorCode.SESSION_NOT_ACTIVE);
        return session;
    }

    private void checkSessionOwnership(MonitoringSession session) {
        User current = securityUtil.getCurrentUser();
        if (!session.getStudent().getId().equals(current.getId()))
            throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    private String buildFolderName(User student, Room room) {
        String studentSlug = student.getFullName()
                .toLowerCase().replaceAll("\\s+", "_").replaceAll("[^a-z0-9_]", "");
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));
        return studentSlug + "_" + room.getSubject().getCode() + "_" + date + "/";
    }

    public SessionResponse toResponse(MonitoringSession s) {
        return SessionResponse.builder()
                .id(s.getId())
                .studentId(s.getStudent().getId())
                .studentName(s.getStudent().getFullName())
                .roomId(s.getRoom().getId())
                .roomName(s.getRoom().getName())
                .roomCode(s.getRoom().getCode())
                .mode(s.getMode())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .status(s.getStatus())
                .evidenceFolder(s.getEvidenceFolder())
                .tabHiddenCount(s.getTabHiddenCount())
                .fullscreenExitCount(s.getFullscreenExitCount())
                .build();
    }
}
