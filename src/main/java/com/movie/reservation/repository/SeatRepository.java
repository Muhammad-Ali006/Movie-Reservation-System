package com.movie.reservation.repository;

import com.movie.reservation.model.Seat;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class SeatRepository {

    private final JdbcTemplate jdbcTemplate;

    public SeatRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Seat> seatRowMapper = (rs, rowNum) -> {
        Seat seat = new Seat();
        seat.setId(rs.getLong("id"));
        seat.setShowtimeId(rs.getLong("showtime_id"));
        seat.setSeatNumber(rs.getString("seat_number"));
        seat.setRowLabel(rs.getString("row_label"));
        seat.setAvailable(rs.getBoolean("is_available"));
        return seat;
    };

    public List<Seat> findByShowtimeId(Long showtimeId) {
        String sql = "SELECT * FROM seats WHERE showtime_id = ? ORDER BY row_label ASC, seat_number ASC";
        return jdbcTemplate.query(sql, seatRowMapper, showtimeId);
    }

    public List<Seat> findByShowtimeIdForUpdate(Long showtimeId) {
        String sql = "SELECT * FROM seats WHERE showtime_id = ? ORDER BY row_label ASC, seat_number ASC FOR UPDATE";
        return jdbcTemplate.query(sql, seatRowMapper, showtimeId);
    }

    public void saveAll(List<Seat> seats) {
        String sql = "INSERT INTO seats (showtime_id, seat_number, row_label, is_available) VALUES (?, ?, ?, ?)";
        for (Seat seat : seats) {
            jdbcTemplate.update(sql, seat.getShowtimeId(), seat.getSeatNumber(), seat.getRowLabel(), seat.isAvailable());
        }
    }

    public int countAvailableByShowtimeId(Long showtimeId) {
        String sql = "SELECT COUNT(*) FROM seats WHERE showtime_id = ? AND is_available = true";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, showtimeId);
        return count != null ? count : 0;
    }

    public void markSeatsUnavailable(List<Long> seatIds) {
        String sql = "UPDATE seats SET is_available = false WHERE id = ?";
        for (Long seatId : seatIds) {
            jdbcTemplate.update(sql, seatId);
        }
    }

    public void makeSeatsAvailable(List<Long> seatIds) {
        String sql = "UPDATE seats SET is_available = true WHERE id = ?";
        for (Long seatId : seatIds) {
            jdbcTemplate.update(sql, seatId);
        }
    }
}
