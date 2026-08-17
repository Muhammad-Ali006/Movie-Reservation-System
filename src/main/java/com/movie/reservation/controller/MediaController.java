package com.movie.reservation.controller;

import com.movie.reservation.model.Media;
import com.movie.reservation.repository.MediaRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.WebRequest;

import java.util.Optional;

@RestController
@RequestMapping("/api/media")
public class MediaController {

    private final MediaRepository mediaRepository;

    public MediaController(MediaRepository mediaRepository) {
        this.mediaRepository = mediaRepository;
    }

    @GetMapping("/movies/{movieId}/poster")
    public ResponseEntity<byte[]> getMoviePoster(@PathVariable Long movieId, WebRequest request) {
        return serve(mediaRepository.findByEntity(MediaRepository.TYPE_MOVIE_POSTER, movieId), request);
    }

    @GetMapping("/actors/{actorId}/photo")
    public ResponseEntity<byte[]> getActorPhoto(@PathVariable Long actorId, WebRequest request) {
        return serve(mediaRepository.findByEntity(MediaRepository.TYPE_ACTOR_PHOTO, actorId), request);
    }

    private ResponseEntity<byte[]> serve(Optional<Media> maybeMedia, WebRequest request) {
        if (maybeMedia.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Media media = maybeMedia.get();
        String etag = "\"" + Integer.toHexString(java.util.Arrays.hashCode(media.getData())) + "\"";
        if (request.checkNotModified(etag)) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED)
                    .header(HttpHeaders.ETAG, etag)
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=0, must-revalidate")
                    .build();
        }
        String contentType = (media.getContentType() != null)
                ? media.getContentType()
                : "application/octet-stream";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.ETAG, etag)
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=0, must-revalidate")
                .body(media.getData());
    }
}
