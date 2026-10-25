
package com.creative.collaboration.dto;

import java.time.LocalDateTime;

public record PostCommentResponse(
        Long commentId,
        Long postId,
        Long userId,
        String username,
        String content,
        LocalDateTime createdAt,
        boolean ownComment
) {}
