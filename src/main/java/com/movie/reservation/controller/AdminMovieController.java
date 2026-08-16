package com.movie.reservation.controller;

import com.movie.reservation.dto.request.MovieRequest;
import com.movie.reservation.exception.ResourceNotFoundException;
import com.movie.reservation.model.Actor;
import com.movie.reservation.model.Movie;
import com.movie.reservation.model.MovieCast;
import com.movie.reservation.repository.ActorRepository;
import com.movie.reservation.repository.MediaRepository;
import com.movie.reservation.repository.MovieCastRepository;
import com.movie.reservation.repository.MovieRepository;
import com.movie.reservation.service.FileStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/movies")
public class AdminMovieController {

    private final MovieRepository movieRepository;
    private final ActorRepository actorRepository;
    private final MovieCastRepository movieCastRepository;
    private final FileStorageService fileStorageService;
    private final MediaRepository mediaRepository;
    private final JdbcTemplate jdbcTemplate;

    public AdminMovieController(MovieRepository movieRepository,
                                 ActorRepository actorRepository,
                                 MovieCastRepository movieCastRepository,
                                 FileStorageService fileStorageService,
                                 MediaRepository mediaRepository,
                                 JdbcTemplate jdbcTemplate) {
        this.movieRepository = movieRepository;
        this.actorRepository = actorRepository;
        this.movieCastRepository = movieCastRepository;
        this.fileStorageService = fileStorageService;
        this.mediaRepository = mediaRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostMapping
    public ResponseEntity<Movie> createMovie(@RequestBody MovieRequest request) {
        Movie movie = new Movie();
        movie.setTitle(request.getTitle());
        movie.setDescription(request.getDescription());
        movie.setPosterUrl(request.getPosterUrl());
        movie.setDurationMinutes(request.getDurationMinutes());
        movie.setReleaseDate(request.getReleaseDate());
        movie.setOriginalLanguage(request.getOriginalLanguage());
        movie.setDirector(request.getDirector());
        Movie saved = movieRepository.save(movie);

        if (request.getGenreIds() != null && !request.getGenreIds().isEmpty()) {
            movieRepository.saveGenres(saved.getId(), request.getGenreIds());
        }

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Movie> updateMovie(@PathVariable Long id, @RequestBody MovieRequest request) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found"));
        if (!movie.getTitle().equals(request.getTitle())) {
            movie.setSlug(null);
        }
        movie.setTitle(request.getTitle());
        movie.setDescription(request.getDescription());
        if (request.getPosterUrl() != null) movie.setPosterUrl(request.getPosterUrl());
        movie.setDurationMinutes(request.getDurationMinutes());
        movie.setReleaseDate(request.getReleaseDate());
        movie.setOriginalLanguage(request.getOriginalLanguage());
        movie.setDirector(request.getDirector());
        movieRepository.update(movie);

        movieRepository.deleteGenresByMovieId(id);
        if (request.getGenreIds() != null && !request.getGenreIds().isEmpty()) {
            movieRepository.saveGenres(id, request.getGenreIds());
        }

        return ResponseEntity.ok(movie);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Map<String, String>> deleteMovie(@PathVariable Long id) {
        if (!movieRepository.existsById(id)) {
            throw new ResourceNotFoundException("Movie not found");
        }

        Integer activeCount = jdbcTemplate.queryForObject("""
            SELECT COUNT(*) FROM reservations
            WHERE showtime_id IN (SELECT id FROM showtimes WHERE movie_id = ?)
            AND status = 'CONFIRMED'
        """, Integer.class, id);

        if (activeCount != null && activeCount > 0) {
            throw new IllegalArgumentException(
                "Cannot delete movie: " + activeCount + " active booking(s) exist. Cancel them first."
            );
        }

        Movie movie = movieRepository.findById(id).orElse(null);
        String posterUrl = (movie != null) ? movie.getPosterUrl() : null;

        jdbcTemplate.update("""
            DELETE FROM reservation_seats WHERE seat_id IN (
                SELECT t.id FROM seats t JOIN showtimes s ON t.showtime_id = s.id WHERE s.movie_id = ?
            )
        """, id);

        jdbcTemplate.update("""
            DELETE FROM reservations WHERE showtime_id IN (SELECT id FROM showtimes WHERE movie_id = ?)
        """, id);

        jdbcTemplate.update("DELETE FROM seats WHERE showtime_id IN (SELECT id FROM showtimes WHERE movie_id = ?)", id);
        jdbcTemplate.update("DELETE FROM showtimes WHERE movie_id = ?", id);
        jdbcTemplate.update("DELETE FROM movie_genres WHERE movie_id = ?", id);
        jdbcTemplate.update("DELETE FROM movie_cast WHERE movie_id = ?", id);
        movieRepository.deleteById(id);

        if (posterUrl != null) {
            fileStorageService.deletePoster(posterUrl);
        }

        Map<String, String> response = new HashMap<>();
        response.put("message", "Movie deleted successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/poster")
    public ResponseEntity<Map<String, String>> uploadPoster(@PathVariable Long id,
                                                             @RequestParam("file") MultipartFile file) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found"));

        String oldPosterUrl = movie.getPosterUrl();

        try {
            String fileName = id + "_" + UUID.randomUUID().toString().substring(0, 8) + "_" + file.getOriginalFilename();
            String contentType = (file.getContentType() != null) ? file.getContentType() : "application/octet-stream";
            mediaRepository.upsert(MediaRepository.TYPE_MOVIE_POSTER, id, fileName, contentType, file.getBytes());

            String posterUrl = "/api/media/movies/" + id + "/poster";
            movieRepository.updatePosterUrl(id, posterUrl);

            if (oldPosterUrl != null && !oldPosterUrl.equals(posterUrl)) {
                fileStorageService.deletePoster(oldPosterUrl);
            }

            Map<String, String> response = new HashMap<>();
            response.put("posterUrl", posterUrl);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to upload poster");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @PostMapping("/{movieId}/cast")
    public ResponseEntity<Map<String, String>> addCastMember(@PathVariable Long movieId,
                                                              @RequestParam("actorName") String actorName,
                                                              @RequestParam("roleName") String roleName,
                                                              @RequestParam(value = "photo", required = false) MultipartFile photo) {
        if (!movieRepository.existsById(movieId)) {
            throw new ResourceNotFoundException("Movie not found");
        }

        Actor actor = actorRepository.findByName(actorName.trim()).orElseGet(() -> {
            Actor newActor = new Actor();
            newActor.setName(actorName.trim());
            return actorRepository.save(newActor);
        });

        if (photo != null && !photo.isEmpty()) {
            String oldPhotoUrl = actor.getPhotoUrl();
            try {
                String fileName = UUID.randomUUID().toString().substring(0, 8) + "_" + photo.getOriginalFilename();
                String contentType = (photo.getContentType() != null) ? photo.getContentType() : "application/octet-stream";
                mediaRepository.upsert(MediaRepository.TYPE_ACTOR_PHOTO, actor.getId(), fileName, contentType, photo.getBytes());

                String newPhotoUrl = "/api/media/actors/" + actor.getId() + "/photo";
                actor.setPhotoUrl(newPhotoUrl);
                actorRepository.update(actor);

                if (oldPhotoUrl != null && !oldPhotoUrl.equals(newPhotoUrl)) {
                    fileStorageService.deleteActorPhoto(oldPhotoUrl);
                }
            } catch (IOException e) {
                // continue without photo
            }
        }

        movieCastRepository.save(movieId, actor.getId(), roleName.trim());

        Map<String, String> response = new HashMap<>();
        response.put("message", "Cast member added successfully");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{movieId}/cast/{castId}")
    public ResponseEntity<Map<String, String>> removeCastMember(@PathVariable Long movieId,
                                                                 @PathVariable Long castId) {
        movieCastRepository.deleteById(castId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Cast member removed successfully");
        return ResponseEntity.ok(response);
    }
}
