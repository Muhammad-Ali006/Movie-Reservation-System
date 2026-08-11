package com.movie.reservation.controller;

import com.movie.reservation.dto.request.ShowtimeRequest;
import com.movie.reservation.exception.ResourceNotFoundException;
import com.movie.reservation.model.Movie;
import com.movie.reservation.model.Screen;
import com.movie.reservation.model.Seat;
import com.movie.reservation.model.Showtime;
import com.movie.reservation.repository.MovieRepository;
import com.movie.reservation.repository.ReservationRepository;
import com.movie.reservation.repository.ScreenRepository;
import com.movie.reservation.repository.SeatRepository;
import com.movie.reservation.repository.ShowtimeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/showtimes")
public class AdminShowtimeController {

    private final ShowtimeRepository showtimeRepository;
    private final ScreenRepository screenRepository;
    private final SeatRepository seatRepository;
    private final MovieRepository movieRepository;
    private final ReservationRepository reservationRepository;
    private final JdbcTemplate jdbcTemplate;

    public AdminShowtimeController(ShowtimeRepository showtimeRepository,
                                    ScreenRepository screenRepository,
                                    SeatRepository seatRepository,
                                    MovieRepository movieRepository,
                                    ReservationRepository reservationRepository,
                                    JdbcTemplate jdbcTemplate) {
        this.showtimeRepository = showtimeRepository;
        this.screenRepository = screenRepository;
        this.seatRepository = seatRepository;
        this.movieRepository = movieRepository;
        this.reservationRepository = reservationRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createShowtime(@RequestBody ShowtimeRequest request) {
        if (request.getMovieId() == null) {
            throw new IllegalArgumentException("movieId is required");
        }
        if (request.getScreenId() == null) {
            throw new IllegalArgumentException("screenId is required");
        }
        if (request.getShowDate() == null || request.getShowTime() == null || request.getPricePerSeat() == null) {
            throw new IllegalArgumentException("showDate, showTime, and pricePerSeat are required");
        }
        if (request.getPricePerSeat().signum() < 0) {
            throw new IllegalArgumentException("Price per seat cannot be negative");
        }
        if (request.getShowDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Show date cannot be in the past");
        }

        if (!movieRepository.existsById(request.getMovieId())) {
            throw new ResourceNotFoundException("Movie not found");
        }

        Screen screen = screenRepository.findById(request.getScreenId())
                .orElseThrow(() -> new ResourceNotFoundException("Screen not found"));

        if (showtimeRepository.existsWithSameMovieScreenDateTime(
                request.getMovieId(), screen.getId().intValue(), request.getShowDate(), request.getShowTime())) {
            throw new IllegalArgumentException("A showtime for this movie already exists on this screen at this date and time");
        }

        Showtime showtime = new Showtime();
        showtime.setMovieId(request.getMovieId());
        showtime.setShowDate(request.getShowDate());
        showtime.setShowTime(request.getShowTime());
        showtime.setScreenNumber(screen.getId().intValue());
        showtime.setTotalSeats(screen.getTotalSeats());
        showtime.setPricePerSeat(request.getPricePerSeat());

        Showtime saved = showtimeRepository.save(showtime);

        int totalSeats = screen.getTotalSeats();
        int seatsPerRow = screen.getSeatsPerRow();
        int totalRows = totalSeats / seatsPerRow;

        List<Seat> seats = new ArrayList<>();
        for (int row = 0; row < totalRows; row++) {
            char rowLabel = (char) ('A' + row);
            int seatsInThisRow = (row == totalRows - 1) ? totalSeats - (row * seatsPerRow) : seatsPerRow;
            for (int s = 1; s <= seatsInThisRow; s++) {
                Seat seat = new Seat();
                seat.setShowtimeId(saved.getId());
                seat.setRowLabel(String.valueOf(rowLabel));
                seat.setSeatNumber(String.valueOf(s));
                seat.setAvailable(true);
                seats.add(seat);
            }
        }

        seatRepository.saveAll(seats);

        Map<String, Object> response = new HashMap<>();
        response.put("id", saved.getId());
        response.put("movieId", saved.getMovieId());
        response.put("showDate", saved.getShowDate());
        response.put("showTime", saved.getShowTime());
        response.put("screenName", screen.getName());
        response.put("screenType", screen.getScreenType());
        response.put("totalSeats", saved.getTotalSeats());
        response.put("pricePerSeat", saved.getPricePerSeat());
        response.put("seatsGenerated", seats.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllShowtimes(
            @RequestParam(required = false) Long movieId,
            @RequestParam(required = false) Long screenId) {
        List<Showtime> showtimes = showtimeRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Showtime showtime : showtimes) {
            if (movieId != null && !movieId.equals(showtime.getMovieId())) continue;
            if (screenId != null && screenId.longValue() != showtime.getScreenNumber()) continue;

            Movie movie = movieRepository.findById(showtime.getMovieId()).orElse(null);
            Screen screen = screenRepository.findById((long) showtime.getScreenNumber()).orElse(null);
            int availableSeats = seatRepository.countAvailableByShowtimeId(showtime.getId());
            int activeBookings = reservationRepository.countActiveByShowtimeId(showtime.getId());

            Map<String, Object> item = new HashMap<>();
            item.put("id", showtime.getId());
            item.put("movieId", showtime.getMovieId());
            item.put("movieTitle", movie != null ? movie.getTitle() : null);
            item.put("movieSlug", movie != null ? movie.getSlug() : null);
            item.put("screenId", showtime.getScreenNumber());
            item.put("screenName", screen != null ? screen.getName() : "Screen " + showtime.getScreenNumber());
            item.put("screenType", screen != null ? screen.getScreenType() : "UNKNOWN");
            item.put("showDate", showtime.getShowDate());
            item.put("showTime", showtime.getShowTime());
            item.put("totalSeats", showtime.getTotalSeats());
            item.put("availableSeats", availableSeats);
            item.put("pricePerSeat", showtime.getPricePerSeat());
            item.put("activeBookings", activeBookings);

            result.add(item);
        }

        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateShowtime(
            @PathVariable Long id,
            @RequestBody ShowtimeRequest request) {
        showtimeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Showtime not found"));

        if (request.getShowDate() == null || request.getShowTime() == null || request.getPricePerSeat() == null) {
            throw new IllegalArgumentException("showDate, showTime, and pricePerSeat are required");
        }
        if (request.getPricePerSeat().signum() < 0) {
            throw new IllegalArgumentException("Price per seat cannot be negative");
        }
        if (request.getShowDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Show date cannot be in the past");
        }

        int activeBookings = reservationRepository.countActiveByShowtimeId(id);
        if (activeBookings > 0) {
            throw new IllegalArgumentException(
                "Cannot update showtime: " + activeBookings + " active booking(s) exist. Cancel them first."
            );
        }

        showtimeRepository.updateDateTimePrice(id, request.getShowDate(), request.getShowTime(), request.getPricePerSeat());

        Map<String, Object> response = new HashMap<>();
        response.put("id", id);
        response.put("showDate", request.getShowDate());
        response.put("showTime", request.getShowTime());
        response.put("pricePerSeat", request.getPricePerSeat());
        response.put("message", "Showtime updated successfully");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/seats")
    public ResponseEntity<List<Map<String, Object>>> getShowtimeSeats(@PathVariable Long id) {
        showtimeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Showtime not found"));

        String sql = """
            SELECT
                s.id,
                s.seat_number AS "seatNumber",
                s.row_label AS "rowLabel",
                r.status AS "reservationStatus",
                r.id AS "reservationId",
                u.username,
                r.total_amount AS "totalAmount"
            FROM seats s
            LEFT JOIN reservation_seats rs ON rs.seat_id = s.id AND rs.is_active = true
            LEFT JOIN reservations r ON r.id = rs.reservation_id
            LEFT JOIN users u ON u.id = r.user_id
            WHERE s.showtime_id = ?
            ORDER BY s.row_label ASC, s.seat_number ASC
        """;

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> row : jdbcTemplate.queryForList(sql, id)) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", row.get("id"));
            item.put("seatNumber", row.get("seatNumber"));
            item.put("rowLabel", row.get("rowLabel"));

            String reservationStatus = (String) row.get("reservationStatus");
            String status;
            if (reservationStatus == null) {
                status = "AVAILABLE";
            } else if ("PENDING".equals(reservationStatus)) {
                status = "HELD";
            } else {
                status = "BOOKED";
            }

            item.put("status", status);
            item.put("reservationId", row.get("reservationId"));
            item.put("username", row.get("username"));
            item.put("totalAmount", row.get("totalAmount"));
            result.add(item);
        }

        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Map<String, Object>> deleteShowtime(@PathVariable Long id) {
        Showtime showtime = showtimeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Showtime not found"));

        Integer activeCount = jdbcTemplate.queryForObject("""
            SELECT COUNT(*) FROM reservations WHERE showtime_id = ? AND status IN ('CONFIRMED', 'PENDING')
        """, Integer.class, id);

        if (activeCount != null && activeCount > 0) {
            throw new IllegalArgumentException(
                "Cannot delete showtime: " + activeCount + " active booking(s) exist. Cancel them first."
            );
        }

        jdbcTemplate.update("DELETE FROM reservation_seats WHERE seat_id IN (SELECT id FROM seats WHERE showtime_id = ?)", id);
        jdbcTemplate.update("DELETE FROM reservations WHERE showtime_id = ?", id);
        jdbcTemplate.update("DELETE FROM seats WHERE showtime_id = ?", id);
        showtimeRepository.deleteById(id);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Showtime deleted successfully");
        return ResponseEntity.ok(response);
    }
}
