package com.nam.giamsattuhoc.controller;
import com.nam.giamsattuhoc.dto.response.ApiResponse;
import com.nam.giamsattuhoc.service.ReportService;
import com.nam.giamsattuhoc.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {
    private final ReportService reportService;
    private final SubmissionService submissionService;
    @GetMapping("/session/{sessionId}")
    public ApiResponse<?> getBySession(@PathVariable Long sessionId) {
        return ApiResponse.success(reportService.getBySessionId(sessionId));
    }
    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<?> myReports() {
        return ApiResponse.success(reportService.getMyReports());
    }
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    public ApiResponse<?> byStudent(@PathVariable Long studentId) {
        return ApiResponse.success(reportService.getReportsByStudent(studentId));
    }
}
