package com.movie.reservation.model;

public class Seat {
    private Long id;
    private Long showtimeId;
    private String seatNumber;
    private String rowLabel;
    private boolean available;

    public Seat() {}

    public Seat(Long id, Long showtimeId, String seatNumber, String rowLabel, boolean available) {
        this.id = id;
        this.showtimeId = showtimeId;
        this.seatNumber = seatNumber;
        this.rowLabel = rowLabel;
        this.available = available;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getShowtimeId() { return showtimeId; }
    public void setShowtimeId(Long showtimeId) { this.showtimeId = showtimeId; }

    public String getSeatNumber() { return seatNumber; }
    public void setSeatNumber(String seatNumber) { this.seatNumber = seatNumber; }

    public String getRowLabel() { return rowLabel; }
    public void setRowLabel(String rowLabel) { this.rowLabel = rowLabel; }

    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }
}
