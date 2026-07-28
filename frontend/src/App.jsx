import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Lenis from 'lenis'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AdminDashboard from './pages/AdminDashboard'
import AdminGenrePage from './pages/AdminGenrePage'
import AdminMoviePage from './pages/AdminMoviePage'
import AdminMovieForm from './pages/AdminMovieForm'
import MovieListingPage from './pages/MovieListingPage'
import MovieDetailPage from './pages/MovieDetailPage'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

function App() {
  const token = localStorage.getItem('token')

  useEffect(() => {
    const lenis = new Lenis({ autoRaf: true })
    return () => lenis.destroy()
  }, [])

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Navbar />
      <main style={{ color: 'var(--color-text)' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<MovieListingPage />} />
          <Route path="/movies/:slug" element={<MovieDetailPage />} />
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
        </Routes>
      </main>
    </div>
  )
}

export default App
