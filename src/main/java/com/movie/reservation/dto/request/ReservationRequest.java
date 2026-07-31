package com.movie.reservation.dto.request;

import java.util.List;

public class ReservationRequest {
    private Long showtimeId;
    private List<Long> seatIds;

    public ReservationRequest() {}

    public Long getShowtimeId() { return showtimeId; }
    public void setShowtimeId(Long showtimeId) { this.showtimeId = showtimeId; }

    public List<Long> getSeatIds() { return seatIds; }
    public void setSeatIds(List<Long> seatIds) { this.seatIds = seatIds; }
}
