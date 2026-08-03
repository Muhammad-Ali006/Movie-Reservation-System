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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private static final int HOLD_MINUTES = 2;

    private final ShowtimeRepository showtimeRepository;
    private final SeatRepository seatRepository;
    private final ReservationRepository reservationRepository;
    private final JdbcTemplate jdbcTemplate;

    public ReservationController(ShowtimeRepository showtimeRepository,
                                  SeatRepository seatRepository,
                                  ReservationRepository reservationRepository,
                                  JdbcTemplate jdbcTemplate) {
        this.showtimeRepository = showtimeRepository;
        this.seatRepository = seatRepository;
        this.reservationRepository = reservationRepository;
        this.jdbcTemplate = jdbcTemplate;
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

        List<Seat> seats = seatRepository.findByShowtimeIdForUpdate(request.getShowtimeId());
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
                throw new IllegalArgumentException("Seat " + seat.getRowLabel() + seat.getSeatNumber() + " is no longer available");
            }
        }

        BigDecimal totalAmount = showtime.getPricePerSeat().multiply(BigDecimal.valueOf(seatIds.size()));
        LocalDateTime now = LocalDateTime.now();

        Reservation reservation = new Reservation();
        reservation.setUserId(userId);
        reservation.setShowtimeId(request.getShowtimeId());
        reservation.setStatus("PENDING");
        reservation.setTotalAmount(totalAmount);
        reservation.setCreatedAt(now);
        reservation.setPendingUntil(now.plusMinutes(HOLD_MINUTES));

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
        response.put("pendingUntil", reservation.getPendingUntil());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/confirm")
    @Transactional
    public ResponseEntity<Map<String, Object>> confirmReservation(
            @PathVariable Long id,
            Authentication authentication) {

        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));

        if (isOwnerOrAdmin(reservation, authentication)) {
            if ("CONFIRMED".equals(reservation.getStatus())) {
                return ResponseEntity.ok(buildConfirmResponse(reservation));
            }
            if (!"PENDING".equals(reservation.getStatus())) {
                throw new IllegalArgumentException("Reservation is already cancelled");
            }
            if (reservation.getPendingUntil() == null || LocalDateTime.now().isAfter(reservation.getPendingUntil())) {
                throw new IllegalArgumentException("The seat hold has expired. Please book again.");
            }
            reservationRepository.confirmReservation(id);
            reservation.setStatus("CONFIRMED");
        }

        return ResponseEntity.ok(buildConfirmResponse(reservation));
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

        if ("CANCELLED".equals(reservation.getStatus())) {
            throw new IllegalArgumentException("Reservation is already cancelled");
        }

        List<Long> seatIds = reservationRepository.findActiveSeatIdsByReservationId(id);
        seatRepository.makeSeatsAvailable(seatIds);
        reservationRepository.deactivateSeatsByReservationId(id);
        reservationRepository.cancelReservation(id, LocalDateTime.now());

        Map<String, Object> response = new HashMap<>();
        response.put("id", id);
        response.put("status", "CANCELLED");
        response.put("cancelledAt", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/seats")
    @Transactional
    public ResponseEntity<Map<String, Object>> changeSeats(
            @PathVariable Long id,
            @RequestBody Map<String, List<Long>> body,
            Authentication authentication) {

        Long userId = (Long) authentication.getPrincipal();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));

        if (!isAdmin && !reservation.getUserId().equals(userId)) {
            throw new UnauthorizedException("This reservation does not belong to you");
        }

        if ("CANCELLED".equals(reservation.getStatus())) {
            throw new IllegalArgumentException("Reservation is already cancelled");
        }

        List<Long> seatIds = body.get("seatIds");
        if (seatIds == null || seatIds.isEmpty()) {
            throw new IllegalArgumentException("At least one seat must be selected");
        }

        Set<Long> uniqueSeatIds = new HashSet<>(seatIds);
        if (uniqueSeatIds.size() != seatIds.size()) {
            throw new IllegalArgumentException("Duplicate seat IDs are not allowed");
        }

        Showtime showtime = showtimeRepository.findById(reservation.getShowtimeId())
                .orElseThrow(() -> new ResourceNotFoundException("Showtime not found"));

        List<Seat> seats = seatRepository.findByShowtimeIdForUpdate(reservation.getShowtimeId());
        Map<Long, Seat> seatMap = new HashMap<>();
        for (Seat seat : seats) {
            seatMap.put(seat.getId(), seat);
        }

        Set<Long> heldByReservation = new HashSet<>(reservationRepository.findActiveSeatIdsByReservationId(id));

        for (Long seatId : seatIds) {
            Seat seat = seatMap.get(seatId);
            if (seat == null) {
                throw new IllegalArgumentException("Seat " + seatId + " does not belong to this showtime");
            }
            if (!seat.isAvailable() && !heldByReservation.contains(seatId)) {
                throw new IllegalArgumentException("Seat " + seat.getRowLabel() + seat.getSeatNumber() + " is no longer available");
            }
        }

        List<Long> oldSeatIds = reservationRepository.findActiveSeatIdsByReservationId(id);
        seatRepository.makeSeatsAvailable(oldSeatIds);
        reservationRepository.deactivateSeatsByReservationId(id);
        seatRepository.markSeatsUnavailable(seatIds);
        for (Long seatId : seatIds) {
            reservationRepository.saveReservationSeat(id, seatId);
        }

        BigDecimal totalAmount = showtime.getPricePerSeat().multiply(BigDecimal.valueOf(seatIds.size()));
        reservationRepository.updateTotalAmount(id, totalAmount);

        Map<String, Object> response = new HashMap<>();
        response.put("id", id);
        response.put("status", reservation.getStatus());
        response.put("totalAmount", totalAmount);
        response.put("seatIds", seatIds);
        response.put("message", "Seats updated successfully");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/my")
    public ResponseEntity<List<Map<String, Object>>> getMyReservations(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();

        String sql = """
            SELECT
                r.id,
                r.status,
                r.showtime_id AS showtimeId,
                r.total_amount AS totalAmount,
                r.created_at AS createdAt,
                r.pending_until AS pendingUntil,
                m.title AS movieTitle,
                m.slug AS movieSlug,
                sc.id AS screenId,
                sc.name AS screenName,
                s.show_date AS showDate,
                s.show_time AS showTime,
                STRING_AGG(t.row_label || t.seat_number, ', ' ORDER BY t.row_label, t.seat_number) AS seats
            FROM reservations r
            JOIN showtimes s ON r.showtime_id = s.id
            JOIN movies m ON s.movie_id = m.id
            JOIN screens sc ON sc.id = s.screen_number
            LEFT JOIN reservation_seats rs ON r.id = rs.reservation_id AND rs.is_active = true
            LEFT JOIN seats t ON rs.seat_id = t.id
            WHERE r.user_id = ?
            GROUP BY r.id, m.title, m.slug, sc.id, sc.name, s.show_date, s.show_time
            ORDER BY r.created_at DESC, r.id DESC
        """;

        List<Map<String, Object>> result = jdbcTemplate.queryForList(sql, userId);
        return ResponseEntity.ok(result);
    }

    private boolean isOwnerOrAdmin(Reservation reservation, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin && !reservation.getUserId().equals(userId)) {
            throw new UnauthorizedException("This reservation does not belong to you");
        }
        return true;
    }

    private Map<String, Object> buildConfirmResponse(Reservation reservation) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", reservation.getId());
        response.put("showtimeId", reservation.getShowtimeId());
        response.put("status", reservation.getStatus());
        response.put("totalAmount", reservation.getTotalAmount());
        response.put("confirmedAt", LocalDateTime.now());
        return response;
    }
}
