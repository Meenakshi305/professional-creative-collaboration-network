package com.creative.collaboration.service;

/** Identifies the three supported formats from their file signatures. */
final class EventImageFormat {
    private EventImageFormat() {}

    static String detect(byte[] bytes) {
        if (bytes != null && bytes.length >= 3
                && (bytes[0] & 0xff) == 0xff
                && (bytes[1] & 0xff) == 0xd8
                && (bytes[2] & 0xff) == 0xff) {
            return "image/jpeg";
        }
        if (bytes != null && bytes.length >= 8
                && (bytes[0] & 0xff) == 0x89
                && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G'
                && bytes[4] == 13 && bytes[5] == 10
                && bytes[6] == 26 && bytes[7] == 10) {
            return "image/png";
        }
        if (bytes != null && bytes.length >= 12
                && bytes[0] == 'R' && bytes[1] == 'I'
                && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E'
                && bytes[10] == 'B' && bytes[11] == 'P') {
            return "image/webp";
        }
        throw new IllegalArgumentException("Only JPG, PNG and WebP images are supported.");
    }
}
