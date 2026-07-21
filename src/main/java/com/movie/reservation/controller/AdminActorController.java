package com.movie.reservation.controller;

import com.movie.reservation.exception.ResourceNotFoundException;
import com.movie.reservation.model.Actor;
import com.movie.reservation.repository.ActorRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/actors")
public class AdminActorController {

    private final ActorRepository actorRepository;

    public AdminActorController(ActorRepository actorRepository) {
        this.actorRepository = actorRepository;
    }

    @PostMapping
    public ResponseEntity<Actor> createActor(@RequestBody Actor actor) {
        Actor saved = actorRepository.save(actor);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Actor> updateActor(@PathVariable Long id, @RequestBody Actor actor) {
        Actor existing = actorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Actor not found"));
        existing.setName(actor.getName());
        existing.setBio(actor.getBio());
        existing.setPhotoUrl(actor.getPhotoUrl());
        actorRepository.update(existing);
        return ResponseEntity.ok(existing);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteActor(@PathVariable Long id) {
        actorRepository.deleteById(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Actor deleted successfully");
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<Actor>> getAllActors() {
        return ResponseEntity.ok(actorRepository.findAll());
    }
}