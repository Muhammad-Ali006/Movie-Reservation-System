package com.movie.reservation.controller;

import com.movie.reservation.exception.ResourceNotFoundException;
import com.movie.reservation.model.Movie;
import com.movie.reservation.model.MovieCast;
import com.movie.reservation.repository.MovieCastRepository;
import com.movie.reservation.repository.MovieRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/movies")
public class MovieController {

    private final MovieRepository movieRepository;
    private final MovieCastRepository movieCastRepository;

    public MovieController(MovieRepository movieRepository, MovieCastRepository movieCastRepository) {
        this.movieRepository = movieRepository;
        this.movieCastRepository = movieCastRepository;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllMovies() {
        List<Movie> movies = movieRepository.findAll();
        List<Map<String, Object>> result = movies.stream().map(movie -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", movie.getId());
            map.put("title", movie.getTitle());
            map.put("slug", movie.getSlug());
            map.put("description", movie.getDescription());
            map.put("posterUrl", movie.getPosterUrl());
            map.put("durationMinutes", movie.getDurationMinutes());
            map.put("releaseDate", movie.getReleaseDate());
            map.put("originalLanguage", movie.getOriginalLanguage());
            map.put("director", movie.getDirector());
            map.put("createdAt", movie.getCreatedAt());
            map.put("genreIds", movieRepository.findGenreIdsByMovieId(movie.getId()));
            return map;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{slug}")
    public ResponseEntity<Map<String, Object>> getMovieBySlug(@PathVariable String slug) {
        Movie movie = movieRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found"));

        List<MovieCast> cast = movieCastRepository.findByMovieId(movie.getId());
        List<Long> genreIds = movieRepository.findGenreIdsByMovieId(movie.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("movie", movie);
        response.put("cast", cast);
        response.put("genreIds", genreIds);
        return ResponseEntity.ok(response);
    }
}
