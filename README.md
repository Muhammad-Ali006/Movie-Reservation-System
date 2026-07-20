# Movie Reservation System

A fullstack movie reservation platform built with Spring Boot, React, JDBC, and PostgreSQL.

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
4. Run the application:
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

## Default Admin Account

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

---

## API Endpoints

| Method | Endpoint              | Access         | Description          |
|--------|-----------------------|----------------|----------------------|
| POST   | /api/auth/signup      | Public         | Register new user    |
| POST   | /api/auth/login       | Public         | Login, returns JWT   |
| GET    | /api/auth/me          | Authenticated  | Get current user     |
