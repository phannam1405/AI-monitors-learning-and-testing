package com.nam.giamsattuhoc.service;

import com.nam.giamsattuhoc.dto.request.UpdateRoleRequest;
import com.nam.giamsattuhoc.dto.response.UserResponse;
import com.nam.giamsattuhoc.entity.User;
import com.nam.giamsattuhoc.exception.AppException;
import com.nam.giamsattuhoc.exception.ErrorCode;
import com.nam.giamsattuhoc.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(AuthService::toUserResponse)
                .toList();
    }

    public List<UserResponse> getUsersByRole(User.Role role) {
        return userRepository.findByRole(role).stream()
                .map(AuthService::toUserResponse)
                .toList();
    }

    public UserResponse getUserById(Long id) {
        return AuthService.toUserResponse(findById(id));
    }

    @Transactional
    public UserResponse updateRole(Long id, UpdateRoleRequest request) {
        User user = findById(id);
        if (user.getRole() == User.Role.ADMIN)
            throw new AppException(ErrorCode.CANNOT_CHANGE_ADMIN_ROLE);
        user.setRole(request.getRole());
        return AuthService.toUserResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse toggleStatus(Long id) {
        User user = findById(id);
        if (user.getRole() == User.Role.ADMIN)
            throw new AppException(ErrorCode.CANNOT_CHANGE_ADMIN_ROLE);
        user.setIsActive(!user.getIsActive());
        return AuthService.toUserResponse(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = findById(id);
        if (user.getRole() == User.Role.ADMIN)
            throw new AppException(ErrorCode.CANNOT_CHANGE_ADMIN_ROLE);
        userRepository.delete(user);
    }

    private User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }
}
