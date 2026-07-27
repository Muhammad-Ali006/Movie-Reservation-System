package com.movie.reservation.repository;

import com.movie.reservation.model.Screen;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class ScreenRepository {

    private final JdbcTemplate jdbcTemplate;

    public ScreenRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Screen> screenRowMapper = (rs, rowNum) -> {
        Screen screen = new Screen();
        screen.setId(rs.getLong("id"));
        screen.setName(rs.getString("name"));
        screen.setScreenType(rs.getString("screen_type"));
        screen.setTotalSeats(rs.getInt("total_seats"));
        screen.setSeatsPerRow(rs.getInt("seats_per_row"));
        return screen;
    };

    public List<Screen> findAll() {
        String sql = "SELECT * FROM screens ORDER BY id ASC";
        return jdbcTemplate.query(sql, screenRowMapper);
    }

    public Optional<Screen> findById(Long id) {
        String sql = "SELECT * FROM screens WHERE id = ?";
        var screens = jdbcTemplate.query(sql, screenRowMapper, id);
        return screens.stream().findFirst();
    }

    public void save(Screen screen) {
        String sql = "INSERT INTO screens (name, screen_type, total_seats, seats_per_row) VALUES (?, ?, ?, ?)";
        jdbcTemplate.update(sql, screen.getName(), screen.getScreenType(), screen.getTotalSeats(), screen.getSeatsPerRow());
    }

    public boolean existsByName(String name) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM screens WHERE name = ?", Integer.class, name);
        return count != null && count > 0;
    }
}
