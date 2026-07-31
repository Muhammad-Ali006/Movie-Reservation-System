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

    public List<Movie> findAllFiltered(Long genreId, String sortBy, String sortDir, String availability, int offset, int limit) {
        StringBuilder sql = new StringBuilder("SELECT DISTINCT m.* FROM movies m");

        if (genreId != null) {
            sql.append(" INNER JOIN movie_genres mg ON m.id = mg.movie_id");
        }

        if ("NOW_SHOWING".equals(availability)) {
            sql.append(" INNER JOIN showtimes s ON m.id = s.movie_id AND s.show_date >= CURRENT_DATE");
        } else if ("COMING_SOON".equals(availability)) {
            sql.append(" LEFT JOIN showtimes s_future ON m.id = s_future.movie_id AND s_future.show_date >= CURRENT_DATE");
            sql.append(" WHERE s_future.id IS NULL");
        }

        if (genreId != null) {
            sql.append(availability != null && "COMING_SOON".equals(availability) ? " AND" : " WHERE");
            sql.append(" mg.genre_id = ?");
        }

        String validSort = switch (sortBy != null ? sortBy : "createdAt") {
            case "title" -> "m.title";
            case "releaseDate" -> "m.release_date";
            case "duration" -> "m.duration_minutes";
            default -> "m.created_at";
        };
        String direction = "asc".equalsIgnoreCase(sortDir) ? "ASC" : "DESC";

        sql.append(" ORDER BY ").append(validSort).append(" ").append(direction);
        sql.append(" LIMIT ? OFFSET ?");

        Object[] params;
        if (genreId != null) {
            params = new Object[]{genreId, limit, offset};
        } else {
            params = new Object[]{limit, offset};
        }

        return jdbcTemplate.query(sql.toString(), movieRowMapper, params);
    }

    public int countFiltered(Long genreId, String availability) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(DISTINCT m.id) FROM movies m");

        if (genreId != null) {
            sql.append(" INNER JOIN movie_genres mg ON m.id = mg.movie_id");
        }

        if ("NOW_SHOWING".equals(availability)) {
            sql.append(" INNER JOIN showtimes s ON m.id = s.movie_id AND s.show_date >= CURRENT_DATE");
        } else if ("COMING_SOON".equals(availability)) {
            sql.append(" LEFT JOIN showtimes s_future ON m.id = s_future.movie_id AND s_future.show_date >= CURRENT_DATE");
            sql.append(" WHERE s_future.id IS NULL");
        }

        if (genreId != null) {
            sql.append(availability != null && "COMING_SOON".equals(availability) ? " AND" : " WHERE");
            sql.append(" mg.genre_id = ?");
        }

        Object[] params = genreId != null ? new Object[]{genreId} : new Object[]{};
        Integer count = jdbcTemplate.queryForObject(sql.toString(), Integer.class, params);
        return count != null ? count : 0;
    }

    public List<Long> findIdsWithFutureShowtimes() {
        String sql = "SELECT DISTINCT movie_id FROM showtimes WHERE show_date >= CURRENT_DATE";
        return jdbcTemplate.queryForList(sql, Long.class);
    }

    public Optional<Movie> findById(Long id) {
        String sql = "SELECT * FROM movies WHERE id = ?";
        var movies = jdbcTemplate.query(sql, movieRowMapper, id);
        return movies.stream().findFirst();
    }

    public Optional<Movie> findBySlug(String slug) {
        String sql = "SELECT * FROM movies WHERE slug = ?";
        var movies = jdbcTemplate.query(sql, movieRowMapper, slug);
        return movies.stream().findFirst();
    }

    public String generateSlug(String title) {
        String baseSlug = java.text.Normalizer.normalize(title, java.text.Normalizer.Form.NFD)
                .replaceAll("[^a-zA-Z0-9\\s-]", "")
                .replaceAll("[\\s-]+", "-")
                .replaceAll("^-|-$", "")
                .toLowerCase();

        String slug = baseSlug;
        int counter = 2;
        while (jdbcTemplate.queryForObject("SELECT COUNT(*) FROM movies WHERE slug = ?", Integer.class, slug) > 0) {
            slug = baseSlug + "-" + counter;
            counter++;
        }
        return slug;
    }

    public Movie save(Movie movie) {
        String slug = generateSlug(movie.getTitle());
        movie.setSlug(slug);

        String sql = "INSERT INTO movies (title, slug, description, poster_url, duration_minutes, release_date, original_language, director) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql, movie.getTitle(), movie.getSlug(), movie.getDescription(), movie.getPosterUrl(),
                movie.getDurationMinutes(), movie.getReleaseDate(), movie.getOriginalLanguage(), movie.getDirector());

        String findSql = "SELECT * FROM movies WHERE slug = ? ORDER BY created_at DESC";
        return jdbcTemplate.queryForObject(findSql, movieRowMapper, movie.getSlug());
    }

    public void update(Movie movie) {
        if (movie.getSlug() == null) {
            movie.setSlug(generateSlug(movie.getTitle()));
        }

        String sql = "UPDATE movies SET title = ?, slug = ?, description = ?, poster_url = ?, duration_minutes = ?, release_date = ?, original_language = ?, director = ? WHERE id = ?";
        jdbcTemplate.update(sql, movie.getTitle(), movie.getSlug(), movie.getDescription(), movie.getPosterUrl(),
                movie.getDurationMinutes(), movie.getReleaseDate(), movie.getOriginalLanguage(), movie.getDirector(), movie.getId());
    }

    public void updatePosterUrl(Long id, String posterUrl) {
        jdbcTemplate.update("UPDATE movies SET poster_url = ? WHERE id = ?", posterUrl, id);
    }

    public void deleteById(Long id) {
        jdbcTemplate.update("DELETE FROM movies WHERE id = ?", id);
    }

    public boolean existsById(Long id) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM movies WHERE id = ?", Integer.class, id);
        return count != null && count > 0;
    }

    public void saveGenres(Long movieId, List<Long> genreIds) {
        String sql = "INSERT INTO movie_genres (movie_id, genre_id) VALUES (?, ?)";
        for (Long genreId : genreIds) {
            jdbcTemplate.update(sql, movieId, genreId);
        }
    }

    public void deleteGenresByMovieId(Long movieId) {
        jdbcTemplate.update("DELETE FROM movie_genres WHERE movie_id = ?", movieId);
    }

    public List<Long> findGenreIdsByMovieId(Long movieId) {
        String sql = "SELECT genre_id FROM movie_genres WHERE movie_id = ? ORDER BY genre_id ASC";
        return jdbcTemplate.queryForList(sql, Long.class, movieId);
    }

    private Movie mapMovie(ResultSet rs) throws SQLException {
        Movie movie = new Movie();
        movie.setId(rs.getLong("id"));
        movie.setTitle(rs.getString("title"));
        movie.setSlug(rs.getString("slug"));
        movie.setDescription(rs.getString("description"));
        movie.setPosterUrl(rs.getString("poster_url"));
        movie.setDurationMinutes(rs.getInt("duration_minutes"));
        java.sql.Date releaseDate = rs.getDate("release_date");
        if (releaseDate != null) {
            movie.setReleaseDate(releaseDate.toLocalDate());
        }
        movie.setOriginalLanguage(rs.getString("original_language"));
        movie.setDirector(rs.getString("director"));
        movie.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        return movie;
    }
}
