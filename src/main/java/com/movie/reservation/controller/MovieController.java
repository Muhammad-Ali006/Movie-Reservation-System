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
    public ResponseEntity<List<Movie>> getAllMovies() {
        return ResponseEntity.ok(movieRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getMovieById(@PathVariable Long id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found"));

        List<MovieCast> cast = movieCastRepository.findByMovieId(id);

        Map<String, Object> response = new HashMap<>();
        response.put("movie", movie);
        response.put("cast", cast);
        return ResponseEntity.ok(response);
    }
}