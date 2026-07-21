package com.movie.reservation.controller;

import com.movie.reservation.exception.ResourceNotFoundException;
import com.movie.reservation.model.Genre;
import com.movie.reservation.repository.GenreRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/genres")
public class AdminGenreController {

    private final GenreRepository genreRepository;

    public AdminGenreController(GenreRepository genreRepository) {
        this.genreRepository = genreRepository;
    }

    @PostMapping
    public ResponseEntity<Genre> createGenre(@RequestBody Genre genre) {
        Genre saved = genreRepository.save(genre);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Genre> updateGenre(@PathVariable Long id, @RequestBody Genre genre) {
        Genre existing = genreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Genre not found"));
        existing.setName(genre.getName());
        existing.setDescription(genre.getDescription());
        genreRepository.update(existing);
        return ResponseEntity.ok(existing);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteGenre(@PathVariable Long id) {
        genreRepository.deleteById(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Genre deleted successfully");
        return ResponseEntity.ok(response);
    }
}