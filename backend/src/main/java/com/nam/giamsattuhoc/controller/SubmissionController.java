package com.nam.giamsattuhoc.controller;
import com.nam.giamsattuhoc.dto.request.SubmitExamRequest;
import com.nam.giamsattuhoc.dto.response.ApiResponse;
import com.nam.giamsattuhoc.service.SubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
public class SubmissionController {
    private final SubmissionService submissionService;
    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<?> submit(@Valid @RequestBody SubmitExamRequest req) {
        return ApiResponse.success("Nộp bài thành công", submissionService.submit(req));
    }
    @GetMapping("/session/{sessionId}")
    public ApiResponse<?> getBySession(@PathVariable Long sessionId) {
        return ApiResponse.success(submissionService.getBySessionId(sessionId));
    }
    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<?> mySubmissions() {
        return ApiResponse.success(submissionService.getMySubmissions());
    }
}
