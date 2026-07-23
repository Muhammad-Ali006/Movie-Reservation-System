import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'

function AdminMoviePage() {
  const navigate = useNavigate()
  const [movies, setMovies] = useState([])
  const [genres, setGenres] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/movies'),
      api.get('/genres'),
    ]).then(([moviesRes, genresRes]) => {
      setMovies(moviesRes.data)
      setGenres(genresRes.data)
    }).catch(() => {
      setError('Failed to load movies')
    }).finally(() => {
      setLoading(false)
    })
  }, [])

  const genreMap = Object.fromEntries(genres.map(g => [g.id, g.name]))

  const handleDelete = async (id) => {
    setDeleteError('')
    try {
      await api.delete(`/admin/movies/${id}`)
      setDeletingId(null)
      setMovies(movies.filter(m => m.id !== id))
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete movie')
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/admin" className="text-sm text-blue-600 hover:underline mb-1 block">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Manage Movies</h1>
        </div>
        <button
          onClick={() => navigate('/admin/movies/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          + Add Movie
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>
      )}

      {deleteError && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{deleteError}</div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading movies...</p>
      ) : movies.length === 0 ? (
        <p className="text-gray-500">No movies found.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Title</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Genre</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Duration</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {movies.map((movie) => (
                <tr key={movie.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{movie.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{genreMap[movie.genreId] || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{movie.durationMinutes} min</td>
                  <td className="px-6 py-4 text-right text-sm space-x-2">
                    <button
                      onClick={() => navigate(`/admin/movies/${movie.id}/edit`)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    {deletingId === movie.id ? (
                      <span className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(movie.id)}
                          className="text-red-600 font-medium hover:underline"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="text-gray-500 hover:underline"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setDeletingId(movie.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminMoviePage
