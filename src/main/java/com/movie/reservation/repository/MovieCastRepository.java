package com.movie.reservation.repository;

import com.movie.reservation.model.MovieCast;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class MovieCastRepository {

    private final JdbcTemplate jdbcTemplate;

    public MovieCastRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<MovieCast> movieCastRowMapper = (rs, rowNum) -> {
        MovieCast mc = new MovieCast();
        mc.setId(rs.getLong("id"));
        mc.setMovieId(rs.getLong("movie_id"));
        mc.setActorId(rs.getLong("actor_id"));
        mc.setRoleName(rs.getString("role_name"));
        mc.setActorName(rs.getString("actor_name"));
        return mc;
    };

    public List<MovieCast> findByMovieId(Long movieId) {
        String sql = """
            SELECT mc.*, a.name AS actor_name
            FROM movie_cast mc
            JOIN actors a ON a.id = mc.actor_id
            WHERE mc.movie_id = ?
            ORDER BY mc.id ASC
            """;
        return jdbcTemplate.query(sql, movieCastRowMapper, movieId);
    }

    public void save(Long movieId, Long actorId, String roleName) {
        String sql = "INSERT INTO movie_cast (movie_id, actor_id, role_name) VALUES (?, ?, ?)";
        jdbcTemplate.update(sql, movieId, actorId, roleName);
    }

    public void deleteByMovieId(Long movieId) {
        jdbcTemplate.update("DELETE FROM movie_cast WHERE movie_id = ?", movieId);
    }

    public void deleteById(Long id) {
        jdbcTemplate.update("DELETE FROM movie_cast WHERE id = ?", id);
    }
}