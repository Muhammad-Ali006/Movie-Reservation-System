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
| Lenis             | —           |
| Lucide React      | —           |

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

## What's Implemented

### Authentication & Security
- **JWT authentication** — tokens generated on login, validated on every request via `JwtAuthFilter` (OncePerRequestFilter)
- **Stateless sessions** — no HTTP session, every request authenticated via Bearer token
- **CORS** — configured to allow `http://localhost:5173` (Vite dev server)
- **Role-based access control** — `ROLE_USER` for regular users, `ROLE_ADMIN` for admin endpoints (`/api/admin/**`)
- **Password encryption** — BCrypt via Spring Security `PasswordEncoder`
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
- **Admin showtime creation** — `POST /api/admin/showtimes` accepts movieId, screenId, showDate, showTime, pricePerSeat
- **Auto seat generation** — when a showtime is created, seats are automatically generated based on the screen's capacity (e.g. Screen 5 → 180 seats → 12 rows × 15)
- **Public showtime listing** — `GET /api/showtimes?movieId={id}` returns all showtimes for a movie with screen name, available seat count, and price
- **Seat layout endpoint** — `GET /api/showtimes/{showtimeId}/seats` returns all seats with `id`, `seatNumber`, `rowLabel`, and `status` ("AVAILABLE" / "BOOKED")
- **Showtime details endpoint** — `GET /api/showtimes/{id}` returns enriched showtime data: `movieTitle`, `movieSlug`, `showDate`, `showTime`, `screenName`, `screenType`, `totalSeats`, `availableSeats`, `pricePerSeat`

### Backend Architecture
- **Layered pattern** — `controller → service → repository (JdbcTemplate)` with manual `RowMapper`
- **Movie filtering/sorting/pagination** — `MovieRepository` supports filtered queries by genre and availability (has showtimes or not), with server-side sorting and LIMIT/OFFSET pagination. Returns `{ content, totalPages, totalElements, currentPage, size }`
- **PostgreSQL 18 compatibility** — JDBC prepared statements with BIGINT columns reject implicit VARCHAR-to-BIGINT conversion. All genre ID queries use `Long` instead of `String` to avoid `operator does not exist: bigint = character varying`
- **File storage** — `FileStorageService` handles safe file deletion for poster/photo replacements and movie deletions (skips nulls, external URLs, and defaults; logs at INFO level)
- **Global exception handler** — returns structured JSON errors:
  - `404` — `ResourceNotFoundException`
  - `401` — `UnauthorizedException`
  - `400` — `IllegalArgumentException`
  - `500` — generic fallback
- **Static file serving** — `WebConfig` maps `/uploads/**` to the filesystem `uploads/` directory

### UI & Design
- **Cinema Noir theme** — dark color palette (`#0A0A0A` background, `#141414` surface, `#E50914` primary red, `#FFC107` gold accent) defined as CSS custom properties in `index.css` for easy palette swaps
- **Netflix-style hero banner** — full-viewport home page with background cinema image (`public/cinema-background.jpeg`), multi-layer gradient overlay (left-to-right + bottom-to-top) for text readability over the image
- **Transparent navbar** — gradient overlay navbar that sits on top of the hero banner, with `position: absolute` so the hero extends behind it
- **Lenis smooth scroll** — initialized in `App.jsx` for buttery smooth scrolling across all pages
- **Lucide React icons** — used throughout the app for consistent, lightweight iconography (Film, LogIn, LogOut, UserPlus, Shield, ArrowLeft, Clock, Globe, etc.)
- **Dark-themed forms** — global CSS styles for dark input fields, selects, and textareas via CSS variables
- **Custom scrollbar** — styled for dark theme
- **Responsive design** — mobile-friendly layouts across all pages using Tailwind responsive utilities (`sm:`, `md:`, `lg:`)

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
- **SeatSelectionPage** — interactive seat grid at `/booking/:showtimeId`. Seats grouped by row (A, B, C...), color-coded (green=AVAILABLE, gray=BOOKED, red=selected). Click to select/deselect, legend, "Continue" button navigates to `/booking/:showtimeId/confirm`
- **BookingConfirmationPage** — booking summary at `/booking/:showtimeId/confirm`. Displays movie title, date/time, screen, selected seat tags (row+number), price breakdown, total. "Confirm Booking" button calls `POST /api/reservations` (requires auth). Success state with reservation ID and full details. Handles: missing route state guard, loading/error/confirming states
- **AdminShowtimePage** — create showtimes at `/admin/showtimes`. Movie + screen dropdowns, date/time/price inputs, seat preview, success summary with seat count
- **AdminReservationPage** — admin booking management at `/admin/reservations`. Screen filter dropdown, 2-column card grid showing movie title, screen, date/time, user, seats, amount, and status badge. Individual "Cancel Booking" buttons plus a "Cancel All" button that bulk-cancels every active booking for the selected screen. Confirmation dialogs, loading/error/empty states

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
| screen_number| INT           | NOT NULL          |
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
| status       | VARCHAR(20)   | NOT NULL, DEFAULT 'CONFIRMED' |
| total_amount | DECIMAL(10,2) | NOT NULL          |
| created_at   | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP |
| cancelled_at | TIMESTAMP     |                   |

### reservation_seats
| Column         | Type       | Constraint              |
|---------------|-----------|-------------------------|
| id            | BIGSERIAL  | PRIMARY KEY             |
| reservation_id| BIGINT     | FK → reservations(id)   |
| seat_id       | BIGINT     | FK → seats(id)          |

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

---

## API Endpoints

### Auth

| Method | Endpoint              | Access         | Description          |
|--------|-----------------------|----------------|----------------------|
| POST   | /api/auth/signup      | Public         | Register new user    |
| POST   | /api/auth/login       | Public         | Login, returns JWT   |
| GET    | /api/auth/me          | Authenticated  | Get current user     |

> Note: `GET /api/auth/me` exists in the backend but the frontend doesn't call it yet — the app stores the user object from the login response. Planned future use: user profile/account page or refreshing user state (Week 3).

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
| GET    | /api/movies?genreId=&sortBy=&sortDir=&availability=&page=&size= | Public         | List movies with filtering, sorting, and pagination (returns `{ content, totalPages, totalElements, currentPage, size }`) |
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
| PUT    | /api/admin/showtimes/{id}             | ADMIN          | Update showtime (date/time/price) — ⬜ NOT IMPLEMENTED |
| DELETE | /api/admin/showtimes/{id}             | ADMIN          | Delete showtime (blocks if active bookings exist) — API done, ⬜ no frontend UI |

### Reservations
| Method | Endpoint                      | Access        | Description               |
|--------|-------------------------------|---------------|---------------------------|
| POST   | /api/reservations             | Authenticated | Create reservation        |
| PUT    | /api/reservations/{id}/cancel | Authenticated | Cancel reservation (admins can cancel any) |

### Admin Reservations
| Method | Endpoint                              | Access | Description                              |
|--------|---------------------------------------|--------|------------------------------------------|
| GET    | /api/admin/reservations?screenId={id} | ADMIN  | List all reservations, optionally filtered by screen |
| PUT    | /api/admin/reservations/bulk-cancel   | ADMIN  | Cancel multiple reservations in one request |

### Up Next (Week 3)
| Method | Endpoint                      | Access        | Description               |
|--------|-------------------------------|---------------|---------------------------|
| GET    | /api/reservations/my          | Authenticated | Get user's reservations   |
| PUT    | /api/reservations/{id}/seats  | Authenticated | Change selected seats after confirmation |
| GET    | /api/admin/reports/revenue    | ADMIN         | Revenue report            |
| GET    | /api/admin/reports/capacity   | ADMIN         | Capacity report           |
| PUT    | /api/admin/showtimes/{id}     | ADMIN         | Update showtime (date/time/price) |

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
| **UserReservationsPage** | "My Bookings" page where users view their own reservation history (confirmed + cancelled), including movie title, screen, date/time, seats, amount, and status | Not started |
| **GET /api/reservations/my** | Backend endpoint returning the authenticated user's reservations | Not started |
| **Revenue report** | `GET /api/admin/reports/revenue` — total revenue grouped by movie/screen/date | Not started |
| **Capacity report** | `GET /api/admin/reports/capacity` — seat occupancy percentage per showtime/screen | Not started |
| **AdminDashboard charts** | Upgrade `AdminDashboard.jsx` from navigation cards to a stats dashboard with revenue/capacity charts | Not started |
| **Error pages** | Dedicated 404/error pages on the frontend (currently handled per-page with error banners) | Partial |
| **End-to-end testing** | Full test pass over backend APIs and frontend user flows (booking → cancel, admin management) | Not started |
| **PUT /api/admin/showtimes/{id}** | Backend endpoint to update a showtime (date/time/price only — movie/screen changes would invalidate seats/bookings). Should block if CONFIRMED bookings exist | Not started |
| **AdminShowtimePage management UI** | Upgrade the create-only showtime page into a full management page: list existing showtimes, delete button per showtime (the `DELETE` API exists but has **no frontend UI**), edit button that pre-fills the form and switches to update mode. Refresh the list after create/update/delete | Not started |

### Known Issues (bugs to fix in Week 3)

| Bug | Impact | Fix |
|-----|--------|-----|
| **Booking routes not guarded** | `/booking/:showtimeId` and `/booking/:showtimeId/confirm` are **not** wrapped in `ProtectedRoute`. Guests can pick seats, then get redirected to `/login` at the confirm step and lose their selection | Wrap both routes in `ProtectedRoute` so users log in before selecting seats, preserving the prior location so they return after login |

### Suggested build order

0. **Fix booking route guard** — wrap the booking routes in `ProtectedRoute` (see Known Issues above)
1. **UserReservationsPage** + `GET /api/reservations/my` — closes the user booking loop
2. **Showtime management** — `PUT /api/admin/showtimes/{id}` + management UI on `AdminShowtimePage` (delete button uses the existing `DELETE` API; edit pre-fills the form). List existing showtimes with a movie/screen filter so admins can fix mistakes
3. **Revenue + capacity reports** — feed the admin dashboard charts
4. **AdminDashboard with charts/stats** — visual overview for admins
5. **Error pages + polish** — 404 page, consistent loading states
6. **End-to-end testing** — verify all flows before Week 4 QA

---

## Project Status

**Work in progress.** Auth flow, genre CRUD, movie CRUD with poster/cast, public movie listing with genre filter, movie detail page, Cinema Noir dark theme, smooth scrolling, responsive layouts, file cleanup, 6 cinema screens, showtime creation with auto seat generation, showtime deletion with active-booking guard, tab-based movie listing with server-side filtering/sorting/pagination, showtime date picker on movie detail page, seat layout endpoint, visual seat selection grid, reservation creation with `@Transactional`, showtime details endpoint, booking confirmation page, cancel reservation, admin showtime creation page, admin bookings page with screen filter + bulk cancel, and movie cascade delete (FK-safe, poster cleanup after DB success) are all complete.

Remaining Week 3 work: **UserReservationsPage + `/api/reservations/my`**, showtime update endpoint + management UI (delete UI missing), revenue/capacity reports, admin dashboard charts, error pages, and end-to-end testing. See the **Remaining Week 3 Features** section above.
