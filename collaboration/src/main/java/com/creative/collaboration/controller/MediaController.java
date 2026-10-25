package com.creative.collaboration.controller;

import com.creative.collaboration.service.MediaService;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/media")
public class MediaController {

    private final MediaService mediaService;

    public MediaController(
            MediaService mediaService
    ) {
        this.mediaService = mediaService;
    }


    // =========================================
    // VIEW MEDIA
    // GET /api/media/{mediaId}/view
    // =========================================

    @GetMapping("/{mediaId}/view")
    public ResponseEntity<byte[]> viewMedia(

            @PathVariable
            Long mediaId

    ) {

        MediaService.MediaContent content =
                mediaService.getMedia(
                        mediaId
                );


        return ResponseEntity.ok()
                .contentType(
                        getMediaType(
                                content.contentType()
                        )
                )
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition
                                .inline()
                                .filename(
                                        content.fileName(),
                                        StandardCharsets.UTF_8
                                )
                                .build()
                                .toString()
                )
                .body(
                        content.bytes()
                );
    }


    // =========================================
    // DOWNLOAD MEDIA
    // GET /api/media/{mediaId}/download
    // =========================================

    @GetMapping("/{mediaId}/download")
    public ResponseEntity<byte[]> downloadMedia(

            @PathVariable
            Long mediaId

    ) {

        MediaService.MediaContent content =
                mediaService.getMedia(
                        mediaId
                );


        return ResponseEntity.ok()
                .contentType(
                        getMediaType(
                                content.contentType()
                        )
                )
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition
                                .attachment()
                                .filename(
                                        content.fileName(),
                                        StandardCharsets.UTF_8
                                )
                                .build()
                                .toString()
                )
                .body(
                        content.bytes()
                );
    }


    private MediaType getMediaType(
            String contentType
    ) {

        if (
                contentType == null
                        ||
                        contentType.isBlank()
        ) {

            return MediaType
                    .APPLICATION_OCTET_STREAM;
        }

        return MediaType
                .parseMediaType(
                        contentType
                );
    }
}