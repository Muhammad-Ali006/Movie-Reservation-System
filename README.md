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

### Backend Architecture
- **Layered pattern** — `controller → service → repository (JdbcTemplate)` with manual `RowMapper`
- **Global exception handler** — returns structured JSON errors:
  - `404` — `ResourceNotFoundException`
  - `401` — `UnauthorizedException`
  - `400` — `IllegalArgumentException`
  - `500` — generic fallback
- **Data seeder** — auto-creates admin account on startup (`admin / admin123`)

### Frontend
- **Axios client** (`utils/api.js`) — centralized API client with `baseURL: /api`
- **Auto token injection** — request interceptor attaches `Authorization: Bearer <token>` from localStorage
- **Auto logout on 401** — response interceptor clears token and redirects to `/login`
- **Login/Signup pages** — forms wired to backend endpoints
- **Navbar** — dynamic UI showing Login/Signup when logged out, Logout + Admin link (for admin role) when logged in

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
| description     | TEXT        |                   |
| poster_url      | VARCHAR(500)|                   |
| genre_id        | BIGINT      | FK → genres(id)   |
| duration_minutes| INT         | NOT NULL          |
| created_at      | TIMESTAMP   | DEFAULT CURRENT_TIMESTAMP |

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
| GET    | /api/movies                | Public         | List all movies        |
| GET    | /api/movies/{id}           | Public         | Get movie details + cast |
| POST   | /api/admin/movies          | ADMIN          | Create movie           |
| PUT    | /api/admin/movies/{id}     | ADMIN          | Update movie           |
| DELETE | /api/admin/movies/{id}     | ADMIN          | Delete movie           |
| POST   | /api/admin/movies/{id}/poster | ADMIN       | Upload movie poster (multipart) |
| POST   | /api/admin/movies/{movieId}/cast | ADMIN    | Add actor to movie cast |
| DELETE | /api/admin/movies/{movieId}/cast/{castId} | ADMIN | Remove cast member |

### Actors
| Method | Endpoint                | Access         | Description          |
|--------|-------------------------|----------------|----------------------|
| GET    | /api/actors             | Public         | List all actors      |
| POST   | /api/admin/actors       | ADMIN          | Create actor         |
| PUT    | /api/admin/actors/{id}  | ADMIN          | Update actor         |
| DELETE | /api/admin/actors/{id}  | ADMIN          | Delete actor         |

### Planned
| Method | Endpoint                      | Access        | Description               |
|--------|-------------------------------|---------------|---------------------------|
| GET    | /api/showtimes?movieId={id}   | Public        | List showtimes by movie   |
| POST   | /api/admin/showtimes          | ADMIN         | Create showtime           |
| GET    | /api/showtimes/{id}/seats     | Public        | Get seat layout           |
| POST   | /api/reservations             | Authenticated | Create reservation        |
| GET    | /api/reservations/my          | Authenticated | Get user's reservations   |
| DELETE | /api/reservations/{id}        | Authenticated | Cancel reservation        |

---

## Architecture

```
Frontend (React 19 + Vite 8)
  └─ axios instance (utils/api.js)
       └─ baseURL: /api
            └─ Vite proxy → http://localhost:8080

Backend (Spring Boot 4.0.7)
  └─ SecurityConfig (stateless, CORS, role-based)
       └─ JwtAuthFilter (extracts/validates Bearer token)
            └─ Controller → Service → Repository (JdbcTemplate)
                 └─ PostgreSQL
```

## Project Status

**Work in progress.** Auth flow, movie CRUD with poster upload, genre CRUD, and actor/cast management are complete. Showtime, seat selection, and reservation features are planned.
