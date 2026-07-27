package com.movie.reservation.config;

import com.movie.reservation.model.Screen;
import com.movie.reservation.model.User;
import com.movie.reservation.repository.ScreenRepository;
import com.movie.reservation.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ScreenRepository screenRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, ScreenRepository screenRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.screenRepository = screenRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail("admin@movie.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole("ADMIN");
            userRepository.save(admin);
            System.out.println("Admin user created: admin / admin123");
        }

        seedScreens();
    }

    private void seedScreens() {
        String[][] screens = {
            {"Screen 1", "SMALL", "120", "15"},
            {"Screen 2", "SMALL", "120", "15"},
            {"Screen 3", "MEDIUM", "150", "15"},
            {"Screen 4", "MEDIUM", "150", "15"},
            {"Screen 5", "LARGE", "180", "15"},
            {"Screen 6", "LARGE", "180", "15"}
        };

        boolean anySeeded = false;
        for (String[] s : screens) {
            if (!screenRepository.existsByName(s[0])) {
                Screen screen = new Screen();
                screen.setName(s[0]);
                screen.setScreenType(s[1]);
                screen.setTotalSeats(Integer.parseInt(s[2]));
                screen.setSeatsPerRow(Integer.parseInt(s[3]));
                screenRepository.save(screen);
                anySeeded = true;
            }
        }
        if (anySeeded) {
            System.out.println("6 cinema screens seeded");
        }
    }
}
