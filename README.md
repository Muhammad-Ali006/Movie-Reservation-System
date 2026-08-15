# Movie Reservation System

A fullstack movie reservation platform built with Spring Boot 4.0.7, React 19, JDBC, and PostgreSQL.

---

## Tech Stack

### Backend
| Technology        | Version     |
|-------------------|-------------|
| Spring Boot       | 4.0.7       |
| Java              | 17          |
| JDBC (JdbcTemplate)| —           |
| PostgreSQL        | —           |
| JJWT              | 0.12.6      |
| Spring Security   | —           |
| Spring Validation | —           |
| Maven             | —           |

### Frontend
| Technology        | Version     |
|-------------------|-------------|
| React             | 19.2.7      |
| Vite              | 8.1.1       |
| Tailwind CSS      | 4.3.3       |
| React Router      | 7.18.1      |
| Axios             | 1.18.1      |
| Lenis             | 1.3.25      |
| Lucide React      | 1.27.0      |
| Recharts          | 3.10.1      |
| qrcode            | 1.5.4       |

---

## Prerequisites

- Java 17+
- Maven 3.6+
- Node.js 18+ & npm
- PostgreSQL
- IntelliJ IDEA (recommended)

---

## Backend Setup

1. Open the project root in IntelliJ
2. Maven will auto-import dependencies
3. Create the database:
   ```sql
   CREATE DATABASE movie_db;
   ```
4. Copy `src/main/resources/application.properties.example` to `application.properties` and update credentials
5. Run the application:
   ```
   MovieReservationApplication.java → Run
   ```

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## Ports

| Service   | URL                          |
|-----------|------------------------------|
| Backend   | http://localhost:8080         |
| Frontend  | http://localhost:5173         |
| Database  | localhost:5432               |

---

## Deployment (Render + Neon)

The app is production-ready via environment variables — local defaults keep `npm run dev` / `mvnw spring-boot:run` unchanged, and the server overrides them at runtime.

### Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/movie_db` | JDBC connection string |
| `SPRING_DATASOURCE_USERNAME` | `postgres` | DB user |
| `SPRING_DATASOURCE_PASSWORD` | `root` | DB password |
| `JWT_SECRET` | dev key | HS256 signing key (≥ 32 chars; set a long random value in production) |
| `APP_UPLOAD_DIR` | `file:uploads/` | Filesystem path for poster/actor uploads (relative to the working dir) |

> `spring.sql.init.mode=always` + `schema.sql` (all `IF NOT EXISTS`) auto-creates the schema on first boot; `DataSeeder` idempotently seeds the admin account (`admin / admin123`) and 6 screens.

### Architecture

A **single service** hosts both the backend and the built frontend:

- `npm run build` produces `frontend/dist/`, which is copied into `src/main/resources/static/` before packaging (done by the Render build command below)
- Spring Boot serves the React build, and `SpaForwardController` returns `index.html` for client-side routes (`/movies/**`, `/booking/**`, `/admin/**`, ...) while `/api/**` and `/uploads/**` are untouched
- Same-origin means **no CORS config** is needed in production

### Steps

1. **Database — Neon** (free, persistent, never auto-deleted): create a project at neon.tech, copy its connection string → `SPRING_DATASOURCE_URL` (keep `?sslmode=require`)
2. **App — Render**: `render.com` → New → Web Service → this repo
   - **Build command:** `npm ci --prefix frontend && npm run build --prefix frontend && cp -r frontend/dist/. src/main/resources/static/ && ./mvnw package -DskipTests`
   - **Start command:** `java -jar target/movie-reservation.jar`
   - **Java version:** 17
   - **Env vars:** the four above (from the Neon project; `JWT_SECRET` = `openssl rand -base64 48`)
3. **Verify:** `curl https://<app>.onrender.com/api/health` → `{"status":"UP"}`
4. Smoke test the public URL: register → browse → book → mock pay → ticket QR; upload a poster via the admin movie form.

> **Note:** uploads live on Render's ephemeral disk and are lost on redeploy (users, bookings, tickets persist in Neon). For demo purposes this is fine; long-term persistence would need an object store.

## What's Implemented

### Authentication & Security
- **JWT authentication** — tokens generated on login, validated on every request via `JwtAuthFilter` (OncePerRequestFilter)
- **Stateless sessions** — no HTTP session, every request authenticated via Bearer token
- **CORS** — configured to allow `http://localhost:5173` (Vite dev server)
- **Role-based access control** — `ROLE_USER` for regular users, `ROLE_ADMIN` for admin endpoints (`/api/admin/**`)
- **JSON 401/403 responses** — custom `authenticationEntryPoint`/`accessDeniedHandler` in `SecurityConfig` return `{"message":"Unauthorized"}` / `{"message":"Access denied"}` instead of Spring's HTML error page (W4 Mon)
- **Password encryption** — BCrypt via Spring Security `PasswordEncoder`
- **Signup validation** — `@Valid` on `SignupRequest` (username 3–50 chars, valid email, password ≥ 8 chars) with a `MethodArgumentNotValidException` handler returning 400 + the field message (W4 Mon)
- **Data seeder** — auto-creates admin account on startup (`admin / admin123`), seeds 6 cinema screens (2 small, 2 medium, 2 large)
- **Global exception handler** — returns structured JSON errors for 404, 401, 400, and 500

### Movies
- **Multi-genre support** — many-to-many `movie_genres` junction table, movies can belong to multiple genres
- **Extended movie fields** — `release_date`, `original_language`, `director`
- **URL slugs** — movies accessed via `/api/movies/{slug}` (e.g. `/api/movies/the-dark-knight`), auto-generated from title, duplicates handled with `-2`, `-3` suffixes. Random IDs like `/movies/1` return 404, preventing enumeration attacks
- **Poster upload** — multipart file upload to `uploads/posters/`, served as static resources via `WebConfig`

### Cast & Actors
- **Cast management** — add actors with role names to movie cast, managed through the admin movie form (not a separate page)
- **Actor auto-creation** — typing a new actor name in the cast section auto-creates the actor record
- **Actor photos** — photo upload for actors when adding cast, displayed as round avatars on movie detail page. If an existing actor has no photo, uploading one through cast updates their actor record for future use
- **No separate actor module** — the standalone actor module was intentionally removed (adding actors without a movie made no sense). Actors are only managed inline within the movie cast flow: when an admin adds/edits a movie, they add its cast members (with role and optional photo) as part of movie management. There are no `/api/actors` endpoints

### Cinema Screens
- **6 fixed screens** — seeded on startup: 2 small (120 seats), 2 medium (150 seats), 2 large (180 seats)
- **Standard layout** — all screens use 15 seats per row; rows labeled A, B, C... (8 rows for small, 10 for medium, 12 for large)
- **Public endpoint** — `GET /api/screens` returns all screens with name, type, and seat count

### Showtimes & Seats
- **Admin showtime creation** — `POST /api/admin/showtimes` accepts movieId, screenId, showDate, showTime, pricePerSeat; validates required fields, non-negative price, future show date, and rejects duplicate movie+screen+date+time combos (W4 Mon)
- **Showtime update** — `PUT /api/admin/showtimes/{id}` rejects past dates and negative prices (W4 Mon). **Movie/screen changeable (W4 Thu):** the request accepts optional `movieId`/`screenId`; when either differs from the current showtime (and no active bookings exist) the controller validates the movie/screen, duplicate-checks the new movie+screen+date+time combo (excluding the showtime itself), deletes the old `seats` + `reservation_seats` links, **regenerates the seat layout from the new screen's capacity**, and updates the row — all in one `@Transactional`. Edits that keep the movie/screen use the existing `updateDateTimePrice` path. Updating is blocked while any PENDING/CONFIRMED booking exists
- **Auto seat generation** — when a showtime is created, seats are automatically generated based on the screen's capacity (e.g. Screen 5 → 180 seats → 12 rows × 15)
- **Public showtime listing** — `GET /api/showtimes?movieId={id}` returns all showtimes for a movie with screen name, available seat count, and price
- **Seat layout endpoint** — `GET /api/showtimes/{showtimeId}/seats` returns all seats with `id`, `seatNumber`, `rowLabel`, `status` ("AVAILABLE" / "HELD" / "BOOKED"), and `heldByMe`; optional `?heldReservationId=` so a user's own held seats show as AVAILABLE (change-seats mode)
- **Showtime details endpoint** — `GET /api/showtimes/{id}` returns enriched showtime data: `movieTitle`, `movieSlug`, `showDate`, `showTime`, `screenName`, `screenType`, `totalSeats`, `availableSeats`, `pricePerSeat`

### Backend Architecture
- **Layered pattern** — `controller → service → repository (JdbcTemplate)` with manual `RowMapper`
- **Movie filtering/sorting/pagination** — `MovieRepository` supports filtered queries by genre and availability (has showtimes or not), with server-side sorting and LIMIT/OFFSET pagination. Returns `{ content, totalPages, totalElements, currentPage, size }`
- **PostgreSQL 18 compatibility** — JDBC prepared statements with BIGINT columns reject implicit VARCHAR-to-BIGINT conversion. All genre ID queries use `Long` instead of `String` to avoid `operator does not exist: bigint = character varying`
- **File storage** — `FileStorageService` handles safe file deletion for poster/photo replacements and movie deletions (skips nulls, external URLs, and defaults; logs at INFO level)
- **Admin reports** — `GET /api/admin/reports/revenue` (total revenue + bookings, breakdowns grouped by movie/screen/date for `CONFIRMED` reservations) and `GET /api/admin/reports/capacity` (occupancy % per showtime/screen = active `reservation_seats` ÷ `total_seats`). New `AdminReportController` (W4 Wed)
- **Global exception handler** — returns structured JSON errors:
  - `404` — `ResourceNotFoundException`
  - `401` — `UnauthorizedException`
  - `400` — `IllegalArgumentException`
  - `500` — generic fallback
- **Static file serving** — `WebConfig` maps `/uploads/**` to the filesystem `uploads/` directory

### UI & Design
- **Cinema Noir theme** — dark color palette (`#0A0A0A` background, `#141414` surface, `#E50914` primary red, `#FFC107` gold accent) defined as CSS custom properties in `index.css` for easy palette swaps
- **Netflix-style hero banner** — full-viewport home page with a **background video** (`public/back_vid_black_white.mp4`, `poster` fallback to `public/cinema-background.jpeg`), multi-layer gradient overlay (left-to-right + bottom-to-top) for text readability, the **CINEMAX** brand, a **typewriter tagline** ("Browse Shows · Pick Your Seat · Skip the Line"), and CTA buttons (Browse Shows / Sign Up, or Browse Movies when logged in)
- **Home marquee rows** — `MovieMarquee.jsx` renders scrolling **Now Showing** and **Coming Soon** rows on the home page (animated CSS marquee when ≥5 movies, horizontally scrollable otherwise; cards link to slug URLs)
- **Slim footer** — `Footer.jsx` (`© {year} CINEMAX`, `h-16`, top border) pinned to the bottom of every page via a `min-h-screen flex flex-col` app shell in `App.jsx` (`<main className="flex-1">`)
- **Transparent navbar** — gradient overlay navbar that sits on top of the hero banner, with `position: absolute` so the hero extends behind it
- **Lenis smooth scroll** — initialized in `App.jsx` for buttery smooth scrolling across all pages
- **Lucide React icons** — used throughout the app for consistent, lightweight iconography (Film, LogIn, LogOut, UserPlus, Shield, ArrowLeft, Clock, Globe, etc.)
- **Dark-themed forms** — global CSS styles for dark input fields, selects, and textareas via CSS variables
- **Custom scrollbar** — styled for dark theme
- **Responsive design** — mobile-friendly layouts across all pages using Tailwind responsive utilities (`sm:`, `md:`, `lg:`)
- **PKR currency** — all price displays use **PKR** (movie detail showtime cards, booking totals, ticket amount, My Bookings, admin reservation amounts, admin showtime label + `/seat`); the ticket page uses a banknote icon instead of a dollar sign (W4 Tue)
- **Mobile seat grid** — the user seat picker scales seat buttons down on phones (`w-6` → `w-8` on desktop) with an `overflow-x-auto` fallback so a 15-seat row never overflows a small screen (W4 Tue)

### Frontend
- **Axios client** (`utils/api.js`) — centralized API client with `baseURL: /api`
- **Auto token injection** — request interceptor attaches `Authorization: Bearer <token>` from localStorage
- **Auto logout on 401** — response interceptor clears token and redirects to `/login`
- **Vite proxy** — proxies both `/api` and `/uploads` requests to the Spring Boot backend on port 8080
- **Login/Signup pages** — forms wired to backend endpoints, redirect to `/` if already authenticated
- **Navbar** — transparent gradient overlay navbar showing brand, "Movies" link, Login/Signup when logged out, greeting + Admin link + Logout when logged in
- **Protected routes** — `ProtectedRoute` component redirects unauthenticated users to `/login`
- **Admin routes** — `AdminRoute` component restricts access to users with `ADMIN` role
- **Admin dashboard** — management hub with links to genre and movie pages
- **AdminGenrePage** — list all genres, create/edit/delete with inline form
- **AdminMoviePage** — list all movies with multiple genres, edit/delete with confirmation
- **AdminMovieForm** — create/edit movie form with:
  - Title, description, duration, release date, original language, director
  - Multi-genre toggleable checkboxes (not a dropdown)
  - Styled poster file upload button with image preview
  - Cast section: in create mode shows info message ("Cast can be added after creating the movie"); in edit mode shows full cast management with add/remove, role names, and photo upload with styled file button
- **MovieListingPage** — public page with three tabs: "Now Showing" (movies with future showtimes), "Coming Soon" (no showtimes yet), "All Movies". Each tab supports server-side genre filter, sort (Newest, Title A-Z, Release Date, Duration), and pagination (6 per page). Movie cards show "NOW SHOWING" / "COMING SOON" badges and link to detail page using slug URLs
- **MovieDetailPage** — movie detail page with side-by-side layout: poster on left, title + genre badges + metadata grid (duration, release date, language, director) + description on right, followed by cast grid with round photo avatars and character names. Includes a showtime section with date picker tabs and time cards showing screen name, screen type, available seats, and price. Each showtime card links to the seat selection page
- **SeatSelectionPage** — interactive seat grid at `/booking/:showtimeId`. Seats grouped by row (A, B, C...), color-coded (green=AVAILABLE, gray=HELD/BOOKED, red=selected). Click to select/deselect, legend, "Continue" button navigates to `/booking/:showtimeId/confirm`. Also supports **change mode** at `/booking/:showtimeId/change` (from My Bookings): current seats pre-selected via `?heldReservationId=`, "Update Seats" calls `PUT /api/reservations/{id}/seats`
- **BookingConfirmationPage** — booking summary at `/booking/:showtimeId/confirm`. **Two-step hold flow:** "Confirm Booking" creates a PENDING hold (2-min countdown), then "Complete Booking" (mock payment) flips it to CONFIRMED via `POST /api/reservations/{id}/confirm`. "Cancel Hold" releases the seats. Expiry shows "Hold Expired" and links back to seat selection. Success state with reservation ID and full details, plus **"Change Seats"** (→ change mode) and **"Cancel Reservation"** buttons. Handles: missing route state guard, loading/error/confirming states
- **UserReservationsPage** — "My Bookings" at `/my-bookings` (ProtectedRoute). Lists the user's reservations (PENDING/CONFIRMED/CANCELLED) with movie, screen, date/time, seats, amount, and status badge. **"Change Seats"** (→ change mode) and **"Cancel Booking"** buttons per booking
- **Navbar** — now shows a "My Bookings" link (desktop + mobile) for logged-in users
- **AdminReservationPage** — admin booking management at `/admin/reservations`. Screen filter dropdown, 2-column card grid showing movie title, screen, date/time, user, seats, amount, and status badge (PENDING shows a yellow badge with a cancel button). Individual "Cancel Booking" buttons plus a "Cancel All" button that bulk-cancels every active (PENDING/CONFIRMED) booking for the selected screen. Confirmation dialogs, loading/error/empty states
- **Admin booking seat grid** — once a screen is selected, cascading **Show → Time** dropdowns (from `GET /api/admin/showtimes?screenId=`) drive a read-only seat grid (`GET /api/admin/showtimes/{id}/seats`) identical in look to the user's seat picker: green=available, yellow=held, red=booked. Clicking a booked/held seat cancels that whole reservation (with a confirm dialog showing the owner + amount); a "Cancel All (showtime)" button bulk-cancels every active booking for the showtime. The card list remains for the "All Screens" view
- **AdminShowtimePage** — full management page at `/admin/showtimes`: create form plus an "All Showtimes" list with movie filter, per-showtime Edit/Delete, and an active-bookings badge. Edit pre-fills the form in update mode and calls `PUT /api/admin/showtimes/{id}`; Delete calls the existing `DELETE` API. **Since W4 Thu the Movie/Screen selects are enabled while editing** — the showtime can be moved to a different movie/screen (seats regenerate from the new screen) whenever it has no active bookings; the form shows a "Changing the screen regenerates the seat layout" notice. Edit/Delete are disabled while the showtime has active bookings (blocked server-side too)
- **Admin back-to-dashboard links (W4 Thu)** — Showtimes and Bookings pages now have a yellow-accent "Back to Dashboard" link; the same accent was applied to the back links on Genres, Movies, and the movie form
- **Contrast/readability polish (W4 Thu)** — red text on red/dark backgrounds was hard to read. Info pills/badges and back links now use the gold accent (`--color-accent`), destructive buttons/links are neutral (like Edit) instead of red, avatar/cast initials render white on `--color-surface`, admin dashboard card titles are white, and the 404 page uses the accent
- **AdminDashboard with charts** — upgraded from nav cards to a stats dashboard: stat cards (total revenue, bookings, avg occupancy, showtimes) + **Revenue by Movie** and **Occupancy by Screen** bar charts via **recharts** (new dependency), with loading/error/empty states; the management nav cards remain below (W4 Wed)
- **AccountPage** — `/account` (ProtectedRoute) calls the previously-unused `GET /api/auth/me` and shows username, email, role badge, member-since date, and a logout button. "Account" link added to the navbar (desktop + mobile) (W4 Wed)

---

## Default Admin Account

Auto-seeded on startup:

- **Username:** admin
- **Password:** admin123

---

## Database Schema

### users
| Column      | Type         | Constraint        |
|-------------|-------------|-------------------|
| id          | BIGSERIAL   | PRIMARY KEY       |
| username    | VARCHAR(50) | UNIQUE, NOT NULL  |
| email       | VARCHAR(100)| UNIQUE, NOT NULL  |
| password    | VARCHAR(255)| NOT NULL          |
| role        | VARCHAR(20) | NOT NULL, DEFAULT 'USER' |
| created_at  | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP |

### genres
| Column      | Type         | Constraint        |
|-------------|-------------|-------------------|
| id          | BIGSERIAL   | PRIMARY KEY       |
| name        | VARCHAR(100)| UNIQUE, NOT NULL  |
| description | TEXT        |                   |

### movies
| Column           | Type         | Constraint        |
|-----------------|-------------|-------------------|
| id              | BIGSERIAL   | PRIMARY KEY       |
| title           | VARCHAR(255)| NOT NULL          |
| slug            | VARCHAR(255)| UNIQUE, NOT NULL  |
| description     | TEXT        |                   |
| poster_url      | VARCHAR(500)|                   |
| duration_minutes| INT         | NOT NULL          |
| release_date    | DATE        |                   |
| original_language| VARCHAR(10)|                   |
| director        | VARCHAR(255)|                   |
| created_at      | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP |

### movie_genres
| Column   | Type   | Constraint                |
|----------|--------|---------------------------|
| id       | BIGSERIAL | PRIMARY KEY             |
| movie_id | BIGINT | FK → movies(id) ON DELETE CASCADE |
| genre_id | BIGINT | FK → genres(id) ON DELETE CASCADE |

### screens
| Column      | Type         | Constraint        |
|-------------|-------------|-------------------|
| id          | BIGSERIAL   | PRIMARY KEY       |
| name        | VARCHAR(50) | NOT NULL          |
| screen_type | VARCHAR(20) | NOT NULL          |
| total_seats | INT         | NOT NULL          |
| seats_per_row | INT       | NOT NULL, DEFAULT 15 |

### showtimes
| Column        | Type           | Constraint        |
|--------------|---------------|-------------------|
| id           | BIGSERIAL     | PRIMARY KEY       |
| movie_id     | BIGINT        | FK → movies(id)   |
| show_date    | DATE          | NOT NULL          |
| show_time    | TIME          | NOT NULL          |
| screen_number| BIGINT         | NOT NULL, FK → screens(id) |
| total_seats  | INT           | NOT NULL          |
| price_per_seat| DECIMAL(10,2)| NOT NULL          |
| created_at   | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP |

### seats
| Column      | Type         | Constraint          |
|-------------|-------------|---------------------|
| id          | BIGSERIAL   | PRIMARY KEY         |
| showtime_id | BIGINT      | FK → showtimes(id)  |
| seat_number | VARCHAR(10) | NOT NULL            |
| row_label   | VARCHAR(5)  | NOT NULL            |
| is_available| BOOLEAN     | DEFAULT TRUE        |

### reservations
| Column        | Type           | Constraint        |
|--------------|---------------|-------------------|
| id           | BIGSERIAL     | PRIMARY KEY       |
| user_id      | BIGINT        | FK → users(id)    |
| showtime_id  | BIGINT        | FK → showtimes(id)|
| status       | VARCHAR(20)   | NOT NULL, DEFAULT 'PENDING' (PENDING = 2-min hold, CONFIRMED = booked, CANCELLED) |
| total_amount | DECIMAL(10,2) | NOT NULL          |
| created_at   | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP |
| cancelled_at | TIMESTAMP     |                   |
| pending_until| TIMESTAMP     | 2-min hold expiry for PENDING reservations (cleared on confirm) |

### reservation_seats
| Column         | Type              | Constraint              |
|---------------|-------------------|-------------------------|
| id            | BIGSERIAL         | PRIMARY KEY             |
| reservation_id| BIGINT            | FK → reservations(id)   |
| seat_id       | BIGINT            | FK → seats(id)          |
| is_active     | BOOLEAN           | NOT NULL, DEFAULT TRUE — set FALSE on cancel/expiry/seat-change (keeps history) |

> **Anti-double-booking guard:** partial unique index `uq_active_reservation_seat ON reservation_seats (seat_id) WHERE is_active` — a seat physically cannot be in two active reservations. Combined with `SELECT ... FOR UPDATE` in `POST /api/reservations` and `PUT /api/reservations/{id}/seats` (first-come-first-served).

### actors
| Column    | Type         | Constraint        |
|-----------|-------------|-------------------|
| id        | BIGSERIAL   | PRIMARY KEY       |
| name      | VARCHAR(255)| NOT NULL          |
| bio       | TEXT        |                   |
| photo_url | VARCHAR(500)|                   |

### movie_cast
| Column     | Type       | Constraint              |
|-----------|-----------|-------------------------|
| id        | BIGSERIAL  | PRIMARY KEY             |
| movie_id  | BIGINT     | FK → movies(id)         |
| actor_id  | BIGINT     | FK → actors(id)         |
| role_name | VARCHAR(255)|                       |

### tickets
| Column         | Type         | Constraint                          |
|---------------|--------------|-------------------------------------|
| id            | BIGSERIAL    | PRIMARY KEY                         |
| reservation_id| BIGINT       | NOT NULL, FK → reservations(id) ON DELETE CASCADE |
| token         | VARCHAR(64)  | UNIQUE, NOT NULL — one per confirmed reservation, generated on confirm (W3 Thu) |
| status        | VARCHAR(20)  | NOT NULL, DEFAULT 'ACTIVE' ('ACTIVE' → 'USED' on first scan) |
| created_at    | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP |

---

## API Endpoints

### Auth

| Method | Endpoint              | Access         | Description          |
|--------|-----------------------|----------------|----------------------|
| POST   | /api/auth/signup      | Public         | Register new user    |
| POST   | /api/auth/login       | Public         | Login, returns JWT   |
| GET    | /api/auth/me          | Authenticated  | Get current user     |

> Note: `GET /api/auth/me` is used by the **AccountPage** (`/account`, W4 Wed) to render the current user's profile. The app otherwise stores the user object from the login response.

### Genres
| Method | Endpoint              | Access         | Description          |
|--------|-----------------------|----------------|----------------------|
| GET    | /api/genres           | Public         | List all genres      |
| POST   | /api/admin/genres     | ADMIN          | Create genre         |
| PUT    | /api/admin/genres/{id}| ADMIN          | Update genre         |
| DELETE | /api/admin/genres/{id}| ADMIN          | Delete genre         |

### Movies
| Method | Endpoint                   | Access         | Description            |
|--------|----------------------------|----------------|------------------------|
| GET    | /api/movies?genreId=&sortBy=&sortDir=&availability=&page=&size= | Public         | List movies with filtering, sorting, and pagination (returns `{ content, totalPages, totalElements, currentPage, size }`; `page` ≥ 0, `size` 1–100 validated → 400) |
| GET    | /api/movies/{slug}         | Public         | Get movie details + cast by slug |
| POST   | /api/admin/movies          | ADMIN          | Create movie (with genreIds) |
| PUT    | /api/admin/movies/{id}     | ADMIN          | Update movie           |
| DELETE | /api/admin/movies/{id}     | ADMIN          | Delete movie           |
| POST   | /api/admin/movies/{id}/poster | ADMIN       | Upload movie poster (multipart) |
| POST   | /api/admin/movies/{movieId}/cast | ADMIN    | Add cast member to movie (auto-creates actor) |
| DELETE | /api/admin/movies/{movieId}/cast/{castId} | ADMIN | Remove cast member |

### Screens
| Method | Endpoint                | Access         | Description          |
|--------|-------------------------|----------------|----------------------|
| GET    | /api/screens            | Public         | List all cinema screens |

> Note: Screens are seeded on startup (2 small, 2 medium, 2 large). No admin CRUD — fixed cinema layout.

### Showtimes
| Method | Endpoint                              | Access         | Description                    |
|--------|---------------------------------------|----------------|--------------------------------|
| GET    | /api/showtimes?movieId={id}           | Public         | List showtimes for a movie     |
| GET    | /api/showtimes/{id}                   | Public         | Get showtime details (enriched)|
| GET    | /api/showtimes/{showtimeId}/seats     | Public         | Get seat layout with status    |
| POST   | /api/admin/showtimes                  | ADMIN          | Create showtime + generate seats |
| GET    | /api/admin/showtimes?movieId=&screenId= | ADMIN        | List all showtimes (enriched: movie, screen, available seats, active bookings) with optional movie/screen filter |
| PUT    | /api/admin/showtimes/{id}             | ADMIN          | Update showtime — date/time/price always; optional `movieId`/`screenId` to move it to a different movie/screen (validates, duplicate-checks excluding self, deletes old seats, **regenerates seats from the new screen**) — blocks if active bookings exist |
| DELETE | /api/admin/showtimes/{id}             | ADMIN          | Delete showtime (blocks if active bookings exist) |
| GET    | /api/admin/showtimes/{id}/seats       | ADMIN          | Admin seat grid — per-seat status + reservation id/owner/amount |

### Reservations
| Method | Endpoint                      | Access        | Description               |
|--------|-------------------------------|---------------|---------------------------|
| POST   | /api/reservations             | Authenticated | Create reservation (**PENDING hold** — status=PENDING, `pending_until`=now+2min, seats held; `SELECT ... FOR UPDATE` prevents double-booking) |
| POST   | /api/reservations/{id}/confirm | Authenticated | **Mock payment** — flips PENDING→CONFIRMED within the 2-min window (idempotent; rejects expired holds). Future payment webhook lands here |
| GET    | /api/reservations/my          | Authenticated | Get the user's own reservations (movie, screen, date/time, seats, amount, status) |
| PUT    | /api/reservations/{id}/cancel | Authenticated | Cancel reservation (**PENDING or CONFIRMED**; admins can cancel any) — releases seats |
| PUT    | /api/reservations/{id}/seats  | Authenticated | **Change seats** — new seats must be available or already held by this reservation; releases old, holds new, recomputes total (PENDING + CONFIRMED) |

### Admin Reservations
| Method | Endpoint                              | Access | Description                              |
|--------|---------------------------------------|--------|------------------------------------------|
| GET    | /api/admin/reservations?screenId={id} | ADMIN  | List all reservations, optionally filtered by screen |
| PUT    | /api/admin/reservations/bulk-cancel   | ADMIN  | Cancel multiple reservations in one request |

### Tickets
| Method | Endpoint                              | Access | Description                              |
|--------|---------------------------------------|--------|------------------------------------------|
| GET    | /api/tickets/{ticketToken}            | Public | Scan endpoint — VALID + marks **USED** on first scan; ALREADY USED on rescan; INVALID if unknown/CANCELLED/passed (no PII) |
| GET    | /api/tickets/{ticketToken}/details    | Public | Display-only (non-consuming) ticket payload for the buyer's ticket page |

### Up Next (Week 3 remaining)
| Method | Endpoint                      | Access        | Description               |
|--------|-------------------------------|---------------|---------------------------|
| POST   | /api/payments/...             | Authenticated | Real payment initiation/confirm/cancel (PaymentProvider + Mock now, JazzCash/Easypaisa/SadaPay later) |

---

## Architecture

```
Frontend (React 19 + Vite 8)
  └─ Lenis (smooth scroll)
  └─ axios instance (utils/api.js)
       └─ baseURL: /api
            └─ Vite dev proxy → http://localhost:8080
       └─ /uploads proxy → http://localhost:8080

Backend (Spring Boot 4.0.7)
  └─ SecurityConfig (stateless, CORS, role-based)
       └─ JwtAuthFilter (extracts/validates Bearer token)
            └─ Controller → Service → Repository (JdbcTemplate)
                 └─ PostgreSQL
  └─ FileStorageService (safe file deletion for uploads)
  └─ WebConfig (serves uploads/ as static resources)
```

## Remaining Week 3 Features

The following features are planned but **not yet implemented**:

| Feature | Description | Status |
|---------|-------------|--------|
| **2-min seat hold + mock payment** | `POST /api/reservations` → PENDING (seats held 2 min); `POST /api/reservations/{id}/confirm` → CONFIRMED (mock payment, the future webhook seam); `HoldExpiryJob` releases expired holds. UI: 2:00 countdown + "Complete Booking" on the confirmation page | ✅ Done (foundation for payment) |
| **UserReservationsPage** | "My Bookings" page where users view their own reservation history (pending + confirmed + cancelled), including movie title, screen, date/time, seats, amount, and status, with Cancel + Change Seats | ✅ Done |
| **GET /api/reservations/my** | Backend endpoint returning the authenticated user's reservations | ✅ Done |
| **Overbooking prevention** | `SELECT ... FOR UPDATE` in the reservation/change-seats transactions + `uq_active_reservation_seat` partial unique index (`reservation_seats.seat_id WHERE is_active`) as the DB hard-guard | ✅ Done |
| **Change seats** | `PUT /api/reservations/{id}/seats` (PENDING + CONFIRMED, FOR UPDATE, available-or-held-by-me, recomputes total) + SeatSelectionPage change mode + "Change Seats" buttons | ✅ Done |
| **Revenue report** | `GET /api/admin/reports/revenue` — total revenue grouped by movie/screen/date | ✅ Done (W4 Wed) |
| **Capacity report** | `GET /api/admin/reports/capacity` — seat occupancy percentage per showtime/screen | ✅ Done (W4 Wed) |
| **AdminDashboard charts** | Upgrade `AdminDashboard.jsx` from navigation cards to a stats dashboard with revenue/capacity charts | ✅ Done (W4 Wed) |
| **Error pages** | Dedicated 404 page (`NotFoundPage` + catch-all route); other pages keep per-page error banners | ✅ Done (W3 Thu) |
| **End-to-end testing** | Full test pass over backend APIs and frontend user flows (book → hold → mock pay → cancel, change seats, admin management) | ✅ Done (W3 Fri, 39/39 PASS live) |
| **PUT /api/admin/showtimes/{id}** | Backend endpoint to update a showtime (date/time/price always; optional `movieId`/`screenId` to change the movie/screen when unlocked — seats regenerate from the new screen, duplicate-checked excluding self). Blocks if CONFIRMED/PENDING bookings exist | ✅ Done (W3 Tue; movie/screen change W4 Thu) |
| **AdminShowtimePage management UI** | Upgraded the create-only showtime page into a full management page: list existing showtimes (with movie filter), delete button per showtime, edit button that pre-fills the form and switches to update mode (**Movie/Screen selects enabled since W4 Thu** — changing the screen regenerates the seat layout). Refresh the list after create/update/delete. Active-bookings badge disables edit/delete while locked | ✅ Done (W3 Tue; edit unlock W4 Thu) |
| **Payment integration** | JazzCash/Easypaisa/SadaPay via a `PaymentProvider` interface + Mock implementation. The 2-min PENDING hold and `POST /api/reservations/{id}/confirm` are already in place as the seam. Real flow: initiate provider payment → provider callback/webhook validates and flips to `CONFIRMED`. Abandon / failure / expiry releases seats. `payments` table tracks reservation_id, amount, provider, txn id, status, paid_at. Amount is always computed server-side (never trust the client). Production needs merchant/business accounts + sandbox keys; amounts in PKR; dev webhooks need a public URL (ngrok) | Not started |
| **Digital ticket + QR validation** | After payment confirms, "Download Ticket" renders a printable ticket (movie, screen, date/time, seats, amount, ticket code + QR generated client-side with the `qrcode` lib). The venue/recipient scans the QR → `GET /api/tickets/{ticketToken}` returns VALID/INVALID (no user PII); the first successful scan marks the ticket **USED** → rescanning shows "ALREADY USED". INVALID if token unknown, reservation `CANCELLED`, or showtime has passed. Ticket identity stored server-side (`tickets` table) so the QR is verifiable even though it's rendered on the client. The buyer's own page uses the non-consuming `GET /api/tickets/{ticketToken}/details` so viewing/printing never consumes the ticket | 🟢 Done (W3 Thu backend + W3 Fri QR page) |

### Known Issues

> Full consolidated list with statuses: **[BUGS.md](BUGS.md)** — bugs, database design gaps, dead-code cleanup, and decisions.
>
> The bugs found in Week 2 (booking route guard, no-op block, `screen_number` FK, orphaned actors, dead code) were all fixed on W2 Fri — see **BUGS.md** for the full record.
>
> W3 Tue fix: **Postgres unquoted-alias folding** (#16) — raw `queryForList` queries used unquoted camelCase aliases that PostgreSQL folds to lowercase, so `/api/reservations/my`, `/api/showtimes/{id}/seats`, and `/api/admin/reservations` returned lowercase keys. The frontend's camelCase reads (`showtimeId`, `movieTitle`, `seatNumber`, `heldByMe`, ...) were `undefined`, which broke My Bookings "Change Seats" (`/booking/undefined/change` → "Failed to load seat layout"), showed blank titles / `$NaN`, and rendered the seat grid without labels/HELD/`heldByMe`. Fixed by quoting the aliases in the 3 queries plus passing `changeMode: true` in the My Bookings navigation.
>
> W3 Fri fix: **unknown `/api/**` URL → 500** (#17) — a GET to an unmapped API path (e.g. `/api/reservations/999999`) threw Spring's `NoResourceFoundException`, which had no handler, so it returned 500 instead of 404. Fixed with an `@ExceptionHandler(NoResourceFoundException.class)` → 404 `{ "message": "Resource not found" }`.

### Suggested build order

0. ✅ **UserReservationsPage** + `GET /api/reservations/my` — closes the user booking loop
1. ✅ **2-min seat hold + mock payment** — PENDING hold, `POST /api/reservations/{id}/confirm`, `HoldExpiryJob`, countdown UI (foundation for payment)
2. ✅ **Overbooking prevention** — `SELECT FOR UPDATE` on seat rows + `uq_active_reservation_seat` partial unique index (done before payment so holds are race-safe)
3. ✅ **Change seats** — `PUT /api/reservations/{id}/seats` + SeatSelectionPage change mode (PENDING + CONFIRMED)
4. ✅ **Showtime management** — `PUT /api/admin/showtimes/{id}` + management UI on `AdminShowtimePage` (delete button uses the existing `DELETE` API; edit pre-fills the form). List existing showtimes with a movie/screen filter so admins can fix mistakes
5. ✅ **Revenue + capacity reports** — feed the admin dashboard charts (W4 Wed)
6. ✅ **AdminDashboard with charts/stats** — visual overview for admins (W4 Wed)
7. ✅ **Error pages + polish** — 404 page (`NotFoundPage` + catch-all route); consistent loading states in progress
8. ✅ **End-to-end testing** — full live test pass W3 Fri (39/39) covering book → hold → mock pay → ticket, change seats, hold expiry, admin showtime/movie guards + bulk cancel, seat grid, genre CRUD, and error cases
9. **Payment integration** — `PaymentProvider` interface + Mock provider, then swap in JazzCash/Easypaisa/SadaPay (the PENDING hold + `confirm` endpoint are the seam)
10. ✅ **Digital ticket + QR validation** — backend `tickets` table + token on confirm + `GET /api/tickets/{token}` VALID/INVALID/USED (W3 Thu); printable ticket page with QR + non-consuming `/details` endpoint + View Ticket entry points (W3 Fri)

---

## Project Status

**Work in progress.** Auth flow, genre CRUD, movie CRUD with poster/cast, public movie listing with genre filter, movie detail page, Cinema Noir dark theme, smooth scrolling, responsive layouts, file cleanup, 6 cinema screens, showtime creation with auto seat generation, showtime deletion with active-booking guard, tab-based movie listing with server-side filtering/sorting/pagination, showtime date picker on movie detail page, seat layout endpoint, visual seat selection grid, reservation creation with `@Transactional`, showtime details endpoint, booking confirmation page, cancel reservation, admin showtime creation page, admin bookings page with screen filter + bulk cancel, movie cascade delete (FK-safe, poster cleanup after DB success), the W2 Fri bug-fix pass (booking route guard, no-op removal, `screen_number` FK, orphaned-actor cleanup, dead-code removal), and the **W3 Mon pass** (2-min PENDING seat hold + mock-payment confirm, `HoldExpiryJob` 30s sweep, overbooking prevention with `SELECT FOR UPDATE` + `uq_active_reservation_seat` partial unique index, My Bookings page + `/api/reservations/my`, change seats for PENDING + CONFIRMED, admin booking listing PENDING handling, showtime delete guard including PENDING, docs) are all complete.

The **W3 Tue pass** added: `PUT /api/admin/showtimes/{id}` (update date/time/price, blocked while active bookings exist) + `GET /api/admin/showtimes` list (movie/screen filter) + `GET /api/admin/showtimes/{id}/seats` admin seat grid, the **AdminShowtimePage management UI** (list/delete/edit with active-booking lock), the **admin booking seat grid** on `/admin/reservations` (Screen → Show → Time → grid, click-to-cancel, cancel-all-per-showtime), and the bug #15 fix (malformed JSON → 400 instead of 500).

The **W3 Thu pass** added: the **digital ticket backend** — `tickets` table (token per confirmed reservation, FK cascade), `GET /api/tickets/{ticketToken}` (VALID/INVALID/ALREADY USED, no PII in INVALID, first scan marks USED), confirm now returns `ticketToken` — and the **404 page** (`NotFoundPage` + catch-all route). Both verified live (book → confirm → VALID → rescan ALREADY USED → unknown INVALID; data cleaned).

The **W3 Fri pass** finished the digital ticket feature and closed Week 3: **non-consuming `GET /api/tickets/{ticketToken}/details`** (the scan endpoint marks USED on first call, so the buyer's own page must not use it), **`ticketToken` in `GET /api/reservations/my`**, the **printable QR ticket page** (`/tickets/:token` — Cinema Noir ticket card + client-side QR via `qrcode` + Print; VALID / ALREADY USED / INVALID states) with **View Ticket** buttons on the confirmation page and My Bookings, bug #17 (unknown `/api/**` → 404), and a **full live end-to-end test pass (39/39)** — book → hold → mock pay → ticket VALID→USED, change seats on PENDING + CONFIRMED, backdated-hold expiry, admin showtime/movie delete+update guards, bulk cancel, admin seat grid, genre CRUD, and error cases (400 malformed JSON / double-cancel / seat-taken, 404, INVALID). All E2E data cleaned — DB reset to baseline.

Remaining Week 3 work: **only the payment integration (JazzCash/Easypaisa/SadaPay + Mock via the PENDING hold/confirm seam)**; revenue/capacity reports, admin dashboard charts, and the account page were deferred to Week 4 — and are now **done (W4 Wed)**. See the **Remaining Week 3 Features** section above.

The **W4 Mon pass** (test all endpoints + fix edge cases) added backend hardening: **showtime validation** (missing `movieId`/`screenId`/`showDate`/`showTime`/`pricePerSeat` → 400, negative price → 400, past show date → 400, duplicate movie+screen+date+time → 400 — enforced on create and update), **signup bean validation** (`@Valid` + `MethodArgumentNotValidException` → 400 with field message), **movie pagination bounds** (`page ≥ 0`, `size 1–100` → 400), and **JSON 401/403 responses** (`authenticationEntryPoint` / `accessDeniedHandler` in `SecurityConfig` return `{"message":"Unauthorized"}` / `{"message":"Access denied"}` instead of Spring's HTML error page). Full live test pass: **48/48 PASS** (39-regression suite + 9 new edge-case checks: missing/negative/past/duplicate showtime fields, update guards, pagination bounds, 401/403 JSON, non-admin 403).

The **W4 Tue pass** (test all frontend flows + mobile fixes) reviewed every page for mobile responsiveness, fixed the **seat grid overflow** on phones (15 seats/row previously fixed at 32px ≈ 570px → now responsive `w-6→w-8` scaling + `overflow-x-auto` fallback; the admin grid already wrapped), cleaned 3 unused-variable lint warnings (`AdminMovieForm`, `AdminGenrePage`, `AdminShowtimePage`), and **changed all currency displays from `$` to `PKR`** (movie detail, booking confirmation ×4, ticket page + dollar icon → banknote, My Bookings, admin reservations ×2, admin showtime label + `/seat`). Verified via `vite build` + `oxlint` (1 intentional warning) + Vite proxy `/api` and `/uploads` passthrough.

The **W4 Wed pass** (final polish + carried-over analytics) added the **admin reports** — new `AdminReportController` with `GET /api/admin/reports/revenue` (total revenue + bookings, grouped by movie/screen/date over `CONFIRMED` reservations) and `GET /api/admin/reports/capacity` (occupancy % per showtime/screen = active `reservation_seats` ÷ `total_seats`) — and upgraded **`AdminDashboard.jsx`** from nav cards to a stats dashboard: 4 stat cards (total revenue, bookings, avg occupancy, showtimes) + **Revenue by Movie** and **Occupancy by Screen** bar charts via the new **recharts** dependency (loading/error/empty states; management nav cards kept below). Also added the **`/account` page** (`AccountPage.jsx`, ProtectedRoute) using the previously-unused `GET /api/auth/me` (username, email, role badge, member-since, logout) with an **Account** link in the navbar. Verified: `mvnw compile` clean, `vite build` clean (recharts bumps the main chunk to ~812 kB), `oxlint` (1 intentional pre-existing warning), and all 5 report SQL queries validated live against Postgres.

The **W4 Thu pass** (final UI polish + showtime edit unlock) made **movie/screen changeable on showtime edit**: `PUT /api/admin/showtimes/{id}` now accepts optional `movieId`/`screenId` — when either differs (and no active bookings exist) it validates the movie/screen, duplicate-checks the new combo excluding the showtime itself, deletes the old seats + `reservation_seats` links, **regenerates the seat layout from the new screen's capacity**, and updates the row, all in one `@Transactional` (seat generation extracted into a shared `generateSeatsForShowtime` helper reused by create + update; date/time/price-only edits keep the old path). The **AdminShowtimePage** edit form enables the Movie/Screen selects (with a "Changing the screen regenerates the seat layout" notice) and sends both ids. Also did a **contrast/readability pass** across 12 frontend files (info pills/badges + back links → gold accent, destructive buttons/links → neutral, avatar/cast initials white on surface, dashboard card titles white, 404 accent), added **Back to Dashboard** links to the Showtimes/Bookings admin pages, and added the slim **Footer** (`© {year} CINEMAX`, flex-column app shell in `App.jsx`). Verified: `mvnw compile` clean + `vite build` clean.
