package com.movie.reservation.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/reservations")
public class AdminReservationController {

    private final JdbcTemplate jdbcTemplate;

    public AdminReservationController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllReservations() {
        String sql = """
            SELECT
                r.id,
                r.status,
                r.total_amount AS totalAmount,
                r.created_at AS createdAt,
                u.username,
                m.title AS movieTitle,
                m.slug AS movieSlug,
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
            GROUP BY r.id, u.username, m.title, m.slug, sc.name, s.show_date, s.show_time
            ORDER BY s.show_date DESC, s.show_time DESC, r.id DESC
        """;
        List<Map<String, Object>> result = jdbcTemplate.queryForList(sql);
        return ResponseEntity.ok(result);
    }
}
