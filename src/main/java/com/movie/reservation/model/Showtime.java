package com.movie.reservation.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

public class Showtime {
    private Long id;
    private Long movieId;
    private LocalDate showDate;
    private LocalTime showTime;
    private int screenNumber;
    private int totalSeats;
    private BigDecimal pricePerSeat;
    private LocalDateTime createdAt;

    public Showtime() {}

    public Showtime(Long id, Long movieId, LocalDate showDate, LocalTime showTime, int screenNumber, int totalSeats, BigDecimal pricePerSeat, LocalDateTime createdAt) {
        this.id = id;
        this.movieId = movieId;
        this.showDate = showDate;
        this.showTime = showTime;
        this.screenNumber = screenNumber;
        this.totalSeats = totalSeats;
        this.pricePerSeat = pricePerSeat;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getMovieId() { return movieId; }
    public void setMovieId(Long movieId) { this.movieId = movieId; }

    public LocalDate getShowDate() { return showDate; }
    public void setShowDate(LocalDate showDate) { this.showDate = showDate; }

    public LocalTime getShowTime() { return showTime; }
    public void setShowTime(LocalTime showTime) { this.showTime = showTime; }

    public int getScreenNumber() { return screenNumber; }
    public void setScreenNumber(int screenNumber) { this.screenNumber = screenNumber; }

    public int getTotalSeats() { return totalSeats; }
    public void setTotalSeats(int totalSeats) { this.totalSeats = totalSeats; }

    public BigDecimal getPricePerSeat() { return pricePerSeat; }
    public void setPricePerSeat(BigDecimal pricePerSeat) { this.pricePerSeat = pricePerSeat; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
