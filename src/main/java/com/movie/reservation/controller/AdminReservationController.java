package com.movie.reservation.controller;

import com.movie.reservation.repository.ReservationRepository;
import com.movie.reservation.repository.SeatRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/reservations")
public class AdminReservationController {

    private final JdbcTemplate jdbcTemplate;
    private final ReservationRepository reservationRepository;
    private final SeatRepository seatRepository;

    public AdminReservationController(JdbcTemplate jdbcTemplate,
                                       ReservationRepository reservationRepository,
                                       SeatRepository seatRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.reservationRepository = reservationRepository;
        this.seatRepository = seatRepository;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllReservations(
            @RequestParam(required = false) Long screenId) {
        String whereClause = screenId != null ? "AND sc.id = ?" : "";
        String sql = """
            SELECT
                r.id,
                r.status,
                r.total_amount AS totalAmount,
                r.created_at AS createdAt,
                u.username,
                m.title AS movieTitle,
                m.slug AS movieSlug,
                sc.id AS screenId,
                sc.name AS screenName,
                s.show_date AS showDate,
                s.show_time AS showTime,
                STRING_AGG(t.row_label || t.seat_number, ', ' ORDER BY t.row_label, t.seat_number) AS seats
            FROM reservations r
            JOIN users u ON r.user_id = u.id
            JOIN showtimes s ON r.showtime_id = s.id
            JOIN movies m ON s.movie_id = m.id
            JOIN screens sc ON sc.id = s.screen_number
            JOIN reservation_seats rs ON r.id = rs.reservation_id
            JOIN seats t ON rs.seat_id = t.id
            WHERE 1=1 %s
            GROUP BY r.id, u.username, m.title, m.slug, sc.id, sc.name, s.show_date, s.show_time
            ORDER BY s.show_date DESC, s.show_time DESC, r.id DESC
        """.formatted(whereClause);

        List<Map<String, Object>> result;
        if (screenId != null) {
            result = jdbcTemplate.queryForList(sql, screenId);
        } else {
            result = jdbcTemplate.queryForList(sql);
        }
        return ResponseEntity.ok(result);
    }

    @PutMapping("/bulk-cancel")
    @Transactional
    public ResponseEntity<Map<String, Object>> bulkCancel(@RequestBody List<Long> ids) {
        int count = 0;
        for (Long id : ids) {
            var opt = reservationRepository.findById(id);
            if (opt.isPresent() && !"CANCELLED".equals(opt.get().getStatus())) {
                List<Long> seatIds = reservationRepository.findActiveSeatIdsByReservationId(id);
                seatRepository.makeSeatsAvailable(seatIds);
                reservationRepository.deactivateSeatsByReservationId(id);
                reservationRepository.cancelReservation(id, LocalDateTime.now());
                count++;
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("cancelledCount", count);
        return ResponseEntity.ok(response);
    }
}
