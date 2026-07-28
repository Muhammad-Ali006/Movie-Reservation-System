package com.movie.reservation.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);
    private static final String UPLOAD_DIR = "uploads/";

    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) {
            return;
        }

        if (!fileUrl.startsWith("/uploads/")) {
            return;
        }

        String relativePath = fileUrl.substring(1);
        Path filePath = Paths.get(relativePath);

        try {
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("Deleted file: {}", fileUrl);
            }
        } catch (Exception e) {
            log.warn("Failed to delete file: {}", fileUrl, e);
        }
    }

    public void deletePoster(String posterUrl) {
        deleteFile(posterUrl);
    }

    public void deleteActorPhoto(String photoUrl) {
        deleteFile(photoUrl);
    }
}
