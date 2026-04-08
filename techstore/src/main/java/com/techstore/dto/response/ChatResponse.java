package com.techstore.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChatResponse {
    private String type;
    private String content;
}
