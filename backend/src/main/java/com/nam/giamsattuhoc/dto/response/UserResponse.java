package com.nam.giamsattuhoc.dto.response;
import com.nam.giamsattuhoc.entity.User;
import lombok.*;
import java.time.LocalDateTime;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private User.Role role;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
