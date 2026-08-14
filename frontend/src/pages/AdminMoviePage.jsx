import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, AlertCircle } from 'lucide-react'
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
    Promise.all([api.get('/movies'), api.get('/genres')])
      .then(([moviesRes, genresRes]) => {
        setMovies(Array.isArray(moviesRes.data) ? moviesRes.data : (moviesRes.data.content || []))
        setGenres(genresRes.data)
      }).catch(() => setError('Failed to load movies'))
      .finally(() => setLoading(false))
  }, [])

  const genreMap = Object.fromEntries(genres.map(g => [g.id, g.name]))

  const handleDelete = async (id) => {
    setDeleteError('')
    try {
      await api.delete(`/admin/movies/${id}`)
      setDeletingId(null)
      setMovies(movies.filter(m => m.id !== id))
    } catch (err) {
      const status = err.response?.status
      const msg = err.response?.data?.message
      if (status === 401 || status === 403) {
        setDeleteError('Session expired. Please log in again.')
      } else {
        setDeleteError(msg || `Failed to delete movie (error ${status || 'network'})`)
      }
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 pt-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <Link to="/admin" className="flex items-center gap-1 text-sm mb-1" style={{ color: 'var(--color-accent)' }}>
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-text)' }}>Manage Movies</h1>
        </div>
        <button onClick={() => navigate('/admin/movies/new')}
          className="flex items-center gap-1 text-white px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: 'var(--color-primary)' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}>
          <Plus className="w-4 h-4" /> Add Movie
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded mb-4 text-sm" style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)' }}>
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}
      {deleteError && (
        <div className="flex items-center gap-2 p-3 rounded mb-4 text-sm" style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)' }}>
          <AlertCircle className="w-4 h-4" /> {deleteError}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Loading movies...</p>
      ) : movies.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No movies found.</p>
      ) : (
        <div className="rounded-lg overflow-x-auto" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <table className="w-full min-w-[500px]">
            <thead style={{ backgroundColor: 'var(--color-bg)' }}>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th className="text-left px-6 py-3 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Title</th>
                <th className="text-left px-6 py-3 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Genres</th>
                <th className="text-left px-6 py-3 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Duration</th>
                <th className="text-right px-6 py-3 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {movies.map((movie) => (
                <tr key={movie.id} style={{ borderBottom: '1px solid var(--color-border)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td className="px-6 py-4 text-sm font-medium" style={{ color: 'var(--color-text)' }}>{movie.title}</td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {movie.genreIds?.map(gid => genreMap[gid]).filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{movie.durationMinutes} min</td>
                  <td className="px-6 py-4 text-right text-sm space-x-2">
                    <button onClick={() => navigate(`/admin/movies/${movie.slug}/edit`)} style={{ color: 'var(--color-text-secondary)' }} className="hover:underline"
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}>Edit</button>
                    {deletingId === movie.id ? (
                      <span className="inline-flex items-center gap-1">
                        <button onClick={() => handleDelete(movie.id)} className="font-medium hover:underline" style={{ color: 'var(--color-text-secondary)' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}>Confirm</button>
                        <button onClick={() => setDeletingId(null)} className="hover:underline" style={{ color: 'var(--color-text-muted)' }}>Cancel</button>
                      </span>
                    ) : (
                      <button onClick={() => setDeletingId(movie.id)} className="hover:underline" style={{ color: 'var(--color-text-secondary)' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}>Delete</button>
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
