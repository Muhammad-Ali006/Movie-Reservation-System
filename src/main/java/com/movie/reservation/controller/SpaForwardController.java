package com.movie.reservation.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    @GetMapping({
        "/login",
        "/signup",
        "/movies/**",
        "/booking/**",
        "/my-bookings/**",
        "/account/**",
        "/admin/**",
        "/tickets/**"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
