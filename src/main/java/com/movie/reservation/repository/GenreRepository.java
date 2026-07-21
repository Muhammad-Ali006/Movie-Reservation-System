package com.movie.reservation.repository;

import com.movie.reservation.model.Genre;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class GenreRepository {

    private final JdbcTemplate jdbcTemplate;

    public GenreRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Genre> genreRowMapper = (rs, rowNum) -> {
        Genre genre = new Genre();
        genre.setId(rs.getLong("id"));
        genre.setName(rs.getString("name"));
        genre.setDescription(rs.getString("description"));
        return genre;
    };

    public List<Genre> findAll() {
        String sql = "SELECT * FROM genres ORDER BY name ASC";
        return jdbcTemplate.query(sql, genreRowMapper);
    }

    public Optional<Genre> findById(Long id) {
        String sql = "SELECT * FROM genres WHERE id = ?";
        var genres = jdbcTemplate.query(sql, genreRowMapper, id);
        return genres.stream().findFirst();
    }

    public Genre save(Genre genre) {
        String sql = "INSERT INTO genres (name, description) VALUES (?, ?)";
        jdbcTemplate.update(sql, genre.getName(), genre.getDescription());

        String findSql = "SELECT * FROM genres WHERE name = ?";
        return jdbcTemplate.queryForObject(findSql, genreRowMapper, genre.getName());
    }

    public void update(Genre genre) {
        String sql = "UPDATE genres SET name = ?, description = ? WHERE id = ?";
        jdbcTemplate.update(sql, genre.getName(), genre.getDescription(), genre.getId());
    }

    public void deleteById(Long id) {
        jdbcTemplate.update("DELETE FROM genres WHERE id = ?", id);
    }
}