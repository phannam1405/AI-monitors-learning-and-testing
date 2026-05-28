package com.nam.giamsattuhoc.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class VerifyExamPasswordRequest {
    @NotBlank private String password;
}
