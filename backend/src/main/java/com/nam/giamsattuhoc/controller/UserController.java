package com.nam.giamsattuhoc.controller;
import com.nam.giamsattuhoc.dto.request.UpdateRoleRequest;
import com.nam.giamsattuhoc.dto.response.ApiResponse;
import com.nam.giamsattuhoc.entity.User;
import com.nam.giamsattuhoc.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserController {
    private final UserService userService;
    @GetMapping("/users")
    public ApiResponse<?> getAllUsers(@RequestParam(required = false) User.Role role) {
        return ApiResponse.success(role != null ? userService.getUsersByRole(role) : userService.getAllUsers());
    }
    @GetMapping("/users/{id}")
    public ApiResponse<?> getUser(@PathVariable Long id) {
        return ApiResponse.success(userService.getUserById(id));
    }
    @PutMapping("/users/{id}/role")
    public ApiResponse<?> updateRole(@PathVariable Long id, @Valid @RequestBody UpdateRoleRequest req) {
        return ApiResponse.success(userService.updateRole(id, req));
    }
    @PutMapping("/users/{id}/status")
    public ApiResponse<?> toggleStatus(@PathVariable Long id) {
        return ApiResponse.success(userService.toggleStatus(id));
    }
    @DeleteMapping("/users/{id}")
    public ApiResponse<?> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ApiResponse.success("Đã xoá tài khoản", null);
    }
}
