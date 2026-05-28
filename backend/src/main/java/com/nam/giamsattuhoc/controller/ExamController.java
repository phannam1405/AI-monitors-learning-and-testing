package com.nam.giamsattuhoc.controller;
import com.nam.giamsattuhoc.dto.request.CreateExamRequest;
import com.nam.giamsattuhoc.dto.request.CreateQuestionRequest;
import com.nam.giamsattuhoc.dto.request.VerifyExamPasswordRequest;
import com.nam.giamsattuhoc.dto.response.ApiResponse;
import com.nam.giamsattuhoc.service.ExamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
public class ExamController {
    private final ExamService examService;
    @GetMapping("/my")
    @PreAuthorize("hasRole('TEACHER')")
    public ApiResponse<?> getMyExams() {
        return ApiResponse.success(examService.getMyExams());
    }
    @GetMapping("/subject/{subjectId}")
    public ApiResponse<?> getBySubject(@PathVariable Long subjectId) {
        return ApiResponse.success(examService.getExamsBySubject(subjectId));
    }
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    public ApiResponse<?> getOne(@PathVariable Long id) {
        return ApiResponse.success(examService.getById(id));
    }
    @GetMapping("/{id}/take")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<?> takeExam(@PathVariable Long id) {
        return ApiResponse.success(examService.getExamForStudent(id));
    }
    @PostMapping("/{id}/verify-password")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<?> verifyPassword(@PathVariable Long id,
            @Valid @RequestBody VerifyExamPasswordRequest req) {
        boolean ok = examService.verifyPassword(id, req.getPassword());
        if (!ok) return ApiResponse.error(4003, "Mật khẩu phòng thi không đúng");
        return ApiResponse.success("Xác thực thành công", true);
    }
    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ApiResponse<?> create(@Valid @RequestBody CreateExamRequest req) {
        return ApiResponse.success("Tạo đề thi thành công", examService.create(req));
    }
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public ApiResponse<?> update(@PathVariable Long id, @Valid @RequestBody CreateExamRequest req) {
        return ApiResponse.success(examService.update(id, req));
    }
    @PutMapping("/{id}/toggle")
    @PreAuthorize("hasRole('TEACHER')")
    public ApiResponse<?> toggle(@PathVariable Long id) {
        return ApiResponse.success(examService.toggleActive(id));
    }
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public ApiResponse<?> delete(@PathVariable Long id) {
        examService.delete(id);
        return ApiResponse.success("Đã xoá đề thi", null);
    }
    @PostMapping("/{id}/questions")
    @PreAuthorize("hasRole('TEACHER')")
    public ApiResponse<?> addQuestion(@PathVariable Long id, @Valid @RequestBody CreateQuestionRequest req) {
        return ApiResponse.success(examService.addQuestion(id, req));
    }
    @PutMapping("/questions/{questionId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ApiResponse<?> updateQuestion(@PathVariable Long questionId, @Valid @RequestBody CreateQuestionRequest req) {
        return ApiResponse.success(examService.updateQuestion(questionId, req));
    }
    @DeleteMapping("/questions/{questionId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ApiResponse<?> deleteQuestion(@PathVariable Long questionId) {
        examService.deleteQuestion(questionId);
        return ApiResponse.success("Đã xoá câu hỏi", null);
    }
}
