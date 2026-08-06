# Session Summary — Thu Aug 6, 2026 (Week 3, Day 4 — digital ticket backend + 404 page)

## What Was Completed

### Digital ticket backend
- `schema.sql` — new `tickets` table (`id`, `reservation_id` FK → `reservations(id)` ON DELETE CASCADE, `token VARCHAR(64) UNIQUE`, `status VARCHAR(20) DEFAULT 'ACTIVE'`, `created_at`); applied live via psql.
- `model/Ticket.java` + `repository/TicketRepository.java` (`create`, `findByToken`, `findByReservationId`, `markUsed`).
- `controller/TicketController.java` — `GET /api/tickets/{ticketToken}` (public): unknown token / cancelled reservation / passed showtime → `INVALID` (no user PII); first scan → `VALID` + marks ticket `USED` (response includes movieTitle, screenName, showDate, showTime, seats, totalAmount); rescan → `ALREADY USED`.
- `ReservationController` — confirm now generates a token (24 random bytes, Base64 URL, no padding) and returns `ticketToken` in the confirm response; the idempotent CONFIRMED path re-returns the existing token.
- `SecurityConfig` — `/api/tickets/**` added to the public GET matchers.

### Error pages
- `frontend/src/pages/NotFoundPage.jsx` — Cinema Noir themed 404 page with links back home / browse movies.
- `frontend/src/App.jsx` — `<Route path="*" element={<NotFoundPage />} />` catch-all at the end of Routes.

## Verification
- `./mvnw.cmd compile -q` ✅ · `npm run build` ✅
- Live smoke test ✅ — created movie + showtime, booked 2 seats, confirm returned the `ticketToken`, `GET /api/tickets/{token}` → VALID (movie/screen/seats/amount), rescan → ALREADY USED, unknown token → INVALID. Test data cleaned — **DB reset to 0 movies / 0 showtimes / 0 seats / 0 reservations** (2 users remain); backend stopped.

## Current State
- W3 Thu work (digital ticket backend + 404 page) complete and verified; committed (`991ac07` … `4ef5a7f`).
- Docs updated: README.md (feature statuses, build order, Project Status), SCHEDULE.md (13/15), handoff.

### Uncommitted Changes (user commits per-file as usual; only README.md is pushed)
- `SESSION-SUMMARY.md` — this Thu section (docs only)

## Tomorrow's Plan — Fri Aug 7 (Week 3, Day 5)

### A. Printable ticket page with QR (backend `GET /api/tickets/{token}` is done)
1. `cd frontend` → `npm install qrcode` (NOT installed yet — confirmed in `package.json`)
2. Create `frontend/src/pages/TicketPage.jsx` + public route `/tickets/:token` in `App.jsx`
   - Fetch `GET /api/tickets/{token}`
   - **VALID** → render movie, screen, date/time, seats, amount, ticket code + client-side QR (`qrcode`) + **Print** button (`window.print()`)
   - **ALREADY USED / INVALID** → friendly message, no crash
3. "View Ticket" entry points:
   - `BookingConfirmationPage` (after confirm — uses `ticketToken` from confirm response)
   - `UserReservationsPage` for CONFIRMED — ⚠️ DECIDE: add `ticketToken` to `/reservations/my` response, OR only show View Ticket on the confirmation page
4. Verify: `npm run build` ✅ + `./mvnw.cmd compile -q` ✅

### B. End-to-end test pass (SCHEDULE item 10)
- User: book → hold (2:00 countdown) → mock pay → view ticket → scan VALID → rescan ALREADY USED → cancel; change seats on PENDING + CONFIRMED
- Expiry: backdate `pending_until` → `HoldExpiryJob` releases seats
- Admin: showtime create/edit/delete (blocked while booked), bookings list + bulk cancel, seat grid (click-to-cancel), movie CRUD + delete guard, genres
- Errors: malformed JSON → 400, bad URL → 404 page, double-cancel, confirm after expiry, seat taken
- Clean all test data → DB back to 0 movies / 0 showtimes / 0 seats / 0 reservations (2 users remain)

### C. Doc wrap-up
- Add W3 Fri section to SESSION-SUMMARY.md; update handoff (Latest Session Fri, progress 14-15/15); commit per-file as usual (push README only)

### Deferred (get back to later)
- Account page (`GET /api/auth/me`), admin dashboard/reports (Week 4)

---

# Session Summary — Tue Aug 4, 2026 (Week 3, Day 2 — showtime management + admin seat grid)

## What Was Completed

### Bug: Malformed JSON body → 500 (bug #15)
- **Symptom** — sending a malformed request body (e.g. a missing comma, `[1351,]`) returned a 500 instead of a structured 400.
- **Root cause** — `GlobalExceptionHandler` had no handler for Spring's `HttpMessageNotReadableException`.
- **Fix** — added `@ExceptionHandler(HttpMessageNotReadableException.class)` → 400 `{ "message": "Invalid request body" }`.
- **Verified live** — a broken body now returns 400 with the message.

### Showtime management (backend + frontend)
- `GET /api/admin/showtimes?movieId=&screenId=` — list showtimes joined with movie/screen + active-booking counts (enriched list driving the management page filters).
- `PUT /api/admin/showtimes/{id}` — update date/time/price **only** (movie/screen locked; changing them would invalidate seats/bookings). **Blocks** while any active (PENDING + CONFIRMED) booking exists: `"Cannot update showtime: N active booking(s) exist. Cancel them first."`; 404 if the showtime is missing.
- `AdminShowtimePage.jsx` rewritten into a management page: list existing showtimes + movie filter, Edit (pre-fills form → update mode, movie/screen locked), Delete, and an active-bookings badge that disables edit/delete while locked. List refreshes after create/update/delete.
- Repos: `ShowtimeRepository.findAll()`, `updateDateTimePrice(id, date, time, price)`; `ReservationRepository.countActiveByShowtimeId(id)`.

### Admin booking seat grid
- `GET /api/admin/showtimes/{id}/seats` — admin seat grid: `status` AVAILABLE / HELD / BOOKED + `reservationId`, `username`, `totalAmount` per seat (aliases quoted for Postgres).
- `AdminReservationPage.jsx` rewritten: Screen → Show (movie) → Time dropdowns → full cinema seat grid (same layout as the user picker). Click a booked/held seat → confirm (owner + amount) → cancel that reservation. "Cancel All (showtime)" reuses the existing bulk-cancel API. The card list is kept under "All Screens".

### AdminDashboard
- Showtimes card text → "Create, edit, or remove showtimes" (management, not just creation).

## Verification
- `./mvnw.cmd compile -q` ✅ · `npm run build` ✅
- Live smoke test ✅ — created a showtime, listed with movie filter, grid showed AVAILABLE → HELD-with-username after a booking, PUT + DELETE blocked while a booking was active (exact message), cancel released the seat, delete then succeeded, malformed JSON → 400.
- Test data cleaned afterwards — **DB reset to 0 movies / 0 showtimes / 0 seats / 0 reservations** (2 users remain); backend stopped.

## Current State
- W3 Tue work (showtime management + admin seat grid + bug #15) complete and verified; W3 Mon work + the W3 Tue alias fix (#16) are committed (`fdc29c0` … `2e3d580`).
- Docs updated: README.md (build order, Known Issues, Project Status), BUGS.md (last-reviewed date; #15 + showtime statuses), SCHEDULE.md (11/15, Tue items ✅).

### Uncommitted Changes (user commits per-file as usual; only README.md is pushed)
```
src/main/java/.../exception/GlobalExceptionHandler.java     — 400 for malformed JSON (#15)
src/main/java/.../repository/ShowtimeRepository.java        — findAll + updateDateTimePrice
src/main/java/.../repository/ReservationRepository.java     — countActiveByShowtimeId
src/main/java/.../controller/AdminShowtimeController.java   — GET list + PUT update + GET seats
frontend/src/pages/AdminShowtimePage.jsx                    — management UI (list/edit/delete/filter)
frontend/src/pages/AdminReservationPage.jsx                 — Screen → Show → Time → seat grid
frontend/src/pages/AdminDashboard.jsx                       — showtimes card text
README.md                                                   — docs (the only pushed doc)
```
SCHEDULE.md, BUGS.md, SESSION-SUMMARY.md, WEEK1-REPORT.md, `.opencode/` are gitignored (local-only).

## Tomorrow's Plan — Wed Aug 5 (Week 3, Day 3)
- Frontend: AdminDashboard charts/stats (upgrade navigation cards → stats dashboard)
- Backend: Payment integration — `PaymentProvider` interface + Mock implementation, `payments` table, provider pay/confirm endpoints

## Critical Notes
- Start backend: `./mvnw.cmd spring-boot:run`
- Start frontend: `cd frontend && npm run dev`
- Admin login: username `admin`, password `admin123`
- DB: `movie_db`, localhost:5432, user `postgres`, password `root`
- **Postgres quirk:** always quote camelCase aliases in SQL (`AS "showtimeId"`) — unquoted identifiers fold to lowercase and break `queryForList` map keys.
- Showtime PUT/DELETE block while PENDING + CONFIRMED bookings exist (cancel first).

---

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
