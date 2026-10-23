
package com.creative.collaboration.repository;

import com.creative.collaboration.entity.PostComment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostCommentRepository
        extends JpaRepository<PostComment, Long> {

    List<PostComment>
    findByPost_IdOrderByCreatedAtAscIdAsc(
            Long postId
    );
}
