package com.movie.reservation.controller;

import com.movie.reservation.model.Ticket;
import com.movie.reservation.repository.TicketRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketRepository ticketRepository;
    private final JdbcTemplate jdbcTemplate;

    public TicketController(TicketRepository ticketRepository, JdbcTemplate jdbcTemplate) {
        this.ticketRepository = ticketRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/{ticketToken}")
    public ResponseEntity<Map<String, Object>> validateTicket(@PathVariable String ticketToken) {
        Ticket ticket = ticketRepository.findByToken(ticketToken).orElse(null);
        if (ticket == null) {
            return ResponseEntity.ok(buildInvalid("Invalid ticket"));
        }

        Map<String, Object> details = loadTicketDetails(ticket.getReservationId());
        if (details == null) {
            return ResponseEntity.ok(buildInvalid("Invalid ticket"));
        }

        if ("CANCELLED".equals(details.get("reservationStatus"))) {
            return ResponseEntity.ok(buildInvalid("This ticket's reservation was cancelled"));
        }

        LocalDateTime showDateTime = parseShowDateTime(details.get("showDate"), details.get("showTime"));
        if (showDateTime != null && LocalDateTime.now().isAfter(showDateTime)) {
            return ResponseEntity.ok(buildInvalid("This ticket's showtime has passed"));
        }

        if ("USED".equals(ticket.getStatus())) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ALREADY USED");
            response.put("message", "This ticket has already been scanned");
            return ResponseEntity.ok(response);
        }

        ticketRepository.markUsed(ticket.getId());
        ticket.setStatus("USED");

        Map<String, Object> response = new HashMap<>();
        response.put("status", "VALID");
        response.put("message", "Ticket is valid. Enjoy the movie!");
        response.put("ticketToken", ticket.getToken());
        response.put("reservationId", ticket.getReservationId());
        response.put("movieTitle", details.get("movieTitle"));
        response.put("screenName", details.get("screenName"));
        response.put("showDate", details.get("showDate"));
        response.put("showTime", details.get("showTime"));
        response.put("seats", details.get("seats"));
        response.put("totalAmount", details.get("totalAmount"));
        return ResponseEntity.ok(response);
    }

    private Map<String, Object> loadTicketDetails(Long reservationId) {
        String sql = """
            SELECT
                r.id AS "reservationId",
                r.status AS "reservationStatus",
                r.total_amount AS "totalAmount",
                m.title AS "movieTitle",
                sc.name AS "screenName",
                s.show_date AS "showDate",
                s.show_time AS "showTime",
                STRING_AGG(t.row_label || t.seat_number, ', ' ORDER BY t.row_label, t.seat_number) AS "seats"
            FROM reservations r
            JOIN showtimes s ON r.showtime_id = s.id
            JOIN movies m ON s.movie_id = m.id
            JOIN screens sc ON sc.id = s.screen_number
            LEFT JOIN reservation_seats rs ON r.id = rs.reservation_id AND rs.is_active = true
            LEFT JOIN seats t ON rs.seat_id = t.id
            WHERE r.id = ?
            GROUP BY r.id, m.title, sc.name, s.show_date, s.show_time
        """;
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, reservationId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    private LocalDateTime parseShowDateTime(Object dateObj, Object timeObj) {
        LocalDate date = null;
        LocalTime time = null;
        if (dateObj instanceof java.sql.Date sqlDate) {
            date = sqlDate.toLocalDate();
        } else if (dateObj instanceof LocalDate localDate) {
            date = localDate;
        }
        if (timeObj instanceof java.sql.Time sqlTime) {
            time = sqlTime.toLocalTime();
        } else if (timeObj instanceof LocalTime localTime) {
            time = localTime;
        }
        if (date == null || time == null) {
            return null;
        }
        return LocalDateTime.of(date, time);
    }

    private Map<String, Object> buildInvalid(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "INVALID");
        response.put("message", message);
        return response;
    }
}
