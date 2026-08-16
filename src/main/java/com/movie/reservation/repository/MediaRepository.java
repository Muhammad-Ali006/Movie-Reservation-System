package com.movie.reservation.repository;

import com.movie.reservation.model.Media;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class MediaRepository {

    public static final String TYPE_MOVIE_POSTER = "MOVIE_POSTER";
    public static final String TYPE_ACTOR_PHOTO = "ACTOR_PHOTO";

    private final JdbcTemplate jdbcTemplate;

    public MediaRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Media> mediaRowMapper = (rs, rowNum) -> {
        Media media = new Media();
        media.setId(rs.getLong("id"));
        media.setEntityType(rs.getString("entity_type"));
        media.setEntityId(rs.getLong("entity_id"));
        media.setFileName(rs.getString("file_name"));
        media.setContentType(rs.getString("content_type"));
        media.setData(rs.getBytes("data"));
        return media;
    };

    public Optional<Media> findByEntity(String entityType, Long entityId) {
        String sql = "SELECT * FROM media WHERE entity_type = ? AND entity_id = ?";
        var rows = jdbcTemplate.query(sql, mediaRowMapper, entityType, entityId);
        return rows.stream().findFirst();
    }

    public void upsert(String entityType, Long entityId, String fileName, String contentType, byte[] data) {
        String sql = """
            INSERT INTO media (entity_type, entity_id, file_name, content_type, data)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT (entity_type, entity_id)
            DO UPDATE SET file_name = EXCLUDED.file_name,
                          content_type = EXCLUDED.content_type,
                          data = EXCLUDED.data,
                          created_at = CURRENT_TIMESTAMP
        """;
        jdbcTemplate.update(sql, entityType, entityId, fileName, contentType, data);
    }
}
