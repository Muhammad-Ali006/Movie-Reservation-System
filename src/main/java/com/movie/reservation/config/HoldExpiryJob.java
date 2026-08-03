package com.movie.reservation.config;

import com.movie.reservation.model.Reservation;
import com.movie.reservation.repository.ReservationRepository;
import com.movie.reservation.repository.SeatRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class HoldExpiryJob {

    private final ReservationRepository reservationRepository;
    private final SeatRepository seatRepository;

    public HoldExpiryJob(ReservationRepository reservationRepository,
                         SeatRepository seatRepository) {
        this.reservationRepository = reservationRepository;
        this.seatRepository = seatRepository;
    }

    @Scheduled(fixedRate = 30000)
    @Transactional
    public void expireExpiredHolds() {
        List<Reservation> expired = reservationRepository.findExpiredPending(LocalDateTime.now());
        for (Reservation reservation : expired) {
            List<Long> seatIds = reservationRepository.findActiveSeatIdsByReservationId(reservation.getId());
            seatRepository.makeSeatsAvailable(seatIds);
            reservationRepository.deactivateSeatsByReservationId(reservation.getId());
            reservationRepository.cancelReservation(reservation.getId(), LocalDateTime.now());
        }
    }
}
