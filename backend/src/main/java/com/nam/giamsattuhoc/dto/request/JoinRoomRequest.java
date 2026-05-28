package com.nam.giamsattuhoc.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class JoinRoomRequest {
    @NotBlank private String code;
}
