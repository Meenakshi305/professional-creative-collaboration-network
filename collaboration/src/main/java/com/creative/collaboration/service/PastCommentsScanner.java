
package com.creative.collaboration.service;

import com.creative.collaboration.entity.PostComment;
import com.creative.collaboration.repository.PostCommentRepository;
import com.creative.collaboration.repository.FlaggedCommentRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PastCommentsScanner implements ApplicationRunner {

    private static final Logger log =
            LoggerFactory.getLogger(PastCommentsScanner.class);

    private static final int BATCH_SIZE = 200;

    private final PostCommentRepository comments;
    private final FlaggedCommentRepository flags;
    private final CommentWordModerationService moderation;

    public PastCommentsScanner(
            PostCommentRepository comments,
            FlaggedCommentRepository flags,
            CommentWordModerationService moderation
    ) {
        this.comments = comments;
        this.flags = flags;
        this.moderation = moderation;
    }

    @Override
    public void run(ApplicationArguments args) {

        if (!args.containsOption("scan-past-comments")) {
            return;
        }

        scanPastComments();
    }

    public void scanPastComments() {

        log.info(
                "[PAST SCAN] Starting scan using badwords.txt"
        );

        long lastId = 0L;
        long scanned = 0;
        long flagged = 0;
        long skipped = 0;

        while (true) {

            List<PostComment> batch =
                    comments.findNextBatchForModeration(
                            lastId,
                            PageRequest.of(0, BATCH_SIZE)
                    );

            if (batch.isEmpty()) {
                break;
            }

            for (PostComment comment : batch) {

                lastId = comment.getId();
                scanned++;

                if (flags.findByCommentId(comment.getId())
                        .isPresent()) {
                    skipped++;
                    continue;
                }

                List<String> matches =
                        moderation.detectWords(comment.getContent());

                if (matches.isEmpty()) {
                    continue;
                }

                moderation.checkAndFlag(
                        comment.getId(),
                        comment.getPost().getId(),
                        comment.getUser().getId(),
                        comment.getContent()
                );

                flagged++;

                log.info(
                        "[PAST SCAN] Comment {} matched {}",
                        comment.getId(),
                        matches
                );
            }
        }

        log.info(
                "[PAST SCAN] COMPLETE. Scanned={}, " +
                        "Matching processed={}, Previously flagged={}",
                scanned,
                flagged,
                skipped
        );
    }
}
