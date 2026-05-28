package com.nam.giamsattuhoc.util;

import com.nam.giamsattuhoc.entity.User;
import com.nam.giamsattuhoc.exception.AppException;
import com.nam.giamsattuhoc.exception.ErrorCode;
import com.nam.giamsattuhoc.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SecurityUtil {

    private final UserRepository userRepository;

    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        Jwt jwt = (Jwt) auth.getPrincipal();
        Long userId = Long.parseLong(jwt.getSubject());
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    public Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        Jwt jwt = (Jwt) auth.getPrincipal();
        return Long.parseLong(jwt.getSubject());
    }
}
