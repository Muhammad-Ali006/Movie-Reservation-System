package com.movie.reservation.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/reports")
public class AdminReportController {

    private final JdbcTemplate jdbcTemplate;

    public AdminReportController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/revenue")
    public ResponseEntity<Map<String, Object>> revenueReport() {
        Map<String, Object> response = new java.util.HashMap<>();

        Double totalRevenue = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(total_amount), 0) FROM reservations WHERE status = 'CONFIRMED'",
                Double.class);
        Integer totalBookings = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM reservations WHERE status = 'CONFIRMED'",
                Integer.class);

        List<Map<String, Object>> byMovie = jdbcTemplate.queryForList("""
            SELECT
                m.id AS "movieId",
                m.title AS "movieTitle",
                m.slug AS "movieSlug",
                COUNT(r.id) AS "bookings",
                COALESCE(SUM(r.total_amount), 0) AS "revenue"
            FROM reservations r
            JOIN showtimes s ON r.showtime_id = s.id
            JOIN movies m ON s.movie_id = m.id
            WHERE r.status = 'CONFIRMED'
            GROUP BY m.id, m.title, m.slug
            ORDER BY revenue DESC, m.title
        """);

        List<Map<String, Object>> byScreen = jdbcTemplate.queryForList("""
            SELECT
                sc.id AS "screenId",
                sc.name AS "screenName",
                sc.screen_type AS "screenType",
                COUNT(r.id) AS "bookings",
                COALESCE(SUM(r.total_amount), 0) AS "revenue"
            FROM reservations r
            JOIN showtimes s ON r.showtime_id = s.id
            JOIN screens sc ON sc.id = s.screen_number
            WHERE r.status = 'CONFIRMED'
            GROUP BY sc.id, sc.name, sc.screen_type
            ORDER BY revenue DESC, sc.name
        """);

        List<Map<String, Object>> byDate = jdbcTemplate.queryForList("""
            SELECT
                s.show_date AS "showDate",
                COUNT(r.id) AS "bookings",
                COALESCE(SUM(r.total_amount), 0) AS "revenue"
            FROM reservations r
            JOIN showtimes s ON r.showtime_id = s.id
            WHERE r.status = 'CONFIRMED'
            GROUP BY s.show_date
            ORDER BY s.show_date DESC
        """);

        response.put("totalRevenue", totalRevenue != null ? totalRevenue : 0.0);
        response.put("totalBookings", totalBookings != null ? totalBookings : 0);
        response.put("byMovie", byMovie);
        response.put("byScreen", byScreen);
        response.put("byDate", byDate);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/capacity")
    public ResponseEntity<Map<String, Object>> capacityReport() {
        Map<String, Object> response = new java.util.HashMap<>();

        List<Map<String, Object>> showtimes = jdbcTemplate.queryForList("""
            SELECT
                st.id AS "showtimeId",
                m.title AS "movieTitle",
                m.slug AS "movieSlug",
                sc.name AS "screenName",
                sc.screen_type AS "screenType",
                st.show_date AS "showDate",
                st.show_time AS "showTime",
                st.total_seats AS "totalSeats",
                COUNT(rs.id) AS "bookedSeats",
                ROUND(COUNT(rs.id) * 100.0 / NULLIF(st.total_seats, 0), 1) AS "occupancy"
            FROM showtimes st
            JOIN movies m ON st.movie_id = m.id
            JOIN screens sc ON sc.id = st.screen_number
            LEFT JOIN seats st_seat ON st_seat.showtime_id = st.id
            LEFT JOIN reservation_seats rs ON rs.seat_id = st_seat.id AND rs.is_active = true
            GROUP BY st.id, m.title, m.slug, sc.name, sc.screen_type, st.show_date, st.show_time, st.total_seats
            ORDER BY st.show_date DESC, st.show_time DESC
        """);

        List<Map<String, Object>> byScreen = jdbcTemplate.queryForList("""
            SELECT
                sc.id AS "screenId",
                sc.name AS "screenName",
                sc.screen_type AS "screenType",
                COUNT(DISTINCT st.id) AS "showtimes",
                SUM(st.total_seats) AS "totalSeats",
                COUNT(rs.id) AS "bookedSeats",
                ROUND(COUNT(rs.id) * 100.0 / NULLIF(SUM(st.total_seats), 0), 1) AS "occupancy"
            FROM showtimes st
            JOIN screens sc ON sc.id = st.screen_number
            LEFT JOIN seats st_seat ON st_seat.showtime_id = st.id
            LEFT JOIN reservation_seats rs ON rs.seat_id = st_seat.id AND rs.is_active = true
            GROUP BY sc.id, sc.name, sc.screen_type
            ORDER BY occupancy DESC, sc.name
        """);

        response.put("showtimes", showtimes);
        response.put("byScreen", byScreen);
        return ResponseEntity.ok(response);
    }
}
