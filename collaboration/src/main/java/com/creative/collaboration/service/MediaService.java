package com.creative.collaboration.service;

import com.creative.collaboration.entity.MediaType;
import com.creative.collaboration.entity.PostMedia;
import com.creative.collaboration.exception.ResourceNotFoundException;
import com.creative.collaboration.repository.PostMediaRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MediaService {

    private final PostMediaRepository postMediaRepository;
    private final MegaStorageService megaStorageService;
    private final WatermarkService watermarkService;


    public MediaService(
            PostMediaRepository postMediaRepository,
            MegaStorageService megaStorageService,
            WatermarkService watermarkService
    ) {

        this.postMediaRepository = postMediaRepository;
        this.megaStorageService = megaStorageService;
        this.watermarkService = watermarkService;
    }


    @Transactional(readOnly = true)
    public MediaContent getMedia(
            Long mediaId
    ) {

        PostMedia media =
                postMediaRepository
                        .findById(mediaId)
                        .orElseThrow(
                                () ->
                                        new ResourceNotFoundException(
                                                "Media not found with ID: "
                                                        + mediaId
                                        )
                        );


        byte[] data =
                megaStorageService.retrieve(
                        media.getStorageKey()
                );


        // Images are watermarked before being returned
        if (
                media.getMediaType()
                        == MediaType.IMAGE
        ) {

            String username =
                    media.getPost()
                            .getUser()
                            .getUsername();


            data =
                    watermarkService
                            .addWatermark(
                                    data,
                                    username,
                                    media.getContentType()
                            );
        }


        return new MediaContent(

                data,

                media.getContentType(),

                media.getOriginalFileName(),

                media.getMediaType()
        );
    }


    public record MediaContent(

            byte[] bytes,

            String contentType,

            String fileName,

            MediaType mediaType

    ) {
    }
}