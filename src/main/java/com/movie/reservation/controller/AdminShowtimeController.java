package com.movie.reservation.controller;

import com.movie.reservation.dto.request.ShowtimeRequest;
import com.movie.reservation.exception.ResourceNotFoundException;
import com.movie.reservation.model.Screen;
import com.movie.reservation.model.Seat;
import com.movie.reservation.model.Showtime;
import com.movie.reservation.repository.MovieRepository;
import com.movie.reservation.repository.ScreenRepository;
import com.movie.reservation.repository.SeatRepository;
import com.movie.reservation.repository.ShowtimeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

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
    private final JdbcTemplate jdbcTemplate;

    public AdminShowtimeController(ShowtimeRepository showtimeRepository,
                                    ScreenRepository screenRepository,
                                    SeatRepository seatRepository,
                                    MovieRepository movieRepository,
                                    JdbcTemplate jdbcTemplate) {
        this.showtimeRepository = showtimeRepository;
        this.screenRepository = screenRepository;
        this.seatRepository = seatRepository;
        this.movieRepository = movieRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createShowtime(@RequestBody ShowtimeRequest request) {
        if (!movieRepository.existsById(request.getMovieId())) {
            throw new ResourceNotFoundException("Movie not found");
        }

        Screen screen = screenRepository.findById(request.getScreenId())
                .orElseThrow(() -> new ResourceNotFoundException("Screen not found"));

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
