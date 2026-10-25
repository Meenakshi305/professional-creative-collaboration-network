package com.creative.collaboration.dto;

public record PostMediaResponse(

        Long mediaId,

        String mediaType,

        String originalFileName,

        String contentType,

        Long fileSize,

        String viewUrl,

        String downloadUrl

) {
}