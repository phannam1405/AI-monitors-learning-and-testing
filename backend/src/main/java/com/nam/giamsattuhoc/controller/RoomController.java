package com.nam.giamsattuhoc.controller;
import com.nam.giamsattuhoc.dto.request.CreateRoomRequest;
import com.nam.giamsattuhoc.dto.request.JoinRoomRequest;
import com.nam.giamsattuhoc.dto.response.ApiResponse;
import com.nam.giamsattuhoc.service.RoomService;
import com.nam.giamsattuhoc.service.SessionService;
import com.nam.giamsattuhoc.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {
    private final RoomService roomService;
    private final SessionService sessionService;
    private final ReportService reportService;
    @GetMapping("/my")
    @PreAuthorize("hasRole('TEACHER')")
    public ApiResponse<?> getMyRooms() {
        return ApiResponse.success(roomService.getMyRooms());
    }
    @GetMapping("/{id}")
    public ApiResponse<?> getOne(@PathVariable Long id) {
        return ApiResponse.success(roomService.getById(id));
    }
    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ApiResponse<?> create(@Valid @RequestBody CreateRoomRequest req) {
        return ApiResponse.success("Tạo phòng thành công", roomService.create(req));
    }
    @PutMapping("/{id}/toggle")
    @PreAuthorize("hasRole('TEACHER')")
    public ApiResponse<?> toggle(@PathVariable Long id) {
        return ApiResponse.success(roomService.toggleOpen(id));
    }
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public ApiResponse<?> delete(@PathVariable Long id) {
        roomService.delete(id);
        return ApiResponse.success("Đã xoá phòng", null);
    }
    @PostMapping("/join")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<?> join(@Valid @RequestBody JoinRoomRequest req) {
        return ApiResponse.success(roomService.joinRoom(req.getCode()));
    }
    @GetMapping("/{id}/sessions")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    public ApiResponse<?> getSessions(@PathVariable Long id) {
        return ApiResponse.success(sessionService.getSessionsByRoom(id));
    }
    @GetMapping("/{id}/reports")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    public ApiResponse<?> getReports(@PathVariable Long id) {
        return ApiResponse.success(reportService.getReportsByRoom(id));
    }
}
