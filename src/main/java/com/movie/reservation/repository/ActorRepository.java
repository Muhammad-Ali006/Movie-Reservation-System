package com.movie.reservation.repository;

import com.movie.reservation.model.Actor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class ActorRepository {

    private final JdbcTemplate jdbcTemplate;

    public ActorRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Actor> actorRowMapper = (rs, rowNum) -> {
        Actor actor = new Actor();
        actor.setId(rs.getLong("id"));
        actor.setName(rs.getString("name"));
        actor.setBio(rs.getString("bio"));
        actor.setPhotoUrl(rs.getString("photo_url"));
        return actor;
    };

    public List<Actor> findAll() {
        String sql = "SELECT * FROM actors ORDER BY name ASC";
        return jdbcTemplate.query(sql, actorRowMapper);
    }

    public Optional<Actor> findById(Long id) {
        String sql = "SELECT * FROM actors WHERE id = ?";
        var actors = jdbcTemplate.query(sql, actorRowMapper, id);
        return actors.stream().findFirst();
    }

    public Actor save(Actor actor) {
        String sql = "INSERT INTO actors (name, bio, photo_url) VALUES (?, ?, ?)";
        jdbcTemplate.update(sql, actor.getName(), actor.getBio(), actor.getPhotoUrl());

        String findSql = "SELECT * FROM actors WHERE name = ?";
        return jdbcTemplate.queryForObject(findSql, actorRowMapper, actor.getName());
    }

    public void update(Actor actor) {
        String sql = "UPDATE actors SET name = ?, bio = ?, photo_url = ? WHERE id = ?";
        jdbcTemplate.update(sql, actor.getName(), actor.getBio(), actor.getPhotoUrl(), actor.getId());
    }

    public void deleteById(Long id) {
        jdbcTemplate.update("DELETE FROM movie_cast WHERE actor_id = ?", id);
        jdbcTemplate.update("DELETE FROM actors WHERE id = ?", id);
    }
}