package com.movie.reservation.controller;

import com.movie.reservation.dto.request.MovieRequest;
import com.movie.reservation.exception.ResourceNotFoundException;
import com.movie.reservation.model.Actor;
import com.movie.reservation.model.Movie;
import com.movie.reservation.model.MovieCast;
import com.movie.reservation.repository.ActorRepository;
import com.movie.reservation.repository.MovieCastRepository;
import com.movie.reservation.repository.MovieRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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

    public AdminMovieController(MovieRepository movieRepository,
                                 ActorRepository actorRepository,
                                 MovieCastRepository movieCastRepository) {
        this.movieRepository = movieRepository;
        this.actorRepository = actorRepository;
        this.movieCastRepository = movieCastRepository;
    }

    @PostMapping
    public ResponseEntity<Movie> createMovie(@RequestBody MovieRequest request) {
        Movie movie = new Movie();
        movie.setTitle(request.getTitle());
        movie.setDescription(request.getDescription());
        movie.setPosterUrl(request.getPosterUrl());
        movie.setGenreId(request.getGenreId());
        movie.setDurationMinutes(request.getDurationMinutes());
        Movie saved = movieRepository.save(movie);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Movie> updateMovie(@PathVariable Long id, @RequestBody MovieRequest request) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found"));
        movie.setTitle(request.getTitle());
        movie.setDescription(request.getDescription());
        if (request.getPosterUrl() != null) movie.setPosterUrl(request.getPosterUrl());
        movie.setGenreId(request.getGenreId());
        movie.setDurationMinutes(request.getDurationMinutes());
        movieRepository.update(movie);
        return ResponseEntity.ok(movie);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteMovie(@PathVariable Long id) {
        if (!movieRepository.existsById(id)) {
            throw new ResourceNotFoundException("Movie not found");
        }
        movieRepository.deleteById(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Movie deleted successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/poster")
    public ResponseEntity<Map<String, String>> uploadPoster(@PathVariable Long id,
                                                             @RequestParam("file") MultipartFile file) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found"));

        try {
            String uploadDir = "uploads/posters/";
            Files.createDirectories(Paths.get(uploadDir));

            String fileName = id + "_" + UUID.randomUUID().toString().substring(0, 8) + "_" + file.getOriginalFilename();
            Path filePath = Paths.get(uploadDir + fileName);
            Files.write(filePath, file.getBytes());

            String posterUrl = "/uploads/posters/" + fileName;
            movieRepository.updatePosterUrl(id, posterUrl);

            Map<String, String> response = new HashMap<>();
            response.put("posterUrl", posterUrl);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to upload poster");
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @PostMapping("/{movieId}/cast")
    public ResponseEntity<Map<String, String>> addCastMember(@PathVariable Long movieId,
                                                              @RequestBody Map<String, Object> body) {
        if (!movieRepository.existsById(movieId)) {
            throw new ResourceNotFoundException("Movie not found");
        }
        Long actorId = Long.valueOf(body.get("actorId").toString());
        String roleName = (String) body.get("roleName");

        Actor actor = actorRepository.findById(actorId)
                .orElseThrow(() -> new ResourceNotFoundException("Actor not found"));

        movieCastRepository.save(movieId, actorId, roleName);

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