package com.creative.collaboration.dto;

import java.time.LocalDateTime;
import java.util.List;

public record PostResponse(

        Long postId,

        Long userId,

        String username,

        String caption,

        List<PostMediaResponse> media,

        LocalDateTime createdAt,

        LocalDateTime updatedAt

) {
}