package com.nam.giamsattuhoc.configuration;

import com.nam.giamsattuhoc.entity.User;
import com.nam.giamsattuhoc.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class ApplicationInitConfig {

    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username}")
    private String adminUsername;
    @Value("${app.admin.password}")
    private String adminPassword;
    @Value("${app.admin.email}")
    private String adminEmail;
    @Value("${app.admin.full-name}")
    private String adminFullName;

    @Bean
    public ApplicationRunner applicationRunner(UserRepository userRepository) {
        return args -> {
            if (!userRepository.existsByUsername(adminUsername)) {
                User admin = User.builder()
                        .username(adminUsername)
                        .email(adminEmail)
                        .password(passwordEncoder.encode(adminPassword))
                        .fullName(adminFullName)
                        .role(User.Role.ADMIN)
                        .isActive(true)
                        .build();
                userRepository.save(admin);
                log.info("✅ Admin mặc định đã được tạo: username={}", adminUsername);
            }
        };
    }
}
