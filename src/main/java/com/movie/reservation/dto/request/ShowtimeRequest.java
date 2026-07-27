package com.movie.reservation.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public class  ShowtimeRequest {
    private Long movieId;
    private Long screenId;
    private LocalDate showDate;
    private LocalTime showTime;
    private BigDecimal pricePerSeat;

    public ShowtimeRequest() {}

    public Long getMovieId() { return movieId; }
    public void setMovieId(Long movieId) { this.movieId = movieId; }

    public Long getScreenId() { return screenId; }
    public void setScreenId(Long screenId) { this.screenId = screenId; }

    public LocalDate getShowDate() { return showDate; }
    public void setShowDate(LocalDate showDate) { this.showDate = showDate; }

    public LocalTime getShowTime() { return showTime; }
    public void setShowTime(LocalTime showTime) { this.showTime = showTime; }

    public BigDecimal getPricePerSeat() { return pricePerSeat; }
    public void setPricePerSeat(BigDecimal pricePerSeat) { this.pricePerSeat = pricePerSeat; }
}
