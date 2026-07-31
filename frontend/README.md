# Movie Reservation — Frontend

React 19 single-page app for the Movie Reservation System. Built with Vite 8, Tailwind CSS 4 (Cinema Noir dark theme), React Router 7, and Axios.

See the [root README](../README.md) for the full project documentation (architecture, API, schema, admin guide).

## Getting started

```bash
npm install
npm run dev      # start Vite dev server on http://localhost:5173
npm run build    # production build to dist/
```

The dev server proxies `/api` and `/uploads` to the Spring Boot backend on port 8080 (configured in `vite.config.js`), so no CORS setup is needed during development.

## Structure

- `src/pages/` — public pages (movie listing, movie detail, seat selection, booking confirmation, login/signup) and admin pages (dashboard, genres, movies, showtimes, reservations)
- `src/components/` — shared UI: `Navbar`, `ProtectedRoute`, `AdminRoute`
- `src/api.js` — Axios client with JWT injection and 401 auto-logout
