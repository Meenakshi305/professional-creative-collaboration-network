
package com.creative.collaboration.dto;

public record PostLikeResponse(
        Long postId,
        long likeCount,
        boolean likedByMe
) {
}
