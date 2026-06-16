package com.ai.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class AuthDtos {

    public record RegisterRequest(
        @NotBlank String name,
        @Email String email,
        @NotBlank String password
    ) {}

    public record LoginRequest(
        @Email String email,
        @NotBlank String password
    ) {}

    public record AuthResponse(
        Long userId,
        String name,
        String email,
        String token
    ) {}
}
