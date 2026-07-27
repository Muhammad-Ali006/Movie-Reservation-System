package com.movie.reservation.controller;

import com.movie.reservation.model.Screen;
import com.movie.reservation.repository.ScreenRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/screens")
public class ScreenController {

    private final ScreenRepository screenRepository;

    public ScreenController(ScreenRepository screenRepository) {
        this.screenRepository = screenRepository;
    }

    @GetMapping
    public ResponseEntity<List<Screen>> getAllScreens() {
        return ResponseEntity.ok(screenRepository.findAll());
    }
}
