package com.nam.giamsattuhoc.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nam.giamsattuhoc.dto.response.ReportResponse;
import com.nam.giamsattuhoc.entity.*;
import com.nam.giamsattuhoc.exception.AppException;
import com.nam.giamsattuhoc.exception.ErrorCode;
import com.nam.giamsattuhoc.repository.MonitoringEventRepository;
import com.nam.giamsattuhoc.repository.ReportRepository;
import com.nam.giamsattuhoc.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final ReportRepository reportRepository;
    private final MonitoringEventRepository eventRepository;
    private final SecurityUtil securityUtil;
    private final ObjectMapper objectMapper;

    @Transactional
    public Report generateReport(MonitoringSession session) {
        List<MonitoringEvent> events = eventRepository
                .findBySessionIdOrderByOccurredAtAsc(session.getId());

        // Tổng thời gian session
        LocalDateTime start = session.getStartTime();
        LocalDateTime end = session.getEndTime() != null ? session.getEndTime() : LocalDateTime.now();
        long totalSeconds = Duration.between(start, end).getSeconds();

        // Đếm theo loại event
        int drowsyCount = 0, sleepCount = 0, phoneCount = 0, headDownCount = 0, cheatingCount = 0;
        float drowsySeconds = 0, sleepSeconds = 0, phoneSeconds = 0;

        for (MonitoringEvent e : events) {
            float dur = e.getDurationSeconds() != null ? e.getDurationSeconds() : 3f;
            switch (e.getEventType()) {
                case DROWSY -> { drowsyCount++; drowsySeconds += dur; }
                case SLEEP -> { sleepCount++; sleepSeconds += dur; }
                case PHONE -> { phoneCount++; phoneSeconds += dur; }
                case HEAD_DOWN -> headDownCount++;
                case CHEATING, FULLSCREEN_EXIT -> cheatingCount++;
                default -> {}
            }
        }

        float nonFocusedSeconds = drowsySeconds + sleepSeconds + phoneSeconds;
        float focusedSeconds = Math.max(0, totalSeconds - nonFocusedSeconds);
        float focusPercentage = totalSeconds > 0
                ? Math.round((focusedSeconds / totalSeconds) * 1000f) / 10f : 100f;

        // Tạo timeline summary JSON theo phút
        String summaryJson = buildSummaryJson(events, start, end);

        Report report = Report.builder()
                .session(session)
                .focusedSeconds((int) focusedSeconds)
                .drowsySeconds((int) drowsySeconds)
                .sleepSeconds((int) sleepSeconds)
                .phoneSeconds((int) phoneSeconds)
                .headDownCount(headDownCount)
                .drowsyCount(drowsyCount)
                .sleepCount(sleepCount)
                .phoneCount(phoneCount)
                .cheatingCount(cheatingCount)
                .focusPercentage(focusPercentage)
                .generatedAt(LocalDateTime.now())
                .summaryJson(summaryJson)
                .build();

        return reportRepository.save(report);
    }

    public ReportResponse getBySessionId(Long sessionId) {
        Report report = reportRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new AppException(ErrorCode.SESSION_NOT_FOUND));
        checkViewPermission(report.getSession());
        return toResponse(report);
    }

    public List<ReportResponse> getMyReports() {
        User student = securityUtil.getCurrentUser();
        return reportRepository.findBySessionStudentId(student.getId())
                .stream().map(this::toResponse).toList();
    }

    public List<ReportResponse> getReportsByRoom(Long roomId) {
        return reportRepository.findBySessionRoomId(roomId)
                .stream().map(this::toResponse).toList();
    }

    public List<ReportResponse> getReportsByStudent(Long studentId) {
        return reportRepository.findBySessionStudentId(studentId)
                .stream().map(this::toResponse).toList();
    }

    // ── Private ──

    private String buildSummaryJson(List<MonitoringEvent> events, LocalDateTime start, LocalDateTime end) {
        try {
            long totalMinutes = Math.max(1, Duration.between(start, end).toMinutes());
            List<Map<String, Object>> timeline = new ArrayList<>();

            for (int m = 0; m < totalMinutes; m++) {
                LocalDateTime mStart = start.plusMinutes(m);
                LocalDateTime mEnd = mStart.plusMinutes(1);
                String state = "focused";

                // Tìm event nào xảy ra trong phút này
                for (MonitoringEvent e : events) {
                    if (!e.getOccurredAt().isBefore(mStart) && e.getOccurredAt().isBefore(mEnd)) {
                        state = e.getEventType().name().toLowerCase();
                        break;
                    }
                }
                Map<String, Object> point = new LinkedHashMap<>();
                point.put("minute", m + 1);
                point.put("state", state);
                timeline.add(point);
            }
            return objectMapper.writeValueAsString(timeline);
        } catch (Exception e) {
            log.error("Error building summary JSON", e);
            return "[]";
        }
    }

    private void checkViewPermission(MonitoringSession session) {
        User current = securityUtil.getCurrentUser();
        boolean isOwner = session.getStudent().getId().equals(current.getId());
        boolean isTeacher = session.getRoom().getTeacher().getId().equals(current.getId());
        boolean isAdmin = current.getRole() == User.Role.ADMIN;
        if (!isOwner && !isTeacher && !isAdmin)
            throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    private ReportResponse toResponse(Report r) {
        return ReportResponse.builder()
                .id(r.getId())
                .sessionId(r.getSession().getId())
                .studentName(r.getSession().getStudent().getFullName())
                .roomName(r.getSession().getRoom().getName())
                .mode(r.getSession().getMode().name())
                .focusedSeconds(r.getFocusedSeconds())
                .drowsySeconds(r.getDrowsySeconds())
                .sleepSeconds(r.getSleepSeconds())
                .phoneSeconds(r.getPhoneSeconds())
                .headDownCount(r.getHeadDownCount())
                .drowsyCount(r.getDrowsyCount())
                .sleepCount(r.getSleepCount())
                .phoneCount(r.getPhoneCount())
                .cheatingCount(r.getCheatingCount())
                .focusPercentage(r.getFocusPercentage())
                .generatedAt(r.getGeneratedAt())
                .summaryJson(r.getSummaryJson())
                .build();
    }
}
