package com.movie.reservation.dto.request;

import java.time.LocalDate;
import java.util.List;

public class MovieRequest {
    private String title;
    private String description;
    private String posterUrl;
    private int durationMinutes;
    private LocalDate releaseDate;
    private String originalLanguage;
    private String director;
    private List<Long> genreIds;

    public MovieRequest() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPosterUrl() { return posterUrl; }
    public void setPosterUrl(String posterUrl) { this.posterUrl = posterUrl; }

    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }

    public LocalDate getReleaseDate() { return releaseDate; }
    public void setReleaseDate(LocalDate releaseDate) { this.releaseDate = releaseDate; }

    public String getOriginalLanguage() { return originalLanguage; }
    public void setOriginalLanguage(String originalLanguage) { this.originalLanguage = originalLanguage; }

    public String getDirector() { return director; }
    public void setDirector(String director) { this.director = director; }

    public List<Long> getGenreIds() { return genreIds; }
    public void setGenreIds(List<Long> genreIds) { this.genreIds = genreIds; }
}
