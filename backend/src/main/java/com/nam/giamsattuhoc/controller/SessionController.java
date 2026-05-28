package com.nam.giamsattuhoc.controller;
import com.nam.giamsattuhoc.dto.request.LogEventRequest;
import com.nam.giamsattuhoc.dto.request.StartSessionRequest;
import com.nam.giamsattuhoc.dto.response.ApiResponse;
import com.nam.giamsattuhoc.service.SessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {
    private final SessionService sessionService;
    @PostMapping("/start")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<?> start(@Valid @RequestBody StartSessionRequest req) {
        return ApiResponse.success("Bắt đầu giám sát", sessionService.startSession(req));
    }
    @PostMapping("/{id}/end")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<?> end(@PathVariable Long id) {
        return ApiResponse.success("Kết thúc giám sát", sessionService.endSession(id));
    }
    @PostMapping("/{id}/heartbeat")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<?> heartbeat(@PathVariable Long id) {
        sessionService.heartbeat(id);
        return ApiResponse.success("OK", null);
    }
    @PostMapping("/{id}/event")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<?> logEvent(@PathVariable Long id, @Valid @RequestBody LogEventRequest req) {
        sessionService.logEvent(id, req);
        return ApiResponse.success("Event logged", null);
    }
    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<?> myHistory() {
        return ApiResponse.success(sessionService.getMySessionHistory());
    }
}
