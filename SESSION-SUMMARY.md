# Session Summary — Wed Jul 29, 2026 (Week 2, Day 3)

## What Was Completed

### Backend
- **Seat endpoint** (`ShowtimeController.java`) — Added `GET /api/showtimes/{showtimeId}/seats`. Returns all seats for a showtime with `id`, `seatNumber`, `rowLabel`, and `status` ("AVAILABLE" / "BOOKED"). Uses existing `SeatRepository.findByShowtimeId()`. Validates showtime existence first (404 if not found).

### Frontend
- **SeatSelectionPage.jsx** — New page at `/booking/:showtimeId`. Fetches seats from the backend, groups by row (A, B, C...), renders a visual grid with a "SCREEN" indicator at top. Color-coded seats: green (`AVAILABLE`), gray (`BOOKED`, disabled), red (`selected`). Click to toggle selection. Legend at the bottom. "Continue" button (disabled until ≥1 seat selected) navigates to `/booking/:showtimeId/confirm` with `selectedSeats` via route state. All states handled: loading, error, empty.
- **MovieDetailPage.jsx** — Each showtime card now links to `/booking/${showtime.id}` (the SeatSelectionPage) with a "Select Seats" call-to-action.
- **App.jsx** — Added route: `<Route path="/booking/:showtimeId" element={<SeatSelectionPage />} />`.

### Code Quality
- Backend compiled successfully
- Frontend built without errors (Vite build, 1.78s)

## Current State

### Database
- 1 movie: "The Dark Night" (id=19, slug="the-dark-night"), genres: Action(1), Thriller(2), Crime(3)
- **1 showtime exists** (id=1, Jul 30, Screen 1, 120 seats, $12.50) — created during testing
- 6 screens seeded (2 small/120 seats, 2 medium/150 seats, 2 large/180 seats)

### Uncommitted Changes
```
src/main/java/.../controller/ShowtimeController.java   — Added GET /api/showtimes/{id}/seats
frontend/src/App.jsx                                   — Added /booking/:showtimeId route
frontend/src/pages/SeatSelectionPage.jsx               — NEW: visual seat grid page
frontend/src/pages/MovieDetailPage.jsx                 — Showtime cards link to seat selection
```

### Git History (latest 3 commits)
```
16c2ddd Add showtime listing with date picker and screen info on movie detail page
6578d61 Add Now Showing / Coming Soon / All Movies tabs with server-side filter, sort, and pagination
23cd871 Add file cleanup on delete/replace, hide password from JSON, improve error handling
```

## Tomorrow's Plan — Thu Jul 30 (Week 2, Day 4)

### Backend
- **ReservationController** — `POST /api/reservations` with `@Transactional`:
  - Accept `{ showtimeId, seatIds }`
  - Validate all seats belong to the showtime
  - Validate all seats are available
  - Calculate total amount from showtime price
  - Create reservation record (status=CONFIRMED)
  - Insert into `reservation_seats` junction table
  - Mark seats as `is_available = false`

### Frontend
- **BookingConfirmationPage** — new page at `/booking/:showtimeId/confirm`
  - Display selected seats, showtime info, total price
  - "Confirm Booking" button → calls POST /api/reservations
  - Success state with confirmation details
  - Error handling

## Critical Notes
- Start backend: `./mvnw.cmd spring-boot:run`
- Start frontend: `cd frontend && npm run dev`
- Admin login: username `admin`, password `admin123`
- DB: `movie_db`, localhost:5432, user `postgres`, password `root`
- Vite proxies `/api` and `/uploads` to backend port 8080
- `frontend/public/` is fully ignored by `.gitignore` (user will finalize images later)
- `.gitignore` has `uploads` which excludes poster/actor uploads from git (correct — user-generated content)
