package com.creative.collaboration.service;

import com.creative.collaboration.dto.PostMediaResponse;
import com.creative.collaboration.dto.PostResponse;
import com.creative.collaboration.dto.UpdatePostRequest;
import com.creative.collaboration.entity.MediaType;
import com.creative.collaboration.entity.Post;
import com.creative.collaboration.entity.PostMedia;
import com.creative.collaboration.entity.User;
import com.creative.collaboration.exception.ResourceNotFoundException;
import com.creative.collaboration.repository.PostRepository;
import com.creative.collaboration.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class PostService {

    private final PostRepository postRepository;

    private final UserRepository userRepository;

    private final MegaStorageService megaStorageService;


    public PostService(
            PostRepository postRepository,
            UserRepository userRepository,
            MegaStorageService megaStorageService
    ) {

        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.megaStorageService = megaStorageService;
    }


    // =========================================
    // CREATE POST
    // POST /api/posts
    // =========================================

    public PostResponse createPost(
            Long userId,
            String caption,
            List<MultipartFile> files
    ) {

        User user =
                findUser(userId);


        boolean captionEmpty =
                caption == null
                        || caption.isBlank();


        boolean filesEmpty =
                files == null
                        || files.stream()
                        .allMatch(
                                file ->
                                        file == null
                                                || file.isEmpty()
                        );


        if (captionEmpty && filesEmpty) {

            throw new IllegalArgumentException(
                    "Post must contain a caption or media"
            );
        }


        Post post =
                Post.builder()
                        .user(user)
                        .caption(
                                captionEmpty
                                        ? null
                                        : caption.trim()
                        )
                        .build();


        List<String> uploadedStorageKeys =
                new ArrayList<>();


        try {

            if (files != null) {

                for (MultipartFile file : files) {

                    if (
                            file == null
                                    || file.isEmpty()
                    ) {
                        continue;
                    }


                    MediaType mediaType =
                            detectMediaType(file);


                    MegaStorageService.StoredFile storedFile =
                            megaStorageService.upload(
                                    file
                            );


                    uploadedStorageKeys.add(
                            storedFile.storageKey()
                    );


                    PostMedia postMedia =
                            PostMedia.builder()
                                    .post(post)

                                    .mediaType(
                                            mediaType
                                    )

                                    .storageKey(
                                            storedFile.storageKey()
                                    )

                                    .originalFileName(
                                            storedFile.originalFileName()
                                    )

                                    .contentType(
                                            storedFile.contentType()
                                    )

                                    .fileSize(
                                            storedFile.fileSize()
                                    )

                                    .build();


                    post.getMedia()
                            .add(postMedia);
                }
            }


            Post savedPost =
                    postRepository.save(
                            post
                    );


            return convertToResponse(
                    savedPost
            );


        } catch (RuntimeException exception) {

            /*
             * If something fails after files were
             * uploaded to MEGA, clean them up.
             */

            for (
                    String storageKey
                    :
                    uploadedStorageKeys
            ) {

                try {

                    megaStorageService.delete(
                            storageKey
                    );

                } catch (Exception ignored) {

                }
            }


            throw exception;
        }
    }


    // =========================================
    // GET ONE POST
    // GET /api/posts/{postId}
    // =========================================

    @Transactional(readOnly = true)
    public PostResponse getPost(
            Long postId
    ) {

        Post post =
                findPost(postId);


        return convertToResponse(
                post
        );
    }


    // =========================================
    // MY POSTS
    // GET /api/posts/me
    // =========================================

    @Transactional(readOnly = true)
    public List<PostResponse> getMyPosts(
            Long userId
    ) {

        findUser(userId);


        return postRepository
                .findByUser_IdOrderByCreatedAtDesc(
                        userId
                )
                .stream()
                .map(
                        this::convertToResponse
                )
                .toList();
    }


    // =========================================
    // POSTS ON SOMEONE'S PROFILE
    // GET /api/users/{userId}/posts
    // =========================================

    @Transactional(readOnly = true)
    public List<PostResponse> getUserPosts(
            Long userId
    ) {

        findUser(userId);


        return postRepository
                .findByUser_IdOrderByCreatedAtDesc(
                        userId
                )
                .stream()
                .map(
                        this::convertToResponse
                )
                .toList();
    }


    // =========================================
    // EDIT POST
    // PUT /api/posts/{postId}
    // =========================================

    public PostResponse updatePost(
            Long postId,
            Long loggedInUserId,
            UpdatePostRequest request
    ) {

        Post post =
                findPost(postId);


        verifyOwner(
                post,
                loggedInUserId
        );


        if (request == null) {

            throw new IllegalArgumentException(
                    "Update request cannot be empty"
            );
        }


        post.setCaption(
                request.caption()
        );


        Post updatedPost =
                postRepository.save(
                        post
                );


        return convertToResponse(
                updatedPost
        );
    }


    // =========================================
    // DELETE POST
    // DELETE /api/posts/{postId}
    // =========================================

    public void deletePost(
            Long postId,
            Long loggedInUserId
    ) {

        Post post =
                findPost(postId);


        verifyOwner(
                post,
                loggedInUserId
        );


        /*
         * Delete every associated file
         * from MEGA first.
         */

        for (
                PostMedia media
                :
                post.getMedia()
        ) {

            megaStorageService.delete(
                    media.getStorageKey()
            );
        }


        /*
         * Cascade + orphanRemoval will
         * delete PostMedia rows as well.
         */

        postRepository.delete(
                post
        );
    }


    // =========================================
    // CONVERT POST TO API RESPONSE
    // =========================================

    public PostResponse convertToResponse(
            Post post
    ) {

        List<PostMediaResponse> mediaResponses =
                post.getMedia()
                        .stream()
                        .map(
                                media ->
                                        new PostMediaResponse(

                                                media.getId(),

                                                media.getMediaType()
                                                        .name(),

                                                media.getOriginalFileName(),

                                                media.getContentType(),

                                                media.getFileSize(),

                                                "/api/media/"
                                                        + media.getId()
                                                        + "/view",

                                                "/api/media/"
                                                        + media.getId()
                                                        + "/download"
                                        )
                        )
                        .toList();


        return new PostResponse(

                post.getId(),

                post.getUser()
                        .getId(),

                post.getUser()
                        .getUsername(),

                post.getCaption(),

                mediaResponses,

                post.getCreatedAt(),

                post.getUpdatedAt()
        );
    }


    // =========================================
    // IDENTIFY FILE TYPE
    // =========================================

    private MediaType detectMediaType(
            MultipartFile file
    ) {

        String contentType =
                file.getContentType();


        if (contentType == null) {

            return MediaType.FILE;
        }


        // WatermarkService currently supports
        // JPEG and PNG images.

        if (
                contentType.equalsIgnoreCase(
                        "image/jpeg"
                )
                        ||
                        contentType.equalsIgnoreCase(
                                "image/png"
                        )
        ) {

            return MediaType.IMAGE;
        }


        if (
                contentType.startsWith(
                        "video/"
                )
        ) {

            return MediaType.VIDEO;
        }


        return MediaType.FILE;
    }


    // =========================================
    // FIND USER
    // =========================================

    private User findUser(
            Long userId
    ) {

        return userRepository
                .findById(userId)
                .orElseThrow(
                        () ->
                                new ResourceNotFoundException(
                                        "User not found with ID: "
                                                + userId
                                )
                );
    }


    // =========================================
    // FIND POST
    // =========================================

    private Post findPost(
            Long postId
    ) {

        return postRepository
                .findById(postId)
                .orElseThrow(
                        () ->
                                new ResourceNotFoundException(
                                        "Post not found with ID: "
                                                + postId
                                )
                );
    }


    // =========================================
    // CHECK POST OWNER
    // =========================================

    private void verifyOwner(
            Post post,
            Long loggedInUserId
    ) {

        if (
                !post.getUser()
                        .getId()
                        .equals(
                                loggedInUserId
                        )
        ) {

            throw new IllegalArgumentException(
                    "You can only modify your own post"
            );
        }
    }
}