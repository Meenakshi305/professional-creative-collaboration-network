
package com.creative.collaboration.service;

import com.creative.collaboration.entity.FlaggedComment;
import com.creative.collaboration.repository.FlaggedCommentRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import jakarta.annotation.PostConstruct;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class CommentWordModerationService {

    private static final Logger log =
            LoggerFactory.getLogger(CommentWordModerationService.class);

    private final FlaggedCommentRepository flagRepository;
    private final CommentViolationService violationService;

    private volatile List<String> badWords = List.of();

    public CommentWordModerationService(
            FlaggedCommentRepository flagRepository,
            CommentViolationService violationService
    ) {
        this.flagRepository = flagRepository;
        this.violationService = violationService;
    }

    // ==========================================
    // 1. LOAD BAD WORDS FROM badwords.txt
    // ==========================================

    @PostConstruct
    public void loadBadWords() {

        Set<String> loaded = new LinkedHashSet<>();

        ClassPathResource resource =
                new ClassPathResource("badwords.txt");

        if (!resource.exists()) {
            throw new IllegalStateException(
                    "badwords.txt is missing from src/main/resources"
            );
        }

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(
                        resource.getInputStream(),
                        StandardCharsets.UTF_8
                )
        )) {
            String line;

            while ((line = reader.readLine()) != null) {

                String word = line
                        .trim()
                        .toLowerCase(Locale.ROOT);

                if (word.isEmpty() || word.startsWith("#")) {
                    continue;
                }

                loaded.add(word);
            }

        } catch (Exception ex) {
            throw new IllegalStateException(
                    "Unable to read badwords.txt",
                    ex
            );
        }

        badWords = List.copyOf(loaded);

        log.info(
                "[MODERATION] Loaded {} prohibited terms from badwords.txt",
                badWords.size()
        );
    }

    // ==========================================
    // 2. DETECT BAD WORDS IN COMMENT TEXT
    // ==========================================

    public List<String> detectWords(String text) {

        List<String> matches = new ArrayList<>();

        if (text == null || text.isBlank()) {
            return matches;
        }

        for (String word : badWords) {

            String regex =
                    "(?<![\\p{L}\\p{N}])"
                            + Pattern.quote(word)
                            + "(?![\\p{L}\\p{N}])";

            Pattern pattern = Pattern.compile(
                    regex,
                    Pattern.CASE_INSENSITIVE |
                            Pattern.UNICODE_CASE
            );

            if (pattern.matcher(text).find()) {
                matches.add(word);
            }
        }

        return matches;
    }

    // ==========================================
    // 3. FLAG MATCHING COMMENTS AUTOMATICALLY
    // ==========================================

    @Transactional
    public void checkAndFlag(
            Long commentId,
            Long postId,
            Long authorId,
            String commentText
    ) {

        if (commentId == null ||
                postId == null ||
                authorId == null) {
            throw new IllegalArgumentException(
                    "Comment, post and author IDs are required"
            );
        }

        if (flagRepository.findByCommentId(commentId).isPresent()) {
            return;
        }

        List<String> matches = detectWords(commentText);

        log.info(
                "[MODERATION] Comment {} matched terms: {}",
                commentId,
                matches
        );

        if (matches.isEmpty()) {
            return;
        }

        String matchedWords = String.join(", ", matches);

        if (matchedWords.length() > 1000) {
            matchedWords = matchedWords.substring(0, 1000);
        }

        FlaggedComment flag = new FlaggedComment();

        flag.setCommentId(commentId);
        flag.setPostId(postId);
        flag.setCommentUserId(authorId);
        flag.setCommentText(commentText);
        flag.setMatchedWords(matchedWords);
        flag.setStatus("PENDING");

        FlaggedComment saved =
                flagRepository.saveAndFlush(flag);

        log.info(
                "[MODERATION] Flag {} created for comment {}",
                saved.getId(),
                commentId
        );
    }

    // ==========================================
    // 4. ADMIN / SUPERADMIN REVIEW
    // ==========================================

    @Transactional
    public FlaggedComment review(
            Long flagId,
            Long reviewerId,
            String decision,
            String note
    ) {

        if (flagId == null || reviewerId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Flag and reviewer IDs are required"
            );
        }

        if (decision == null || note == null ||
                note.trim().length() < 5) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A valid decision and review note are required"
            );
        }

        String normalized =
                decision.trim().toUpperCase(Locale.ROOT);

        if (!normalized.equals("UPHELD") &&
                !normalized.equals("DISMISSED")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Decision must be UPHELD or DISMISSED"
            );
        }

        int updated = flagRepository.claimDecision(
                flagId,
                reviewerId,
                normalized,
                note.trim(),
                LocalDateTime.now()
        );

        if (updated != 1) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Flag already reviewed or not found"
            );
        }

        FlaggedComment flag =
                flagRepository.findById(flagId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Flag not found"
                                )
                        );

        if ("UPHELD".equals(normalized)) {
            boolean deactivated =
                    violationService.deactivateIfThresholdReached(
                            flag.getCommentUserId()
                    );

            log.info(
                    "[MODERATION] Confirmed violation for user {}, deactivated={}",
                    flag.getCommentUserId(),
                    deactivated
            );
        }

        return flag;
    }
}
