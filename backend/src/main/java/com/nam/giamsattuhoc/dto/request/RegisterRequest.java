package com.nam.giamsattuhoc.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class RegisterRequest {
    @NotBlank @Size(min=3,max=50) private String username;
    @NotBlank @Email private String email;
    @NotBlank @Size(min=6) private String password;
    @NotBlank private String fullName;
}
