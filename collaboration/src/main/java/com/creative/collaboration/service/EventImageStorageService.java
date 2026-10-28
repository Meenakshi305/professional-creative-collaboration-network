package com.creative.collaboration.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class EventImageStorageService {

    private final Path uploadDirectory =
            Paths.get("uploads", "events").toAbsolutePath().normalize();

    public String saveImage(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please select an image.");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException(
                    "Image size must not exceed 5 MB."
            );
        }

        String contentType = file.getContentType();
        String extension;

        if ("image/jpeg".equals(contentType)) {
            extension = ".jpg";
        } else if ("image/png".equals(contentType)) {
            extension = ".png";
        } else if ("image/webp".equals(contentType)) {
            extension = ".webp";
        } else {
            throw new IllegalArgumentException(
                    "Only JPG, PNG and WebP images are supported."
            );
        }

        try {
            byte[] bytes = file.getBytes();

            // Check file signatures, not just the declared MIME type.
            if (!hasValidSignature(bytes, contentType)) {
                throw new IllegalArgumentException(
                        "The selected file is not a valid image."
                );
            }

            Files.createDirectories(uploadDirectory);

            String filename = UUID.randomUUID() + extension;
            Path destination = uploadDirectory.resolve(filename);

            Files.write(destination, bytes);

            return filename;

        } catch (IOException exception) {
            throw new IllegalStateException(
                    "Unable to save event image.", exception
            );
        }
    }

    public byte[] loadImage(String filename) {

        if (filename == null ||
                !filename.matches("[a-f0-9-]{36}\\.(jpg|png|webp)")) {
            throw new IllegalArgumentException("Invalid image filename.");
        }

        Path imagePath = uploadDirectory.resolve(filename).normalize();

        try {
            return Files.readAllBytes(imagePath);
        } catch (IOException exception) {
            throw new IllegalStateException(
                    "Unable to load event image.", exception
            );
        }
    }

    public String getContentType(String filename) {
        if (filename.endsWith(".png")) {
            return "image/png";
        }
        if (filename.endsWith(".webp")) {
            return "image/webp";
        }
        return "image/jpeg";
    }

    private boolean hasValidSignature(byte[] bytes, String contentType) {

        if ("image/jpeg".equals(contentType)) {
            return bytes.length >= 3
                    && (bytes[0] & 0xFF) == 0xFF
                    && (bytes[1] & 0xFF) == 0xD8
                    && (bytes[2] & 0xFF) == 0xFF;
        }

        if ("image/png".equals(contentType)) {
            return bytes.length >= 8
                    && (bytes[0] & 0xFF) == 0x89
                    && bytes[1] == 0x50
                    && bytes[2] == 0x4E
                    && bytes[3] == 0x47
                    && bytes[4] == 0x0D
                    && bytes[5] == 0x0A
                    && bytes[6] == 0x1A
                    && bytes[7] == 0x0A;
        }

        if ("image/webp".equals(contentType)) {
            return bytes.length >= 12
                    && new String(bytes, 0, 4).equals("RIFF")
                    && new String(bytes, 8, 4).equals("WEBP");
        }

        return false;
    }
}