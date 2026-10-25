package com.creative.collaboration.controller;

import com.creative.collaboration.service.MegaStorageService;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/test/mega")
public class MegaTestController {

    private final MegaStorageService megaStorageService;

    public MegaTestController(
            MegaStorageService megaStorageService
    ) {
        this.megaStorageService = megaStorageService;
    }


    // CHECK MEGA LOGIN
    @GetMapping("/whoami")
    public ResponseEntity<String> whoAmI() {

        return ResponseEntity.ok(
                megaStorageService.whoAmI()
        );
    }


    // UPLOAD FILE
    @PostMapping(
            value = "/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<Map<String, Object>> upload(
            @RequestParam("file")
            MultipartFile file
    ) {

        MegaStorageService.StoredFile stored =
                megaStorageService.upload(file);

        return ResponseEntity.ok(
                Map.of(
                        "storageKey",
                        stored.storageKey(),

                        "originalFileName",
                        stored.originalFileName(),

                        "contentType",
                        stored.contentType() == null
                                ? ""
                                : stored.contentType(),

                        "fileSize",
                        stored.fileSize()
                )
        );
    }


    // DOWNLOAD / RETRIEVE FILE
    @GetMapping("/download")
    public ResponseEntity<byte[]> download(
            @RequestParam
            String storageKey
    ) {

        byte[] file =
                megaStorageService.retrieve(
                        storageKey
                );

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"mega-test-file\""
                )
                .contentType(
                        MediaType.APPLICATION_OCTET_STREAM
                )
                .body(file);
    }


    // DELETE FILE
    @DeleteMapping("/delete")
    public ResponseEntity<String> delete(
            @RequestParam
            String storageKey
    ) {

        megaStorageService.delete(
                storageKey
        );

        return ResponseEntity.ok(
                "File deleted successfully"
        );
    }
}