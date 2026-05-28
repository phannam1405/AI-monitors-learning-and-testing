package com.nam.giamsattuhoc.service;

import com.nam.giamsattuhoc.dto.request.LoginRequest;
import com.nam.giamsattuhoc.dto.request.RegisterRequest;
import com.nam.giamsattuhoc.dto.response.AuthResponse;
import com.nam.giamsattuhoc.dto.response.UserResponse;
import com.nam.giamsattuhoc.entity.User;
import com.nam.giamsattuhoc.exception.AppException;
import com.nam.giamsattuhoc.exception.ErrorCode;
import com.nam.giamsattuhoc.repository.UserRepository;
import com.nam.giamsattuhoc.util.JwtUtil;
import com.nam.giamsattuhoc.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final SecurityUtil securityUtil;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername()))
            throw new AppException(ErrorCode.USERNAME_EXISTED);
        if (userRepository.existsByEmail(request.getEmail()))
            throw new AppException(ErrorCode.EMAIL_EXISTED);

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(User.Role.STUDENT)
                .isActive(true)
                .build();

        userRepository.save(user);
        String token = jwtUtil.generateAccessToken(user);
        return AuthResponse.builder()
                .accessToken(token)
                .user(toUserResponse(user))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!user.getIsActive())
            throw new AppException(ErrorCode.ACCOUNT_DISABLED);

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword()))
            throw new AppException(ErrorCode.WRONG_PASSWORD);

        String accessToken = jwtUtil.generateAccessToken(user);
        return AuthResponse.builder()
                .accessToken(accessToken)
                .user(toUserResponse(user))
                .build();
    }

    public UserResponse getMe() {
        User user = securityUtil.getCurrentUser();
        return toUserResponse(user);
    }

    public static UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
