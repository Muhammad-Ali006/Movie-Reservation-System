# Session Summary — Tue Aug 12, 2026 (Week 4, Day 2 — frontend flows + mobile-friendly fixes)

## What Was Completed

### Frontend flows tested + mobile-friendly fixes
- **Responsive seat grid** — the user seat picker previously fixed seat buttons at 32px ≈ 570px, so a 15-seat row overflowed small screens. Now `w-6` on phones scaling to `w-8` on desktop with an `overflow-x-auto` fallback (the admin grid already wrapped).
- **Lint cleanup** — removed 3 unused-variable warnings (`AdminMovieForm`, `AdminGenrePage`, `AdminShowtimePage`).
- **PKR currency everywhere** — changed every `$` display to **PKR** (movie detail showtime cards, booking confirmation totals, ticket amount + dollar icon → banknote, My Bookings, admin reservation amounts, admin showtime label + `/seat`).
- Reviewed every page for mobile responsiveness.

## Verification
- `npm run build` ✅ · `npm run lint` ✅ (1 intentional warning) · Vite proxy `/api` + `/uploads` passthrough ✅

## Current State
- W4 Tue work complete and verified. Code committed (`bfab7ad` … `69b18a3` — the PKR series + mobile-responsive seat grid commits).
- README.md updated (uncommitted, the only tracked doc). SCHEDULE.md / BUGS.md / SESSION-SUMMARY.md / handoff are local-only.

### Uncommitted Changes
- `README.md` — W4 status + PKR docs (commit + push per usual habit)

## Tomorrow's Plan — Wed Aug 13 (Week 4, Day 3)
- Per SCHEDULE: final polish + error scenarios; carried-over if time: revenue/capacity reports (`GET /api/admin/reports/revenue` / `/capacity`), AdminDashboard charts, account page (`GET /api/auth/me`).

## Critical Notes
- Start backend: `./mvnw.cmd spring-boot:run`
- Start frontend: `cd frontend && npm run dev`
- Admin login: username `admin`, password `admin123`
- DB: `movie_db`, localhost:5432, user `postgres`, password `root`
- **Postgres quirk:** always quote camelCase aliases in SQL (`AS "showtimeId"`).
- **Ticket QR rule:** `GET /api/tickets/{token}` CONSUMES the ticket (marks USED) — use `/details` for display-only.

---

# Session Summary — Mon Aug 11, 2026 (Week 4, Day 1 — test all endpoints + fix edge cases)

## What Was Completed

### Backend hardening (W4 Mon edge-case pass)
- **Showtime validation** — `POST /api/admin/showtimes` and `PUT /api/admin/showtimes/{id}` now reject missing `movieId`/`screenId`/`showDate`/`showTime`/`pricePerSeat` (400), negative price (400), past show date (400), and duplicate movie+screen+date+time combos (400).
- **Signup bean validation** — `@Valid` on `SignupRequest` (username 3–50 chars, valid email, password ≥ 8 chars) with a `MethodArgumentNotValidException` handler returning 400 + the field message.
- **Movie pagination bounds** — `page ≥ 0`, `size 1–100` validated → 400.
- **JSON 401/403 responses** — `authenticationEntryPoint`/`accessDeniedHandler` in `SecurityConfig` return `{"message":"Unauthorized"}` / `{"message":"Access denied"}` instead of Spring's HTML error page.

## Verification
- `./mvnw.cmd compile -q` ✅
- **Full live test pass: 48/48 PASS** — 39-regression suite + 9 new edge-case checks (missing/negative/past/duplicate showtime fields, update guards, pagination bounds, 401/403 JSON, non-admin 403).

## Current State
- W4 Mon work complete and verified. Code committed (`c7876d7` … `fb8d77b` — showtime validation + duplicate-showtime check + signup validation + pagination bounds + JSON 401/403).

### Uncommitted Changes
- Docs only (README.md + local-only schedule/bugs/summary/handoff)

## Tomorrow's Plan — Tue Aug 12 (Week 4, Day 2)
- Per SCHEDULE: test all frontend flows + mobile-friendly fixes.

## Critical Notes
- Start backend: `./mvnw.cmd spring-boot:run`
- Start frontend: `cd frontend && npm run dev`
- Admin login: username `admin`, password `admin123`
- DB: `movie_db`, localhost:5432, user `postgres`, password `root`
- **Postgres quirk:** always quote camelCase aliases in SQL (`AS "showtimeId"`).

---

# Session Summary — Fri Aug 7, 2026 (Week 3, Day 5 — printable ticket QR page + E2E test pass)

## What Was Completed

### Printable ticket page with QR
- **Design decision** — the existing `GET /api/tickets/{token}` scan endpoint marks the ticket **USED** on its first call, so the buyer's view/print page cannot use it (opening your own ticket would consume it). Added a **non-consuming** `GET /api/tickets/{token}/details` that returns the same payload (`movieTitle`, `screenName`, `showDate`, `showTime`, `seats`, `totalAmount`, `ticketToken`) **without** marking used; INVALID for unknown/cancelled/passed. The scan endpoint is unchanged (first scan → VALID + marks USED, rescan → ALREADY USED).
- `TicketController.java` — shared validation refactored into `buildTicketResponse(ticket, markAsUsed)`; `/details` calls it with `false`, the scan endpoint with `true`.
- `ReservationController` `GET /api/reservations/my` — added `ticketToken` via a correlated subquery (`(SELECT tk.token FROM tickets tk WHERE tk.reservation_id = r.id ORDER BY tk.id DESC LIMIT 1) AS "ticketToken"`), so CONFIRMED bookings link to their ticket.
- `frontend/src/pages/TicketPage.jsx` (new) — public route `/tickets/:token`: Cinema Noir ticket card (movie, screen, date/time, seats, amount, ticket code) + client-side QR (`qrcode` lib) + **Print** button (`window.print()` with a scoped print stylesheet that hides nav/buttons and inverts to white). VALID → ticket; **ALREADY USED / INVALID** → friendly message with Browse Movies / My Bookings links.
- `App.jsx` — `<Route path="/tickets/:token" element={<TicketPage />} />` (public, before the catch-all).
- **View Ticket entry points** — `BookingConfirmationPage` confirmed state (uses `confirmed.ticketToken` from the confirm response) and `UserReservationsPage` (CONFIRMED rows that have `ticketToken`).

### Bug: unknown `/api/**` URL → 500 (bug #17)
- **Symptom** — a GET to an unmapped API path (e.g. `/api/reservations/999999`) returned **500** instead of 404.
- **Root cause** — Spring's `NoResourceFoundException` (thrown when no controller matches) had no handler in `GlobalExceptionHandler`.
- **Fix** — added `@ExceptionHandler(NoResourceFoundException.class)` → 404 `{ "message": "Resource not found" }`.

### End-to-end test pass (SCHEDULE item 10) — 39/39
- **User**: book → PENDING hold (2:00) → mock pay (confirm) → `ticketToken` returned → `details` VALID (non-consuming) → scan VALID → rescan ALREADY USED → `details` now ALREADY USED → `/my` includes `ticketToken` → change seats on CONFIRMED (old seats released, new held, total recomputed) → change seats on PENDING → confirm → seat-taken → 400.
- **Expiry**: backdated `pending_until` → `HoldExpiryJob` auto-cancelled + released the seat; confirm-after-expiry → 400.
- **Admin**: showtime update + delete blocked while CONFIRMED bookings exist (400) → admin seat grid (BOOKED + username + amount) → bulk cancel → update/delete succeed; movie delete blocked with CONFIRMED booking (400) → delete after cancel (200); genre create/list/delete.
- **Errors**: malformed JSON → 400, double-cancel → 400, unknown ticket (scan + details) → INVALID, unmapped API path → 404.
- Test data cleaned — **DB reset to 0 movies / 0 showtimes / 0 seats / 0 reservations / 0 tickets** (2 users, 6 screens, 8 genres remain); backend stopped.

## Verification
- `./mvnw.cmd compile -q` ✅ · `npm run build` ✅ · `npm run lint` ✅ (no new warnings)

## Current State
- W3 Fri work (ticket QR page + details endpoint + bug #17 + E2E pass) complete and verified. W3 Thu work was committed earlier (`4b03d23` … `4ef5a7f`).

### Uncommitted Changes (user commits per-file as usual; only README.md is pushed)
- `src/main/java/.../controller/TicketController.java` — `/details` endpoint + `buildTicketResponse` refactor
- `src/main/java/.../controller/ReservationController.java` — `ticketToken` in `/my`
- `src/main/java/.../exception/GlobalExceptionHandler.java` — 404 for unmapped API paths (#17)
- `frontend/src/pages/TicketPage.jsx` — NEW printable QR ticket page
- `frontend/src/App.jsx` — `/tickets/:token` route
- `frontend/src/pages/BookingConfirmationPage.jsx` — View Ticket button
- `frontend/src/pages/UserReservationsPage.jsx` — View Ticket button on CONFIRMED
- `frontend/package.json` + `package-lock.json` — `qrcode` dependency
- `README.md` — docs (the only pushed doc)

## Tomorrow's Plan — Mon Aug 10 (Week 4, Day 1)
- Week 4 Mon per SCHEDULE: test all endpoints, fix edge cases. Carried-over if time: account page (`GET /api/auth/me`), revenue/capacity reports, AdminDashboard charts, payment integration (PaymentProvider + Mock).

## Critical Notes
- Start backend: `./mvnw.cmd spring-boot:run`
- Start frontend: `cd frontend && npm run dev`
- Admin login: username `admin`, password `admin123`
- DB: `movie_db`, localhost:5432, user `postgres`, password `root`
- **`GET /api/tickets/{token}` consumes the ticket (marks USED). Use `GET /api/tickets/{token}/details` for display-only.**
- **Postgres quirk:** always quote camelCase aliases in SQL (`AS "showtimeId"`).

---

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
