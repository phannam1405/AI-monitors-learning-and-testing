package com.nam.giamsattuhoc.controller;
import com.nam.giamsattuhoc.dto.request.LoginRequest;
import com.nam.giamsattuhoc.dto.request.RegisterRequest;
import com.nam.giamsattuhoc.dto.response.ApiResponse;
import com.nam.giamsattuhoc.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    @PostMapping("/register")
    public ApiResponse<?> register(@Valid @RequestBody RegisterRequest req) {
        return ApiResponse.success("Đăng ký thành công", authService.register(req));
    }
    @PostMapping("/login")
    public ApiResponse<?> login(@Valid @RequestBody LoginRequest req) {
        return ApiResponse.success(authService.login(req));
    }
    @GetMapping("/me")
    public ApiResponse<?> me() {
        return ApiResponse.success(authService.getMe());
    }
}
