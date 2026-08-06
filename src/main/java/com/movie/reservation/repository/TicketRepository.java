package com.movie.reservation.repository;

import com.movie.reservation.model.Ticket;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.util.Objects;
import java.util.Optional;

@Repository
public class TicketRepository {

    private final JdbcTemplate jdbcTemplate;

    public TicketRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Ticket> ticketRowMapper = (rs, rowNum) -> {
        Ticket ticket = new Ticket();
        ticket.setId(rs.getLong("id"));
        ticket.setReservationId(rs.getLong("reservation_id"));
        ticket.setToken(rs.getString("token"));
        ticket.setStatus(rs.getString("status"));
        ticket.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        return ticket;
    };

    public Ticket create(Long reservationId, String token) {
        String sql = "INSERT INTO tickets (reservation_id, token, status) VALUES (?, ?, 'ACTIVE')";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"id"});
            ps.setLong(1, reservationId);
            ps.setString(2, token);
            return ps;
        }, keyHolder);

        Ticket ticket = new Ticket();
        ticket.setId(Objects.requireNonNull(keyHolder.getKey()).longValue());
        ticket.setReservationId(reservationId);
        ticket.setToken(token);
        ticket.setStatus("ACTIVE");
        return ticket;
    }

    public Optional<Ticket> findByToken(String token) {
        String sql = "SELECT * FROM tickets WHERE token = ?";
        var tickets = jdbcTemplate.query(sql, ticketRowMapper, token);
        return tickets.stream().findFirst();
    }

    public Optional<Ticket> findByReservationId(Long reservationId) {
        String sql = "SELECT * FROM tickets WHERE reservation_id = ? ORDER BY id DESC LIMIT 1";
        var tickets = jdbcTemplate.query(sql, ticketRowMapper, reservationId);
        return tickets.stream().findFirst();
    }

    public void markUsed(Long id) {
        String sql = "UPDATE tickets SET status = 'USED' WHERE id = ? AND status = 'ACTIVE'";
        jdbcTemplate.update(sql, id);
    }
}
