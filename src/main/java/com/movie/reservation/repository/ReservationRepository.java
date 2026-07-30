package com.movie.reservation.repository;

import com.movie.reservation.model.Reservation;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Repository
public class ReservationRepository {

    private final JdbcTemplate jdbcTemplate;

    public ReservationRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Reservation> reservationRowMapper = (rs, rowNum) -> {
        Reservation reservation = new Reservation();
        reservation.setId(rs.getLong("id"));
        reservation.setUserId(rs.getLong("user_id"));
        reservation.setShowtimeId(rs.getLong("showtime_id"));
        reservation.setStatus(rs.getString("status"));
        reservation.setTotalAmount(rs.getBigDecimal("total_amount"));
        reservation.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        Timestamp cancelledTs = rs.getTimestamp("cancelled_at");
        if (cancelledTs != null) {
            reservation.setCancelledAt(cancelledTs.toLocalDateTime());
        }
        return reservation;
    };

    public Optional<Reservation> findById(Long id) {
        String sql = "SELECT * FROM reservations WHERE id = ?";
        var reservations = jdbcTemplate.query(sql, reservationRowMapper, id);
        return reservations.stream().findFirst();
    }

    public Reservation save(Reservation reservation) {
        String sql = "INSERT INTO reservations (user_id, showtime_id, status, total_amount, created_at) VALUES (?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"id"});
            ps.setLong(1, reservation.getUserId());
            ps.setLong(2, reservation.getShowtimeId());
            ps.setString(3, reservation.getStatus());
            ps.setBigDecimal(4, reservation.getTotalAmount());
            ps.setTimestamp(5, Timestamp.valueOf(reservation.getCreatedAt()));
            return ps;
        }, keyHolder);

        reservation.setId(Objects.requireNonNull(keyHolder.getKey()).longValue());
        return reservation;
    }

    public void saveReservationSeat(Long reservationId, Long seatId) {
        String sql = "INSERT INTO reservation_seats (reservation_id, seat_id) VALUES (?, ?)";
        jdbcTemplate.update(sql, reservationId, seatId);
    }

    public List<Long> findSeatIdsByReservationId(Long reservationId) {
        String sql = "SELECT seat_id FROM reservation_seats WHERE reservation_id = ?";
        return jdbcTemplate.queryForList(sql, Long.class, reservationId);
    }

    public void cancelReservation(Long id, LocalDateTime cancelledAt) {
        String sql = "UPDATE reservations SET status = 'CANCELLED', cancelled_at = ? WHERE id = ?";
        jdbcTemplate.update(sql, Timestamp.valueOf(cancelledAt), id);
    }
}
