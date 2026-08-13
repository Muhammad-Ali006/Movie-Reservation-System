import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AdminDashboard from './pages/AdminDashboard'
import AdminGenrePage from './pages/AdminGenrePage'
import AdminMoviePage from './pages/AdminMoviePage'
import AdminMovieForm from './pages/AdminMovieForm'
import MovieListingPage from './pages/MovieListingPage'
import MovieDetailPage from './pages/MovieDetailPage'
import SeatSelectionPage from './pages/SeatSelectionPage'
import BookingConfirmationPage from './pages/BookingConfirmationPage'
import UserReservationsPage from './pages/UserReservationsPage'
import AccountPage from './pages/AccountPage'
import AdminShowtimePage from './pages/AdminShowtimePage'
import AdminReservationPage from './pages/AdminReservationPage'
import TicketPage from './pages/TicketPage'
import NotFoundPage from './pages/NotFoundPage'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

function App() {
  const token = localStorage.getItem('token')
  const location = useLocation()

  useEffect(() => {
    const lenis = new Lenis({ autoRaf: true })
    return () => lenis.destroy()
  }, [])

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Navbar />
      <main className="flex-1" style={{ color: 'var(--color-text)' }}>
        <div key={location.pathname} className="page-transition">
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<MovieListingPage />} />
          <Route path="/movies/:slug" element={<MovieDetailPage />} />
          <Route
            path="/booking/:showtimeId"
            element={
              <ProtectedRoute>
                <SeatSelectionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking/:showtimeId/change"
            element={
              <ProtectedRoute>
                <SeatSelectionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking/:showtimeId/confirm"
            element={
              <ProtectedRoute>
                <BookingConfirmationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <UserReservationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/login"
            element={token ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/signup"
            element={token ? <Navigate to="/" replace /> : <Signup />}
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/genres"
            element={
              <AdminRoute>
                <AdminGenrePage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/showtimes"
            element={
              <AdminRoute>
                <AdminShowtimePage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/reservations"
            element={
              <AdminRoute>
                <AdminReservationPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/movies"
            element={
              <AdminRoute>
                <AdminMoviePage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/movies/new"
            element={
              <AdminRoute>
                <AdminMovieForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/movies/:slug/edit"
            element={
              <AdminRoute>
                <AdminMovieForm />
              </AdminRoute>
            }
          />
          <Route path="/tickets/:token" element={<TicketPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default App
