package com.nam.giamsattuhoc.controller;
import com.nam.giamsattuhoc.dto.request.CreateSubjectRequest;
import com.nam.giamsattuhoc.dto.response.ApiResponse;
import com.nam.giamsattuhoc.service.SubjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
public class SubjectController {
    private final SubjectService subjectService;
    @GetMapping
    public ApiResponse<?> getAll() {
        return ApiResponse.success(subjectService.getAllSubjects());
    }
    @GetMapping("/my")
    @PreAuthorize("hasRole('TEACHER')")
    public ApiResponse<?> getMine() {
        return ApiResponse.success(subjectService.getMySubjects());
    }
    @GetMapping("/{id}")
    public ApiResponse<?> getOne(@PathVariable Long id) {
        return ApiResponse.success(subjectService.getById(id));
    }
    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ApiResponse<?> create(@Valid @RequestBody CreateSubjectRequest req) {
        return ApiResponse.success("Tạo môn học thành công", subjectService.create(req));
    }
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public ApiResponse<?> update(@PathVariable Long id, @Valid @RequestBody CreateSubjectRequest req) {
        return ApiResponse.success(subjectService.update(id, req));
    }
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public ApiResponse<?> delete(@PathVariable Long id) {
        subjectService.delete(id);
        return ApiResponse.success("Đã xoá môn học", null);
    }
}
