package com.movie.reservation.model;

public class Screen {
    private Long id;
    private String name;
    private String screenType;
    private int totalSeats;
    private int seatsPerRow;

    public Screen() {}

    public Screen(Long id, String name, String screenType, int totalSeats, int seatsPerRow) {
        this.id = id;
        this.name = name;
        this.screenType = screenType;
        this.totalSeats = totalSeats;
        this.seatsPerRow = seatsPerRow;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getScreenType() { return screenType; }
    public void setScreenType(String screenType) { this.screenType = screenType; }

    public int getTotalSeats() { return totalSeats; }
    public void setTotalSeats(int totalSeats) { this.totalSeats = totalSeats; }

    public int getSeatsPerRow() { return seatsPerRow; }
    public void setSeatsPerRow(int seatsPerRow) { this.seatsPerRow = seatsPerRow; }
}
