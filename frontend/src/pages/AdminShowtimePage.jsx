import { useState, useEffect } from 'react'
import { CalendarClock, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../utils/api'

function AdminShowtimePage() {
  const [movies, setMovies] = useState([])
  const [screens, setScreens] = useState([])
  const [movieId, setMovieId] = useState('')
  const [screenId, setScreenId] = useState('')
  const [showDate, setShowDate] = useState('')
  const [showTime, setShowTime] = useState('')
  const [price, setPrice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/movies?page=0&size=200'),
      api.get('/screens')
    ]).then(([moviesRes, screensRes]) => {
      const movieList = moviesRes.data.content || moviesRes.data
      setMovies(Array.isArray(movieList) ? movieList : [])
      setScreens(Array.isArray(screensRes.data) ? screensRes.data : [])
    }).catch(() => {
      setError('Failed to load movies or screens')
    }).finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setResult(null)
    try {
      const res = await api.post('/admin/showtimes', {
        movieId: parseInt(movieId),
        screenId: parseInt(screenId),
        showDate,
        showTime,
        pricePerSeat: parseFloat(price)
      })
      setResult(res.data)
      setMovieId('')
      setScreenId('')
      setShowDate('')
      setShowTime('')
      setPrice('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create showtime')
    } finally {
      setSubmitting(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8 pt-20">
        <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 pt-20">
      <div className="flex items-center gap-3 mb-8">
        <CalendarClock className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Create Showtime</h1>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded text-sm mb-6" style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-lg p-6 mb-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
            <span className="font-semibold" style={{ color: 'var(--color-success)' }}>Showtime Created!</span>
          </div>
          <div className="space-y-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <p>Screen: {result.screenName} ({result.screenType})</p>
            <p>Date: {result.showDate}</p>
            <p>Time: {result.showTime}</p>
            <p>Price: ${parseFloat(result.pricePerSeat).toFixed(2)}</p>
            <p>Seats generated: {result.seatsGenerated}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-lg p-6 space-y-5" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Movie</label>
          <select
            value={movieId}
            onChange={e => setMovieId(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
          >
            <option value="">Select a movie</option>
            {movies.map(m => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Screen</label>
          <select
            value={screenId}
            onChange={e => setScreenId(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
          >
            <option value="">Select a screen</option>
            {screens.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.screenType} — {s.totalSeats} seats)</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Date</label>
            <input
              type="date"
              value={showDate}
              onChange={e => setShowDate(e.target.value)}
              min={today}
              required
              className="w-full px-3 py-2.5 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Time</label>
            <input
              type="time"
              value={showTime}
              onChange={e => setShowTime(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Price per Seat ($)</label>
          <input
            type="number"
            step="0.50"
            min="0"
            value={price}
            onChange={e => setPrice(e.target.value)}
            required
            placeholder="12.50"
            className="w-full px-3 py-2.5 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all"
          style={{
            backgroundColor: submitting ? 'var(--color-border)' : 'var(--color-primary)',
            color: submitting ? 'var(--color-text-muted)' : '#fff',
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
          ) : 'Create Showtime'}
        </button>
      </form>
    </div>
  )
}

export default AdminShowtimePage
