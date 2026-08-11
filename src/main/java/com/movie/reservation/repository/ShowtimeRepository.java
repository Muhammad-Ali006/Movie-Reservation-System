package com.movie.reservation.repository;

import com.movie.reservation.model.Showtime;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Repository
public class ShowtimeRepository {

    private final JdbcTemplate jdbcTemplate;

    public ShowtimeRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Showtime> showtimeRowMapper = (rs, rowNum) -> mapShowtime(rs);

    public List<Showtime> findAllByMovieId(Long movieId) {
        String sql = "SELECT * FROM showtimes WHERE movie_id = ? ORDER BY show_date ASC, show_time ASC";
        return jdbcTemplate.query(sql, showtimeRowMapper, movieId);
    }

    public List<Showtime> findAll() {
        String sql = "SELECT * FROM showtimes ORDER BY show_date DESC, show_time DESC, id DESC";
        return jdbcTemplate.query(sql, showtimeRowMapper);
    }

    public void updateDateTimePrice(Long id, LocalDate showDate, LocalTime showTime, BigDecimal pricePerSeat) {
        String sql = "UPDATE showtimes SET show_date = ?, show_time = ?, price_per_seat = ? WHERE id = ?";
        jdbcTemplate.update(sql, showDate, showTime, pricePerSeat, id);
    }

    public Optional<Showtime> findById(Long id) {
        String sql = "SELECT * FROM showtimes WHERE id = ?";
        var showtimes = jdbcTemplate.query(sql, showtimeRowMapper, id);
        return showtimes.stream().findFirst();
    }

    public boolean existsWithSameMovieScreenDateTime(Long movieId, int screenNumber, LocalDate showDate, LocalTime showTime) {
        String sql = "SELECT COUNT(*) FROM showtimes WHERE movie_id = ? AND screen_number = ? AND show_date = ? AND show_time = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, movieId, screenNumber, showDate, showTime);
        return count != null && count > 0;
    }

    public Showtime save(Showtime showtime) {
        String sql = "INSERT INTO showtimes (movie_id, show_date, show_time, screen_number, total_seats, price_per_seat) VALUES (?, ?, ?, ?, ?, ?)";

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"id"});
            ps.setLong(1, showtime.getMovieId());
            ps.setDate(2, java.sql.Date.valueOf(showtime.getShowDate()));
            ps.setTime(3, java.sql.Time.valueOf(showtime.getShowTime()));
            ps.setInt(4, showtime.getScreenNumber());
            ps.setInt(5, showtime.getTotalSeats());
            ps.setBigDecimal(6, showtime.getPricePerSeat());
            return ps;
        }, keyHolder);

        showtime.setId(Objects.requireNonNull(keyHolder.getKey()).longValue());
        return showtime;
    }

    public void deleteById(Long id) {
        String sql = "DELETE FROM showtimes WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    private Showtime mapShowtime(ResultSet rs) throws SQLException {
        Showtime showtime = new Showtime();
        showtime.setId(rs.getLong("id"));
        showtime.setMovieId(rs.getLong("movie_id"));
        java.sql.Date showDate = rs.getDate("show_date");
        if (showDate != null) {
            showtime.setShowDate(showDate.toLocalDate());
        }
        java.sql.Time showTime = rs.getTime("show_time");
        if (showTime != null) {
            showtime.setShowTime(showTime.toLocalTime());
        }
        showtime.setScreenNumber(rs.getInt("screen_number"));
        showtime.setTotalSeats(rs.getInt("total_seats"));
        showtime.setPricePerSeat(rs.getBigDecimal("price_per_seat"));
        showtime.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        return showtime;
    }
}
