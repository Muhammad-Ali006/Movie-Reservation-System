package com.movie.reservation.controller;

import com.movie.reservation.dto.request.ReservationRequest;
import com.movie.reservation.exception.ResourceNotFoundException;
import com.movie.reservation.exception.UnauthorizedException;
import com.movie.reservation.model.Reservation;
import com.movie.reservation.model.Seat;
import com.movie.reservation.model.Showtime;
import com.movie.reservation.repository.ReservationRepository;
import com.movie.reservation.repository.SeatRepository;
import com.movie.reservation.repository.ShowtimeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ShowtimeRepository showtimeRepository;
    private final SeatRepository seatRepository;
    private final ReservationRepository reservationRepository;

    public ReservationController(ShowtimeRepository showtimeRepository,
                                  SeatRepository seatRepository,
                                  ReservationRepository reservationRepository) {
        this.showtimeRepository = showtimeRepository;
        this.seatRepository = seatRepository;
        this.reservationRepository = reservationRepository;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Map<String, Object>> createReservation(
            @RequestBody ReservationRequest request,
            Authentication authentication) {

        Long userId = (Long) authentication.getPrincipal();

        if (request.getShowtimeId() == null) {
            throw new IllegalArgumentException("showtimeId is required");
        }

        List<Long> seatIds = request.getSeatIds();
        if (seatIds == null || seatIds.isEmpty()) {
            throw new IllegalArgumentException("At least one seat must be selected");
        }

        Set<Long> uniqueSeatIds = new HashSet<>(seatIds);
        if (uniqueSeatIds.size() != seatIds.size()) {
            throw new IllegalArgumentException("Duplicate seat IDs are not allowed");
        }

        Showtime showtime = showtimeRepository.findById(request.getShowtimeId())
                .orElseThrow(() -> new ResourceNotFoundException("Showtime not found"));

        List<Seat> seats = seatRepository.findByShowtimeId(request.getShowtimeId());
        Map<Long, Seat> seatMap = new HashMap<>();
        for (Seat seat : seats) {
            seatMap.put(seat.getId(), seat);
        }

        for (Long seatId : seatIds) {
            Seat seat = seatMap.get(seatId);
            if (seat == null) {
                throw new IllegalArgumentException("Seat " + seatId + " does not belong to this showtime");
            }
            if (!seat.isAvailable()) {
                throw new IllegalArgumentException("Seat " + seatId + " is already booked");
            }
        }

        BigDecimal totalAmount = showtime.getPricePerSeat().multiply(BigDecimal.valueOf(seatIds.size()));

        Reservation reservation = new Reservation();
        reservation.setUserId(userId);
        reservation.setShowtimeId(request.getShowtimeId());
        reservation.setStatus("CONFIRMED");
        reservation.setTotalAmount(totalAmount);
        reservation.setCreatedAt(LocalDateTime.now());

        reservation = reservationRepository.save(reservation);

        for (Long seatId : seatIds) {
            reservationRepository.saveReservationSeat(reservation.getId(), seatId);
        }
        seatRepository.markSeatsUnavailable(seatIds);

        Map<String, Object> response = new HashMap<>();
        response.put("id", reservation.getId());
        response.put("showtimeId", reservation.getShowtimeId());
        response.put("status", reservation.getStatus());
        response.put("totalAmount", reservation.getTotalAmount());
        response.put("seatIds", seatIds);
        response.put("createdAt", reservation.getCreatedAt());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}/cancel")
    @Transactional
    public ResponseEntity<Map<String, Object>> cancelReservation(
            @PathVariable Long id,
            Authentication authentication) {

        Long userId = (Long) authentication.getPrincipal();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));

        if (!isAdmin && !reservation.getUserId().equals(userId)) {
            throw new UnauthorizedException("This reservation does not belong to you");
        }

        if (!"CONFIRMED".equals(reservation.getStatus())) {
            throw new IllegalArgumentException("Reservation is already cancelled");
        }

        List<Long> seatIds = reservationRepository.findSeatIdsByReservationId(id);
        seatRepository.makeSeatsAvailable(seatIds);
        reservationRepository.cancelReservation(id, LocalDateTime.now());

        Map<String, Object> response = new HashMap<>();
        response.put("id", id);
        response.put("status", "CANCELLED");
        response.put("cancelledAt", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }
}
