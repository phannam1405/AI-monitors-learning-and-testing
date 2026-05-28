package com.nam.giamsattuhoc.dto.request;
import com.nam.giamsattuhoc.entity.User;
import jakarta.validation.constraints.*;
import lombok.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class UpdateRoleRequest {
    @NotNull private User.Role role;
}
