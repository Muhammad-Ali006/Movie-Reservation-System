package com.movie.reservation.model;

import java.time.LocalDateTime;

public class Movie {
    private Long id;
    private String title;
    private String description;
    private String posterUrl;
    private Long genreId;
    private int durationMinutes;
    private LocalDateTime createdAt;

    public Movie() {}

    public Movie(Long id, String title, String description, String posterUrl, Long genreId, int durationMinutes, LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.posterUrl = posterUrl;
        this.genreId = genreId;
        this.durationMinutes = durationMinutes;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPosterUrl() { return posterUrl; }
    public void setPosterUrl(String posterUrl) { this.posterUrl = posterUrl; }

    public Long getGenreId() { return genreId; }
    public void setGenreId(Long genreId) { this.genreId = genreId; }

    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
