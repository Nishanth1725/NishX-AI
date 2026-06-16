package com.ai.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class AiChatDtos {

    public record ChatRequest(
        Long datasetId,
        @NotBlank String message
    ) {}

    public record ChatResponse(String response) {}
}
