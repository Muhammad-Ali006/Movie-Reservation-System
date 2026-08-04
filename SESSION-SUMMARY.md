# Session Summary — Mon Aug 3, 2026 (Week 3, Day 1 — bug-fix follow-up)

## What Was Completed

### Bug: "Failed to load seat layout" from My Bookings → Change Seats
- **Symptom** — Book a seat → My Bookings → click **Change Seats** → the page showed "Failed to load seat layout".
- **Root cause** — PostgreSQL folds **unquoted** SQL aliases to lowercase (`AS showtimeId` → column `showtimeid`; verified live with `SELECT 1 AS showtimeId`). Three raw `queryForList` queries used unquoted camelCase aliases, so the response maps had lowercase keys:
  - `GET /api/reservations/my` (`ReservationController`) → `showtimeid`, `movietitle`, `totalamount`, ... → `reservation.showtimeId` was `undefined` → `navigate('/booking/undefined/change')` → `GET /showtimes/undefined/seats` → 404 → the `.catch` at `SeatSelectionPage.jsx:35`.
  - `GET /api/showtimes/{id}/seats` (`ShowtimeController`) → `row.get("seatNumber")`/`row.get("reservationStatus")`/`row.get("reservationId")` returned null → null labels, every seat `AVAILABLE`, `heldByMe` always false.
  - `GET /api/admin/reservations` (`AdminReservationController`) → same lowercase-key issue.
  - Side effects of the same bug: My Bookings list showed blank titles / `$NaN` amounts / missing dates.
- **Fix** — quote the aliases in all 3 queries (`AS "showtimeId"`, `"seatNumber"`, `"totalAmount"`, ...) so PostgreSQL preserves camelCase, and pass `changeMode: true` (plus `reservationId`) in `UserReservationsPage.handleChangeSeats` so SeatSelectionPage enters change mode. The confirmation-page "Change Seats" button was already correct.
- **Files changed** — `ReservationController.java`, `ShowtimeController.java`, `AdminReservationController.java` (quoted aliases); `frontend/src/pages/UserReservationsPage.jsx` (navigate state).
- **Verified live** — seats endpoint returns `id,rowLabel,seatNumber,status,heldByMe`; book→PENDING hold→`?heldReservationId=` shows `heldByMe:true` (change-mode pre-selection data); `PUT /api/reservations/{id}/seats` updates seats + recomputes total; confirm works; `GET /api/reservations/my` returns camelCase keys and Change Seats targets `/booking/12/change`. `mvnw compile` + `npm run build` pass. Test data cleaned up; backend stopped.
- Recorded in **BUGS.md** as #16 (Fixed, W3 Tue) and SCHEDULE.md de-staled.

## Current State
- W3 Mon work (2-min PENDING hold + mock confirm, HoldExpiryJob, overbooking `FOR UPDATE` + `uq_active_reservation_seat`, My Bookings + `/api/reservations/my`, change seats, admin booking listing, Option B confirmation-page "Change Seats" + README alignment) is complete and verified; the W3 Tue bug-fix above restores the change-seats flow end-to-end.
- Docs updated: SCHEDULE.md (stale "change seats" references cleared), BUGS.md (#16 added), README.md (Known Issues note), frontend/README.md (`src/api.js` → `src/utils/api.js`), SESSION-SUMMARY.md (this block).

### Uncommitted Changes (user commits as usual)
```
src/main/java/.../controller/ReservationController.java   — quoted aliases in GET /my
src/main/java/.../controller/ShowtimeController.java      — quoted aliases in GET /seats
src/main/java/.../controller/AdminReservationController.java — quoted aliases
frontend/src/pages/UserReservationsPage.jsx               — navigate state: + changeMode:true
README.md, frontend/src/pages/AdminReservationPage.jsx, BookingConfirmationPage.jsx, SeatSelectionPage.jsx — W3 Mon (intentionally uncommitted)
```
SCHEDULE.md, BUGS.md, WEEK1-REPORT.md are gitignored (not committed).

## Tomorrow's Plan — Tue Aug 4 (Week 3, Day 2)
- Backend: Revenue report `GET /api/admin/reports/revenue` (total revenue grouped by movie/screen/date)
- Backend: Capacity report `GET /api/admin/reports/capacity` (seat occupancy % per showtime/screen)
- Backend: `PUT /api/admin/showtimes/{id}` (update date/time/price; block if CONFIRMED/PENDING bookings exist)
- Frontend: AdminShowtimePage management UI (list existing showtimes, delete button — DELETE API exists but no UI — edit pre-fill → update mode)

## Critical Notes
- Start backend: `./mvnw.cmd spring-boot:run`
- Start frontend: `cd frontend && npm run dev`
- Admin login: username `admin`, password `admin123`
- DB: `movie_db`, localhost:5432, user `postgres`, password `root`
- **Postgres quirk:** always quote camelCase aliases in SQL (`AS "showtimeId"`) — unquoted identifiers fold to lowercase and break `queryForList` map keys.

---

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
