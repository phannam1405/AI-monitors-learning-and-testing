package com.nam.giamsattuhoc.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CreateSubjectRequest {
    @NotBlank private String name;
    @NotBlank @Size(max=20) private String code;
    private String description;
}
