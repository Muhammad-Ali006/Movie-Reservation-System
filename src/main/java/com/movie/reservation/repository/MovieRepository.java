package com.movie.reservation.repository;

import com.movie.reservation.model.Movie;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
public class MovieRepository {

    private final JdbcTemplate jdbcTemplate;

    public MovieRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Movie> movieRowMapper = (rs, rowNum) -> mapMovie(rs);

    public List<Movie> findAll() {
        String sql = "SELECT * FROM movies ORDER BY created_at DESC";
        return jdbcTemplate.query(sql, movieRowMapper);
    }

    public Optional<Movie> findById(Long id) {
        String sql = "SELECT * FROM movies WHERE id = ?";
        var movies = jdbcTemplate.query(sql, movieRowMapper, id);
        return movies.stream().findFirst();
    }

    public Movie save(Movie movie) {
        String sql = "INSERT INTO movies (title, description, poster_url, genre_id, duration_minutes) VALUES (?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql, movie.getTitle(), movie.getDescription(), movie.getPosterUrl(),
                movie.getGenreId(), movie.getDurationMinutes());

        String findSql = "SELECT * FROM movies WHERE title = ? ORDER BY created_at DESC";
        return jdbcTemplate.queryForObject(findSql, movieRowMapper, movie.getTitle());
    }

    public void update(Movie movie) {
        String sql = "UPDATE movies SET title = ?, description = ?, poster_url = ?, genre_id = ?, duration_minutes = ? WHERE id = ?";
        jdbcTemplate.update(sql, movie.getTitle(), movie.getDescription(), movie.getPosterUrl(),
                movie.getGenreId(), movie.getDurationMinutes(), movie.getId());
    }

    public void updatePosterUrl(Long id, String posterUrl) {
        jdbcTemplate.update("UPDATE movies SET poster_url = ? WHERE id = ?", posterUrl, id);
    }

    public void deleteById(Long id) {
        jdbcTemplate.update("DELETE FROM movie_cast WHERE movie_id = ?", id);
        jdbcTemplate.update("DELETE FROM movies WHERE id = ?", id);
    }

    public boolean existsById(Long id) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM movies WHERE id = ?", Integer.class, id);
        return count != null && count > 0;
    }

    private Movie mapMovie(ResultSet rs) throws SQLException {
        Movie movie = new Movie();
        movie.setId(rs.getLong("id"));
        movie.setTitle(rs.getString("title"));
        movie.setDescription(rs.getString("description"));
        movie.setPosterUrl(rs.getString("poster_url"));
        movie.setGenreId(rs.getLong("genre_id"));
        movie.setDurationMinutes(rs.getInt("duration_minutes"));
        movie.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        return movie;
    }
}