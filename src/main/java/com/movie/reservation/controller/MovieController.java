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
    public ResponseEntity<Map<String, Object>> getAllMovies(
            @RequestParam(required = false) Long genreId,
            @RequestParam(required = false, defaultValue = "createdAt") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String availability,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "6") int size) {

        if (page < 0) {
            throw new IllegalArgumentException("Page must be 0 or greater");
        }
        if (size < 1 || size > 100) {
            throw new IllegalArgumentException("Size must be between 1 and 100");
        }

        int offset = page * size;

        List<Movie> movies = movieRepository.findAllFiltered(
                genreId, sortBy, sortDir, availability, offset, size);

        int totalElements = movieRepository.countFiltered(
                genreId, availability);

        int totalPages = (int) Math.ceil((double) totalElements / size);

        List<Long> moviesWithShowtimes = movieRepository.findIdsWithFutureShowtimes();

        List<Map<String, Object>> content = movies.stream().map(movie -> {
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
            map.put("hasShowtimes", moviesWithShowtimes.contains(movie.getId()));
            List<MovieCast> cast = movieCastRepository.findByMovieId(movie.getId());
            List<String> actorNames = cast.stream().map(MovieCast::getActorName).toList();
            map.put("actorNames", actorNames);
            return map;
        }).toList();

        Map<String, Object> response = new HashMap<>();
        response.put("content", content);
        response.put("totalPages", totalPages);
        response.put("totalElements", totalElements);
        response.put("currentPage", page);
        response.put("size", size);
        return ResponseEntity.ok(response);
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
