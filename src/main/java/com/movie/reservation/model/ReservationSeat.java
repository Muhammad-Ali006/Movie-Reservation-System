package com.movie.reservation.model;

public class ReservationSeat {
    private Long id;
    private Long reservationId;
    private Long seatId;

    public ReservationSeat() {}

    public ReservationSeat(Long id, Long reservationId, Long seatId) {
        this.id = id;
        this.reservationId = reservationId;
        this.seatId = seatId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getReservationId() { return reservationId; }
    public void setReservationId(Long reservationId) { this.reservationId = reservationId; }

    public Long getSeatId() { return seatId; }
    public void setSeatId(Long seatId) { this.seatId = seatId; }
}
