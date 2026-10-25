package com.creative.collaboration.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class MegaStorageService {

    private final String remoteRoot;

    private final Path commandPath;


    public MegaStorageService(

            @Value("${mega.remote-root}")
            String remoteRoot,

            @Value("${mega.command-path}")
            String commandPath

    ) {

        this.remoteRoot = remoteRoot;

        this.commandPath =
                Paths.get(commandPath);
    }


    // =====================================================
    // UPLOAD FILE TO MEGA
    // =====================================================

    public StoredFile upload(
            MultipartFile file
    ) {

        if (
                file == null
                        ||
                        file.isEmpty()
        ) {

            throw new IllegalArgumentException(
                    "File cannot be empty"
            );
        }


        Path tempDirectory = null;


        try {

            // Create temporary directory
            tempDirectory =
                    Files.createTempDirectory(
                            "creative-upload-"
                    );


            // Get original filename
            String originalFileName =
                    file.getOriginalFilename();


            if (
                    originalFileName == null
                            ||
                            originalFileName.isBlank()
            ) {

                originalFileName =
                        "uploaded-file";
            }


            // Remove unsafe characters
            String safeFileName =
                    sanitizeFileName(
                            originalFileName
                    );


            /*
             * Generate unique filename.
             *
             * Example:
             *
             * 312e8400-e29b-photo.jpg
             */

            String storedFileName =
                    UUID.randomUUID()
                            + "-"
                            + safeFileName;


            Path localTempFile =
                    tempDirectory.resolve(
                            storedFileName
                    );


            // Save MultipartFile temporarily
            file.transferTo(
                    localTempFile
            );


            /*
             * IMPORTANT:
             *
             * Do NOT create the MEGA folder here.
             *
             * /creative-collaboration/posts
             * has already been created manually.
             *
             * Previously mega-mkdir caused:
             *
             * Folder already exists: posts
             */


            // Upload temporary file to MEGA
            runMegaCommand(

                    "mega-put",

                    localTempFile.toString(),

                    remoteRoot
            );


            /*
             * Private MEGA storage path.
             *
             * We store this in MySQL.
             */

            String storageKey =
                    remoteRoot
                            + "/"
                            + storedFileName;


            return new StoredFile(

                    storageKey,

                    originalFileName,

                    file.getContentType(),

                    file.getSize()
            );


        } catch (IOException exception) {

            throw new IllegalStateException(
                    "Unable to prepare file for MEGA upload",
                    exception
            );


        } finally {

            deleteTemporaryDirectory(
                    tempDirectory
            );
        }
    }


    // =====================================================
    // RETRIEVE FILE FROM MEGA
    // =====================================================

    public byte[] retrieve(
            String storageKey
    ) {

        validateStorageKey(
                storageKey
        );


        Path tempDirectory = null;


        try {

            // Temporary download folder
            tempDirectory =
                    Files.createTempDirectory(
                            "creative-download-"
                    );


            // Download original file from MEGA
            runMegaCommand(

                    "mega-get",

                    storageKey,

                    tempDirectory.toString()
            );


            // Extract filename from storage path
            String storedFileName =
                    storageKey.substring(

                            storageKey.lastIndexOf("/")
                                    + 1
                    );


            Path downloadedFile =
                    tempDirectory.resolve(
                            storedFileName
                    );


            if (
                    !Files.exists(
                            downloadedFile
                    )
            ) {

                throw new IllegalStateException(
                        "File was not downloaded from MEGA"
                );
            }


            return Files.readAllBytes(
                    downloadedFile
            );


        } catch (IOException exception) {

            throw new IllegalStateException(
                    "Unable to retrieve file from MEGA",
                    exception
            );


        } finally {

            deleteTemporaryDirectory(
                    tempDirectory
            );
        }
    }


    // =====================================================
    // DELETE FILE FROM MEGA
    // =====================================================

    public void delete(
            String storageKey
    ) {

        validateStorageKey(
                storageKey
        );


        runMegaCommand(

                "mega-rm",

                "-f",

                storageKey
        );
    }


    // =====================================================
    // CHECK MEGA LOGIN / CONNECTION
    // =====================================================

    public String whoAmI() {

        return runMegaCommand(
                "mega-whoami"
        );
    }


    // =====================================================
    // EXECUTE MEGACMD COMMAND
    // =====================================================

    private String runMegaCommand(

            String commandName,

            String... arguments

    ) {

        boolean windows = System.getProperty("os.name", "")
                .toLowerCase(Locale.ROOT).startsWith("windows");

        // Windows MEGAcmd uses batch launchers; macOS/Linux use executables.
        Path command = commandPath.resolve(
                commandName + (windows ? ".bat" : "")
        ).toAbsolutePath().normalize();

        if (!Files.isRegularFile(command)) {
            throw new IllegalStateException("MEGA command not found: " + command
                    + ". Check mega.command-path points to the MEGAcmd directory.");
        }
        if (!windows && !Files.isExecutable(command)) {
            throw new IllegalStateException("MEGA command is not executable: " + command);
        }

        List<String> processCommand = new ArrayList<>();
        if (windows) {
            processCommand.add("cmd.exe");
            processCommand.add("/d");
            processCommand.add("/c");
        }
        processCommand.add(command.toString());
        for (String argument : arguments) {
            processCommand.add(argument);
        }

        Path outputFile = null;
        Process process = null;
        try {
            // Drain output to disk while the command runs, avoiding a full pipe.
            outputFile = Files.createTempFile("creative-mega-output-", ".log");
            ProcessBuilder processBuilder = new ProcessBuilder(processCommand);
            processBuilder.redirectErrorStream(true);
            processBuilder.redirectOutput(outputFile.toFile());
            process = processBuilder.start();

            if (!process.waitFor(5, TimeUnit.MINUTES)) {
                stopProcess(process);
                throw new IllegalStateException("MEGA command timed out: " + commandName);
            }

            String output = Files.readString(outputFile, StandardCharsets.UTF_8);
            if (process.exitValue() != 0) {
                throw new IllegalStateException("MEGA command failed ("
                        + commandName + ", exit " + process.exitValue() + "): " + output);
            }
            return output.trim();
        } catch (InterruptedException exception) {
            if (process != null) stopProcess(process);
            Thread.currentThread().interrupt();
            throw new IllegalStateException("MEGA command was interrupted", exception);
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to execute MEGA command: " + command,
                    exception);
        } finally {
            if (process != null && process.isAlive()) stopProcess(process);
            if (outputFile != null) {
                try {
                    Files.deleteIfExists(outputFile);
                } catch (IOException ignored) {
                    // Cleanup failure must not hide the command result.
                }
            }
        }
    }

    private void stopProcess(Process process) {
        process.descendants().forEach(child -> child.destroyForcibly());
        process.destroyForcibly();
    }


    // =====================================================
    // VALIDATE MEGA STORAGE KEY
    // =====================================================

    private void validateStorageKey(
            String storageKey
    ) {

        if (
                storageKey == null
                        ||
                        storageKey.isBlank()
        ) {

            throw new IllegalArgumentException(
                    "Storage key cannot be empty"
            );
        }


        /*
         * Prevent accessing arbitrary
         * MEGA locations.
         */

        if (
                !storageKey.startsWith(
                        remoteRoot + "/"
                )
        ) {

            throw new IllegalArgumentException(
                    "Invalid MEGA storage location"
            );
        }
    }


    // =====================================================
    // CLEAN FILE NAME
    // =====================================================

    private String sanitizeFileName(
            String fileName
    ) {

        return fileName.replaceAll(
                "[^a-zA-Z0-9._-]",
                "_"
        );
    }


    // =====================================================
    // DELETE TEMPORARY FILES
    // =====================================================

    private void deleteTemporaryDirectory(
            Path directory
    ) {

        if (
                directory == null
                        ||
                        !Files.exists(directory)
        ) {

            return;
        }


        try (
                var files =
                        Files.walk(
                                directory
                        )
        ) {

            files.sorted(
                            Comparator.reverseOrder()
                    )

                    .forEach(

                            path -> {

                                try {

                                    Files.deleteIfExists(
                                            path
                                    );

                                } catch (IOException ignored) {

                                }
                            }
                    );


        } catch (IOException ignored) {

        }
    }


    // =====================================================
    // UPLOAD RESULT
    // =====================================================

    public record StoredFile(

            String storageKey,

            String originalFileName,

            String contentType,

            long fileSize

    ) {

    }
}
