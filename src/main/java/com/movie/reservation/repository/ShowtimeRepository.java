package com.movie.reservation.repository;

import com.movie.reservation.model.Showtime;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
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

    public Optional<Showtime> findById(Long id) {
        String sql = "SELECT * FROM showtimes WHERE id = ?";
        var showtimes = jdbcTemplate.query(sql, showtimeRowMapper, id);
        return showtimes.stream().findFirst();
    }

    public Showtime save(Showtime showtime) {
        String sql = "INSERT INTO showtimes (movie_id, show_date, show_time, screen_number, total_seats, price_per_seat) VALUES (?, ?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql, showtime.getMovieId(), showtime.getShowDate(), showtime.getShowTime(),
                showtime.getScreenNumber(), showtime.getTotalSeats(), showtime.getPricePerSeat());

        String findSql = "SELECT * FROM showtimes WHERE movie_id = ? AND show_date = ? AND show_time = ? AND screen_number = ? ORDER BY id DESC";
        return jdbcTemplate.queryForObject(findSql, showtimeRowMapper, showtime.getMovieId(),
                showtime.getShowDate(), showtime.getShowTime(), showtime.getScreenNumber());
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
