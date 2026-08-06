package com.movie.reservation.model;

import java.time.LocalDateTime;

public class Ticket {
    private Long id;
    private Long reservationId;
    private String token;
    private String status;
    private LocalDateTime createdAt;

    public Ticket() {}

    public Ticket(Long id, Long reservationId, String token, String status, LocalDateTime createdAt) {
        this.id = id;
        this.reservationId = reservationId;
        this.token = token;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getReservationId() { return reservationId; }
    public void setReservationId(Long reservationId) { this.reservationId = reservationId; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
