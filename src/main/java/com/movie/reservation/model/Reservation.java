package com.movie.reservation.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class Reservation {
    private Long id;
    private Long userId;
    private Long showtimeId;
    private String status;
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;
    private LocalDateTime cancelledAt;

    public Reservation() {}

    public Reservation(Long id, Long userId, Long showtimeId, String status, BigDecimal totalAmount, LocalDateTime createdAt, LocalDateTime cancelledAt) {
        this.id = id;
        this.userId = userId;
        this.showtimeId = showtimeId;
        this.status = status;
        this.totalAmount = totalAmount;
        this.createdAt = createdAt;
        this.cancelledAt = cancelledAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getShowtimeId() { return showtimeId; }
    public void setShowtimeId(Long showtimeId) { this.showtimeId = showtimeId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }
}
