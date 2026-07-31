package com.movie.reservation.controller;

import com.movie.reservation.exception.ResourceNotFoundException;
import com.movie.reservation.model.Movie;
import com.movie.reservation.model.Screen;
import com.movie.reservation.model.Seat;
import com.movie.reservation.model.Showtime;
import com.movie.reservation.repository.MovieRepository;
import com.movie.reservation.repository.ScreenRepository;
import com.movie.reservation.repository.SeatRepository;
import com.movie.reservation.repository.ShowtimeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/showtimes")
public class ShowtimeController {

    private final ShowtimeRepository showtimeRepository;
    private final ScreenRepository screenRepository;
    private final SeatRepository seatRepository;
    private final MovieRepository movieRepository;

    public ShowtimeController(ShowtimeRepository showtimeRepository,
                               ScreenRepository screenRepository,
                               SeatRepository seatRepository,
                               MovieRepository movieRepository) {
        this.showtimeRepository = showtimeRepository;
        this.screenRepository = screenRepository;
        this.seatRepository = seatRepository;
        this.movieRepository = movieRepository;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getShowtimesByMovie(@RequestParam Long movieId) {
        List<Showtime> showtimes = showtimeRepository.findAllByMovieId(movieId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Showtime showtime : showtimes) {
            Screen screen = screenRepository.findById((long) showtime.getScreenNumber()).orElse(null);
            int availableSeats = seatRepository.countAvailableByShowtimeId(showtime.getId());

            Map<String, Object> item = new HashMap<>();
            item.put("id", showtime.getId());
            item.put("movieId", showtime.getMovieId());
            item.put("showDate", showtime.getShowDate());
            item.put("showTime", showtime.getShowTime());
            item.put("screenName", screen != null ? screen.getName() : "Screen " + showtime.getScreenNumber());
            item.put("screenType", screen != null ? screen.getScreenType() : "UNKNOWN");
            item.put("totalSeats", showtime.getTotalSeats());
            item.put("availableSeats", availableSeats);
            item.put("pricePerSeat", showtime.getPricePerSeat());

            result.add(item);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{showtimeId}/seats")
    public ResponseEntity<List<Map<String, Object>>> getSeatsByShowtime(@PathVariable Long showtimeId) {
        showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new ResourceNotFoundException("Showtime not found"));

        List<Seat> seats = seatRepository.findByShowtimeId(showtimeId);

        List<Map<String, Object>> result = new ArrayList<>();
        for (Seat seat : seats) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", seat.getId());
            item.put("seatNumber", seat.getSeatNumber());
            item.put("rowLabel", seat.getRowLabel());
            item.put("status", seat.isAvailable() ? "AVAILABLE" : "BOOKED");
            result.add(item);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{showtimeId}")
    public ResponseEntity<Map<String, Object>> getShowtimeById(@PathVariable Long showtimeId) {
        Showtime showtime = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new ResourceNotFoundException("Showtime not found"));

        Movie movie = movieRepository.findById(showtime.getMovieId()).orElse(null);
        Screen screen = screenRepository.findById((long) showtime.getScreenNumber()).orElse(null);
        int availableSeats = seatRepository.countAvailableByShowtimeId(showtimeId);

        Map<String, Object> result = new HashMap<>();
        result.put("id", showtime.getId());
        result.put("movieId", showtime.getMovieId());
        result.put("movieTitle", movie != null ? movie.getTitle() : null);
        result.put("movieSlug", movie != null ? movie.getSlug() : null);
        result.put("showDate", showtime.getShowDate());
        result.put("showTime", showtime.getShowTime());
        result.put("screenNumber", showtime.getScreenNumber());
        result.put("screenName", screen != null ? screen.getName() : "Screen " + showtime.getScreenNumber());
        result.put("screenType", screen != null ? screen.getScreenType() : "UNKNOWN");
        result.put("totalSeats", showtime.getTotalSeats());
        result.put("availableSeats", availableSeats);
        result.put("pricePerSeat", showtime.getPricePerSeat());

        return ResponseEntity.ok(result);
    }
}
