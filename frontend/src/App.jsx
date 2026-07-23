import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AdminDashboard from './pages/AdminDashboard'
import AdminGenrePage from './pages/AdminGenrePage'
import AdminMoviePage from './pages/AdminMoviePage'
import AdminMovieForm from './pages/AdminMovieForm'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

function App() {
  const token = localStorage.getItem('token')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
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
            path="/admin/movies/:id/edit"
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
