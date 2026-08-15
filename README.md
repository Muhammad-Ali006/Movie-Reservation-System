# CINEMAX — Movie Reservation System

A full-stack movie reservation platform built with **Spring Boot, React, and PostgreSQL**. Users browse movies, pick seats on an interactive grid, book with a two-minute seat-hold + mock-payment flow, and receive a QR-scannable digital ticket. Admins manage movies, genres, showtimes, bookings, and analytics — all from one polished dark-themed UI.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/Muhammad-Ali006/Movie-Reservation-System/actions/workflows/ci.yml/badge.svg)](https://github.com/Muhammad-Ali006/Movie-Reservation-System/actions/workflows/ci.yml)
[![Java](https://img.shields.io/badge/Java-17-orange.svg)](#)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.7-6DB33F.svg)](#)
[![React](https://img.shields.io/badge/React-19.2-61DAFB.svg)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791.svg)](#)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED.svg)](#)

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Database schema](#database-schema)
- [API overview](#api-overview)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [License](#license)

---

## Features

### For moviegoers

- **Browse** movies with genre filters, sorting, and server-side pagination — Now Showing / Coming Soon / All Movies tabs
- **Rich movie pages** — poster, synopsis, cast with photos, metadata, and a date/time showtime picker
- **Interactive seat map** — color-coded rows (available / held / booked) with a live legend
- **2-minute seat hold + mock payment** — seats are reserved for you while you complete booking
- **Change seats** and **cancel bookings** after purchase
- **Digital tickets** — printable ticket with a **QR code** that venue staff scan to validate (single-use, no personal data in the scan response)
- **Account page** with member-since date and role badge

### For admins

- Full **movie CRUD** with poster upload, multi-genre tagging, and inline **cast management** (auto-creates actors, optional photos)
- **Showtime management** — create/update/delete, auto seat generation from screen capacity, protected from edits while bookings exist
- **Booking oversight** — searchable booking list, screen filter, per-booking and bulk cancel, read-only seat grid per showtime
- **Analytics dashboard** — total revenue, bookings, occupancy %, with **Revenue by Movie** and **Occupancy by Screen** charts

### Engineering

- **JWT auth** with BCrypt password hashing, stateless sessions, and role-based access (`USER` / `ADMIN`)
- **Race-safe bookings** — `SELECT … FOR UPDATE` + a partial unique index prevent double-booking at the database level
- Single deployable artifact: React is compiled and served by Spring Boot (SPA fallback routing built in)

---

## Tech stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| Backend      | Java 17, Spring Boot 4.0.7, Spring Security, Spring Data JDBC (`JdbcTemplate`), JJWT 0.12.6 |
| Database     | PostgreSQL 18 (schema auto-created via `schema.sql`) |
| Frontend     | React 19, Vite 8, Tailwind CSS 4, React Router 7, Axios, Lenis, Recharts, qrcode, Lucide |
| Tooling      | Maven (with `frontend-maven-plugin`), Docker, GitHub Actions |
| Deployment   | Render.com (Docker) + Neon (managed PostgreSQL) |

---

## Quick start

Requirements: **Java 17**, **Maven 3.6+**, **Node.js 18+**, **PostgreSQL**.

```bash
# 1. Create the database
createdb movie_db

# 2. Configure the backend
cp src/main/resources/application.properties.example src/main/resources/application.properties
#    → set spring.datasource.username / password

# 3. Run the backend (builds the frontend into the jar)
./mvnw spring-boot:run

# 4. (Alternative) run the frontend in dev mode with hot reload
cd frontend && npm install && npm run dev   # → http://localhost:5173
```

- The full app — API *and* UI — is served from **http://localhost:8080**. Verify with `curl http://localhost:8080/api/health` → `{"status":"UP"}`.
- In dev mode, Vite (port 5173) proxies `/api` and `/uploads` to the backend.
- The schema and default data are created automatically on first boot: `schema.sql` runs `CREATE TABLE IF NOT EXISTS`, and a `DataSeeder` seeds the admin account and six cinema screens.

**Default admin account:**

| Username | Password |
|----------|----------|
| `admin`  | `admin123` |

> **Important:** change the `JWT_SECRET` environment variable in any non-local deployment.

---

## Project structure

```
movie-reservation/
├── src/main/java/com/movie/reservation/
│   ├── config/        # Security, JWT filter, Web config, hold-expiry job, data seeder
│   ├── controller/    # REST controllers (public + admin)
│   ├── dto/           # Request / response objects
│   ├── exception/     # Global exception handler + typed exceptions
│   ├── model/         # Domain models
│   ├── repository/    # JdbcTemplate-based data access
│   ├── service/       # Business logic (auth, file storage)
│   └── util/          # JWT utilities
├── src/main/resources/
│   ├── schema.sql                       # Auto-created DB schema
│   └── application.properties.example   # Env-var-driven configuration
├── frontend/
│   └── src/
│       ├── pages/      # Route pages (Home, MovieListing, SeatSelection, …)
│       ├── components/ # Navbar, Footer, MovieMarquee, …
│       └── utils/api.js# Axios client with token injection
├── Dockerfile
└── pom.xml
```

---

## Architecture

A **single, self-contained service**: Spring Boot serves both the `/api/**` backend and the compiled React SPA from the same origin — so there's no CORS in production and exactly one Docker image to deploy.

```
Browser (React SPA)
   │  GET /api/**            Authorization: Bearer <JWT>
   │  GET /uploads/**        posters, actor photos, hero video
   ▼
Spring Boot :8080
   ├─ SecurityConfig / JwtAuthFilter    stateless JWT auth, role checks
   ├─ Controllers → Services → Repositories (JdbcTemplate)
   ├─ HoldExpiryJob                     30s sweep of expired seat holds
   └─ Static resources (index.html) / SpaForwardController  client-side routes
   ▼
PostgreSQL (Neon / local)
```

- **Layering:** `controller → service → repository`. Controllers translate HTTP, services hold business rules, repositories own the SQL via `JdbcTemplate`.
- **Auth:** BCrypt-hashed passwords; login returns a signed JWT validated by `JwtAuthFilter` on every request. `/api/admin/**` requires `ROLE_ADMIN`. Errors are returned as JSON (400/401/403/404/500).
- **Booking flow:** `POST /api/reservations` creates a `PENDING` hold (2-min `pending_until`, seats locked with `SELECT … FOR UPDATE`); `POST …/{id}/confirm` (mock payment) flips it to `CONFIRMED` and issues a ticket token; `HoldExpiryJob` releases expired holds automatically.

---

## Database schema

Eleven tables, auto-created from `schema.sql` (`IF NOT EXISTS`). The core relationships:

```
users ──< reservations >── showtimes >── movies >── movie_genres >── genres
              │                │                                  └── movie_cast >── actors
              │                └── seats >── reservation_seats
              │
              └── tickets (one per confirmed reservation)
screens ──< showtimes
```

Key integrity rules:

- **Anti-double-booking:** a partial unique index `uq_active_reservation_seat ON reservation_seats (seat_id) WHERE is_active` makes it structurally impossible for one seat to belong to two active reservations — enforced in addition to row locking.
- **Hold expiry:** PENDING reservations past `pending_until` have their seats released and are marked `CANCELLED`.
- **Deletion guards:** movies with confirmed bookings and showtimes with active bookings can't be deleted.
- **Server-side money:** `total_amount` is always computed as `price_per_seat × seats` in the backend.
- **No enumeration:** movies use unique URL slugs, tickets use 32-byte random tokens.

---

## API overview

Base URL: `http://localhost:8080` locally, `https://<app>.onrender.com` in production. Authenticated endpoints need `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/signup` | Public | Register a user |
| POST | `/api/auth/login` | Public | Login → JWT + user |
| GET | `/api/auth/me` | Auth | Current user |
| GET | `/api/health` | Public | Liveness probe |
| GET | `/api/genres` | Public | List genres |
| GET | `/api/movies` | Public | Filter/sort/paginate movies |
| GET | `/api/movies/{slug}` | Public | Movie details + cast |
| GET | `/api/screens` | Public | List cinema screens |
| GET | `/api/showtimes?movieId=` | Public | Showtimes for a movie |
| GET | `/api/showtimes/{id}` | Public | Showtime details |
| GET | `/api/showtimes/{id}/seats` | Public | Seat layout + status |
| POST | `/api/reservations` | Auth | Create a 2-min seat hold |
| POST | `/api/reservations/{id}/confirm` | Auth | Mock payment → confirmed + ticket |
| PUT | `/api/reservations/{id}/cancel` | Auth | Cancel (releases seats) |
| PUT | `/api/reservations/{id}/seats` | Auth | Change seats |
| GET | `/api/reservations/my` | Auth | User's bookings |
| GET | `/api/tickets/{token}` | Public | Scan/validate (consumes once) |
| GET | `/api/tickets/{token}/details` | Public | Non-consuming view |
| POST | `/api/admin/movies` | ADMIN | Create movie |
| PUT/DELETE | `/api/admin/movies/{id}` | ADMIN | Update / delete movie |
| POST | `/api/admin/movies/{id}/poster` | ADMIN | Upload poster |
| POST | `/api/admin/movies/{id}/cast` | ADMIN | Add cast member |
| POST | `/api/admin/showtimes` | ADMIN | Create showtime (generates seats) |
| GET/PUT/DELETE | `/api/admin/showtimes/{id}` | ADMIN | Manage showtimes |
| GET | `/api/admin/showtimes/{id}/seats` | ADMIN | Admin seat grid |
| GET | `/api/admin/reservations` | ADMIN | All bookings (screen filter) |
| PUT | `/api/admin/reservations/bulk-cancel` | ADMIN | Bulk cancel |
| GET | `/api/admin/reports/revenue` | ADMIN | Revenue analytics |
| GET | `/api/admin/reports/capacity` | ADMIN | Occupancy analytics |

Errors are JSON: `400` bad request / rule violation, `401` bad token, `403` wrong role, `404` not found, `500` server error.

---

## Deployment

Single Docker image — `Dockerfile` builds the jar (including the React app) and runs it on the JRE:

```bash
docker build -t movie-reservation .
docker run -d -p 8080:8080 \
  -e SPRING_DATASOURCE_URL="jdbc:postgresql://host:5432/movie_db?sslmode=require" \
  -e SPRING_DATASOURCE_USERNAME="user" \
  -e SPRING_DATASOURCE_PASSWORD="pass" \
  -e JWT_SECRET="$(openssl rand -base64 48)" \
  movie-reservation
```

Reference production setup: **Render.com** web service (Docker) + **Neon** managed PostgreSQL. Pushes to `main` redeploy automatically. Environment variables:

| Variable | Purpose |
|----------|---------|
| `SPRING_DATASOURCE_URL` | JDBC connection string |
| `SPRING_DATASOURCE_USERNAME` | DB user |
| `SPRING_DATASOURCE_PASSWORD` | DB password |
| `JWT_SECRET` | HS256 signing key (≥ 32 chars; generate with `openssl rand -base64 48`) |
| `APP_UPLOAD_DIR` | Filesystem path for poster/actor uploads (default `file:uploads/`) |

> Note: uploads live on the instance disk and are lost on redeploy — fine for demos; move them to object storage for production.

**CI:** GitHub Actions (`.github/workflows/ci.yml`) runs the Maven package (which also compiles the React build) plus frontend build/lint on every push.

---

## Roadmap

- [x] Authentication (JWT + roles)
- [x] Movie / genre / cast management
- [x] Showtimes with auto seat generation
- [x] Seat selection with 2-minute hold
- [x] Mock payment & booking confirmation
- [x] Digital QR tickets with validation
- [x] Admin analytics (revenue + occupancy)
- [x] Deployment (Docker, Render + Neon) and CI
- [ ] Real payment providers (JazzCash / Easypaisa / SadaPay)
- [ ] Email notifications

---

## License

Distributed under the **MIT License**. See [LICENSE](LICENSE).
