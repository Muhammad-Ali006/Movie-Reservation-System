package com.movie.reservation.controller;

import com.movie.reservation.dto.request.LoginRequest;
import com.movie.reservation.dto.request.SignupRequest;
import com.movie.reservation.dto.response.AuthResponse;
import com.movie.reservation.model.User;
import com.movie.reservation.service.AuthService;
import com.movie.reservation.util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, String>> signup(@RequestBody SignupRequest request) {
        authService.signup(request);
        Map<String, String> response = new HashMap<>();
        response.put("message", "User registered successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        User user = authService.getCurrentUser(userId);
        user.setPassword(null);
        return ResponseEntity.ok(user);
    }
}
