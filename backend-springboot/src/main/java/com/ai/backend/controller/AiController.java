package com.ai.backend.controller;

import com.ai.backend.model.ChatHistory;
import com.ai.backend.dto.AiChatDtos.ChatRequest;
import com.ai.backend.dto.AiChatDtos.ChatResponse;
import com.ai.backend.security.UserPrincipal;
import com.ai.backend.service.AiAssistantService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiAssistantService aiAssistantService;

    public AiController(AiAssistantService aiAssistantService) {
        this.aiAssistantService = aiAssistantService;
    }

    @GetMapping("/history")
    public List<ChatHistory> history(@AuthenticationPrincipal UserPrincipal principal) {
        return aiAssistantService.getHistory(principal.getId());
    }

    @PostMapping("/chat")
    public ChatResponse chat(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody ChatRequest request
    ) {
        return new ChatResponse(aiAssistantService.chat(principal.getId(), request));
    }
}
