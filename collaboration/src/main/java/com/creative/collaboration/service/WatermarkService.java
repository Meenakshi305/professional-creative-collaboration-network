package com.creative.collaboration.service;

import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;

import java.awt.*;
import java.awt.image.BufferedImage;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class WatermarkService {

    public byte[] addWatermark(
            byte[] originalImage,
            String username,
            String contentType
    ) {

        try {

            BufferedImage image =
                    ImageIO.read(
                            new ByteArrayInputStream(
                                    originalImage
                            )
                    );

            if (image == null) {
                throw new IllegalArgumentException(
                        "Unsupported image format"
                );
            }

            Graphics2D graphics =
                    image.createGraphics();

            graphics.setRenderingHint(
                    RenderingHints.KEY_ANTIALIASING,
                    RenderingHints.VALUE_ANTIALIAS_ON
            );

            int fontSize =
                    Math.max(
                            18,
                            image.getWidth() / 35
                    );

            Font font =
                    new Font(
                            "Arial",
                            Font.BOLD,
                            fontSize
                    );

            graphics.setFont(font);

            String watermarkText =
                    "© Creative Collaboration Network  @"
                            + username;

            FontMetrics fontMetrics =
                    graphics.getFontMetrics();

            int textWidth =
                    fontMetrics.stringWidth(
                            watermarkText
                    );

            int padding = 14;

            int x =
                    Math.max(
                            padding,
                            image.getWidth()
                                    - textWidth
                                    - (padding * 2)
                    );

            int y =
                    image.getHeight()
                            - padding;

            int backgroundY =
                    y
                            - fontMetrics.getAscent()
                            - padding;

            graphics.setComposite(
                    AlphaComposite.getInstance(
                            AlphaComposite.SRC_OVER,
                            0.50f
                    )
            );

            graphics.setColor(
                    Color.BLACK
            );

            graphics.fillRoundRect(
                    x - padding,
                    backgroundY,
                    textWidth + (padding * 2),
                    fontMetrics.getHeight()
                            + padding,
                    15,
                    15
            );

            graphics.setComposite(
                    AlphaComposite.getInstance(
                            AlphaComposite.SRC_OVER,
                            0.90f
                    )
            );

            graphics.setColor(
                    Color.WHITE
            );

            graphics.drawString(
                    watermarkText,
                    x,
                    y
            );

            graphics.dispose();

            String outputFormat =
                    getOutputFormat(
                            contentType
                    );

            ByteArrayOutputStream outputStream =
                    new ByteArrayOutputStream();

            ImageIO.write(
                    image,
                    outputFormat,
                    outputStream
            );

            return outputStream.toByteArray();

        } catch (IOException e) {

            throw new IllegalStateException(
                    "Unable to create watermarked image",
                    e
            );
        }
    }


    private String getOutputFormat(
            String contentType
    ) {

        if (
                contentType != null
                        &&
                        contentType.equalsIgnoreCase(
                                "image/png"
                        )
        ) {
            return "png";
        }

        return "jpg";
    }
}