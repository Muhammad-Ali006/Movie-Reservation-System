package com.movie.reservation.model;

public class MovieCast {
    private Long id;
    private Long movieId;
    private Long actorId;
    private String roleName;
    private String actorName;

    public MovieCast() {}

    public MovieCast(Long id, Long movieId, Long actorId, String roleName) {
        this.id = id;
        this.movieId = movieId;
        this.actorId = actorId;
        this.roleName = roleName;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getMovieId() { return movieId; }
    public void setMovieId(Long movieId) { this.movieId = movieId; }

    public Long getActorId() { return actorId; }
    public void setActorId(Long actorId) { this.actorId = actorId; }

    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }

    public String getActorName() { return actorName; }
    public void setActorName(String actorName) { this.actorName = actorName; }
}