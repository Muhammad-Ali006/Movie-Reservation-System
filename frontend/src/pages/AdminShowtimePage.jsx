import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, Loader2, CheckCircle, AlertCircle, Pencil, Trash2, X, ArrowLeft, Search } from 'lucide-react'
import api from '../utils/api'

function SearchableMovieSelect({ movies, value, onChange, placeholder, showAllOption }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const selected = movies.find(m => String(m.id) === String(value))

  const filtered = query.trim()
    ? movies.filter(m => m.title.toLowerCase().includes(query.toLowerCase()))
    : movies

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (id) => {
    onChange(id)
    setQuery('')
    setOpen(false)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
    setQuery('')
    inputRef.current?.focus()
  }

  const handleFocus = () => {
    setOpen(true)
    setQuery('')
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className="relative flex items-center cursor-pointer"
        onClick={() => { setOpen(true); inputRef.current?.focus() }}
      >
        <Search className="w-4 h-4 absolute left-3 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
        <input
          ref={inputRef}
          type="text"
          value={open ? query : (selected ? selected.title : '')}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={handleFocus}
          placeholder={selected && !open ? selected.title : (placeholder || 'Search or select a movie...')}
          readOnly={!open && !!selected}
          className="w-full pl-10 pr-9 py-2.5 rounded-lg text-sm"
          style={{
            backgroundColor: 'var(--color-bg)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            cursor: 'text',
          }}
        />
        {(value || query) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (
        <div
          className="absolute z-50 w-full mt-1 rounded-lg max-h-56 overflow-auto animate-slide-down"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          {showAllOption && (
            <button
              type="button"
              onClick={() => handleSelect('')}
              className="w-full text-left px-4 py-2.5 text-sm transition-all"
              style={{
                color: !value ? 'var(--color-primary)' : 'var(--color-text)',
                backgroundColor: !value ? 'rgba(229, 9, 20, 0.08)' : 'transparent',
                fontWeight: !value ? 600 : 400,
              }}
              onMouseEnter={e => { if (value) e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)' }}
              onMouseLeave={e => { if (value) e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              All Movies
            </button>
          )}
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              No movies found
            </p>
          ) : (
            filtered.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelect(String(m.id))}
                className="w-full text-left px-4 py-2.5 text-sm transition-all"
                style={{
                  color: String(m.id) === String(value) ? 'var(--color-primary)' : 'var(--color-text)',
                  backgroundColor: String(m.id) === String(value) ? 'rgba(229, 9, 20, 0.08)' : 'transparent',
                  fontWeight: String(m.id) === String(value) ? 600 : 400,
                }}
                onMouseEnter={e => { if (String(m.id) !== String(value)) e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)' }}
                onMouseLeave={e => { if (String(m.id) !== String(value)) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                {m.title}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

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

  const [showtimes, setShowtimes] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [message, setMessage] = useState('')
  const [editing, setEditing] = useState(null)
  const [movieFilter, setMovieFilter] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const loadShowtimes = (filterMovieId) => {
    setListLoading(true)
    setListError('')
    const params = filterMovieId ? { movieId: filterMovieId } : {}
    api.get('/admin/showtimes', { params })
      .then(res => setShowtimes(Array.isArray(res.data) ? res.data : []))
      .catch(() => setListError('Failed to load showtimes'))
      .finally(() => setListLoading(false))
  }

  useEffect(() => {
    Promise.all([
      api.get('/movies?page=0&size=100'),
      api.get('/screens'),
      api.get('/admin/showtimes')
    ]).then(([moviesRes, screensRes, showtimesRes]) => {
      const movieList = moviesRes.data.content || moviesRes.data
      setMovies(Array.isArray(movieList) ? movieList : [])
      setScreens(Array.isArray(screensRes.data) ? screensRes.data : [])
      setShowtimes(Array.isArray(showtimesRes.data) ? showtimesRes.data : [])
    }).catch(() => {
      setError('Failed to load data')
    }).finally(() => {
      setLoading(false)
      setListLoading(false)
    })
  }, [])

  useEffect(() => {
    loadShowtimes(movieFilter || null)
  }, [movieFilter])

  const resetForm = () => {
    setMovieId('')
    setScreenId('')
    setShowDate('')
    setShowTime('')
    setPrice('')
    setEditing(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!movieId) { setError('Please select a movie'); return }
    if (!screenId) { setError('Please select a screen'); return }
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      if (editing) {
        await api.put(`/admin/showtimes/${editing.id}`, {
          movieId: parseInt(movieId),
          screenId: parseInt(screenId),
          showDate,
          showTime,
          pricePerSeat: parseFloat(price)
        })
        setMessage('Showtime updated successfully')
      } else {
        await api.post('/admin/showtimes', {
          movieId: parseInt(movieId),
          screenId: parseInt(screenId),
          showDate,
          showTime,
          pricePerSeat: parseFloat(price)
        })
        setMessage('Showtime created successfully')
      }
      resetForm()
      loadShowtimes(movieFilter || null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save showtime')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (showtime) => {
    setEditing(showtime)
    setMovieId(showtime.movieId)
    setScreenId(showtime.screenId)
    setShowDate(showtime.showDate)
    setShowTime(showtime.showTime)
    setPrice(showtime.pricePerSeat)
    setError('')
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete showtime #${id}? This cannot be undone.`)) return
    setDeletingId(id)
    setError('')
    setMessage('')
    try {
      await api.delete(`/admin/showtimes/${id}`)
      setMessage('Showtime deleted successfully')
      loadShowtimes(movieFilter || null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete showtime')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [h, m] = timeStr.split(':')
    const date = new Date()
    date.setHours(parseInt(h), parseInt(m))
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const today = new Date().toISOString().split('T')[0]

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 pt-20">
        <div className="flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 pt-20">
      <Link to="/admin" className="flex items-center gap-1 text-sm mb-1" style={{ color: 'var(--color-accent)' }}>
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>
      <div className="flex items-center gap-3 mb-8">
        <CalendarClock className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Manage Showtimes</h1>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded text-sm mb-6 animate-slide-down" style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {message && (
        <div className="flex items-center gap-2 p-3 rounded text-sm mb-6 animate-slide-down" style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', color: 'var(--color-success)' }}>
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {message}
        </div>
      )}

      {editing && (
        <div className="flex items-center justify-between p-3 rounded text-sm mb-4 animate-slide-down" style={{ backgroundColor: 'rgba(255, 193, 7, 0.12)', color: 'var(--color-warning)' }}>
          <span>Editing showtime #{editing.id} — {editing.movieTitle} ({formatDate(editing.showDate)} {formatTime(editing.showTime)}). Changing the screen regenerates the seat layout.</span>
          <button onClick={resetForm} className="flex items-center gap-1 font-semibold hover:underline" style={{ color: 'var(--color-warning)' }}>
            <X className="w-4 h-4" /> Cancel
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-lg p-6 space-y-5 mb-10" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
          {editing ? 'Update Showtime' : 'Create Showtime'}
        </h2>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Movie</label>
          <SearchableMovieSelect
            movies={movies}
            value={movieId}
            onChange={setMovieId}
            placeholder="Search or select a movie..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Screen</label>
          <select
            value={screenId}
            onChange={e => setScreenId(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--color-bg)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
            }}
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
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Price per Seat (PKR)</label>
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
            <><Loader2 className="w-4 h-4 animate-spin" /> {editing ? 'Updating...' : 'Creating...'}</>
          ) : editing ? 'Update Showtime' : 'Create Showtime'}
        </button>
      </form>

      <div className="flex items-center justify-between mb-4 gap-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>All Showtimes</h2>
        <div className="flex-1 max-w-xs">
          <SearchableMovieSelect
            movies={movies}
            value={movieFilter}
            onChange={setMovieFilter}
            placeholder="All Movies"
            showAllOption
          />
        </div>
      </div>

      {listError && (
        <div className="flex items-center gap-2 p-3 rounded text-sm mb-6 animate-slide-down" style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {listError}
        </div>
      )}

      {listLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-text-muted)' }} />
        </div>
      )}

      {!listLoading && showtimes.length === 0 && (
        <div className="text-center py-16" style={{ color: 'var(--color-text-muted)' }}>
          <p className="text-lg font-medium">No showtimes found</p>
          <p className="text-sm mt-1">Create one above.</p>
        </div>
      )}

      {!listLoading && showtimes.length > 0 && (
        <div className="space-y-3">
          {showtimes.map(st => {
            const locked = st.activeBookings > 0
            return (
              <div
                key={st.id}
                className="rounded-lg p-5 flex items-center justify-between gap-4 flex-wrap"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate" style={{ color: 'var(--color-text)' }}>{st.movieTitle}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                      {st.screenName} ({st.screenType})
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {formatDate(st.showDate)} · {formatTime(st.showTime)} · PKR {parseFloat(st.pricePerSeat).toFixed(2)}/seat
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    {st.availableSeats} of {st.totalSeats} seats available
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {locked && (
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-semibold"
                      style={{ backgroundColor: 'rgba(255, 193, 7, 0.12)', color: 'var(--color-warning)' }}
                      title="Cancel the active bookings first to edit or delete this showtime"
                    >
                      {st.activeBookings} active booking{st.activeBookings > 1 ? 's' : ''}
                    </span>
                  )}

                  <button
                    onClick={() => handleEdit(st)}
                    disabled={locked}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all"
                    style={{
                      backgroundColor: locked ? 'var(--color-border)' : 'var(--color-surface)',
                      color: locked ? 'var(--color-text-muted)' : 'var(--color-text)',
                      border: '1px solid var(--color-border)',
                      cursor: locked ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={e => { if (!locked) e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)' }}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = locked ? 'var(--color-border)' : 'var(--color-surface)'}
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>

                  <button
                    onClick={() => handleDelete(st.id)}
                    disabled={locked || deletingId === st.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all"
                    style={{
                      backgroundColor: locked ? 'var(--color-border)' : 'var(--color-surface)',
                      color: locked ? 'var(--color-text-muted)' : 'var(--color-text)',
                      cursor: locked || deletingId === st.id ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={e => { if (!locked) e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)' }}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = locked ? 'var(--color-border)' : 'var(--color-surface)'}
                  >
                    {deletingId === st.id ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Deleting</>
                    ) : (
                      <><Trash2 className="w-3.5 h-3.5" /> Delete</>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AdminShowtimePage
