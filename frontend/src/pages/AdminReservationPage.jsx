import { useState, useEffect } from 'react'
import { CalendarX2, Loader2, AlertCircle, CheckCircle, Monitor, XCircle, LayoutGrid } from 'lucide-react'
import api from '../utils/api'

function AdminReservationPage() {
  const [screens, setScreens] = useState([])
  const [selectedScreenId, setSelectedScreenId] = useState('')
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [cancellingId, setCancellingId] = useState(null)
  const [cancellingAll, setCancellingAll] = useState(false)

  const [showtimes, setShowtimes] = useState([])
  const [showtimesLoading, setShowtimesLoading] = useState(false)
  const [selectedMovieId, setSelectedMovieId] = useState('')
  const [selectedShowtimeId, setSelectedShowtimeId] = useState('')
  const [seats, setSeats] = useState([])
  const [seatsLoading, setSeatsLoading] = useState(false)
  const [seatsError, setSeatsError] = useState('')

  useEffect(() => {
    api.get('/screens')
      .then(res => setScreens(res.data))
      .catch(() => {})
  }, [])

  const fetchReservations = (screenId) => {
    setLoading(true)
    setError('')
    const params = screenId ? { screenId } : {}
    api.get('/admin/reservations', { params })
      .then(res => setReservations(res.data))
      .catch(() => setError('Failed to load reservations'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchReservations(selectedScreenId || null)
  }, [selectedScreenId])

  useEffect(() => {
    setSelectedMovieId('')
    setSelectedShowtimeId('')
    setSeats([])
    if (!selectedScreenId) {
      setShowtimes([])
      return
    }
    setShowtimesLoading(true)
    api.get('/admin/showtimes', { params: { screenId: selectedScreenId } })
      .then(res => setShowtimes(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setShowtimesLoading(false))
  }, [selectedScreenId])

  useEffect(() => {
    if (!selectedShowtimeId) {
      setSeats([])
      return
    }
    setSeatsLoading(true)
    setSeatsError('')
    api.get(`/admin/showtimes/${selectedShowtimeId}/seats`)
      .then(res => setSeats(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSeatsError('Failed to load seat layout'))
      .finally(() => setSeatsLoading(false))
  }, [selectedShowtimeId])

  const availableShows = [...new Map(
    showtimes.map(st => [st.movieId, { movieId: st.movieId, movieTitle: st.movieTitle }])
  ).values()]

  const availableTimes = selectedMovieId
    ? showtimes.filter(st => String(st.movieId) === String(selectedMovieId))
    : []

  const handleScreenChange = (e) => {
    setSelectedScreenId(e.target.value)
  }

  const handleCancel = async (id) => {
    if (!window.confirm(`Cancel reservation #${id}?`)) return
    setCancellingId(id)
    try {
      await api.put(`/reservations/${id}/cancel`)
      setReservations(prev => prev.map(r =>
        r.id === id ? { ...r, status: 'CANCELLED' } : r
      ))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel')
    } finally {
      setCancellingId(null)
    }
  }

  const handleCancelAll = async () => {
    const confirmedIds = reservations
      .filter(r => r.status === 'CONFIRMED' || r.status === 'PENDING')
      .map(r => r.id)
    if (confirmedIds.length === 0) return
    const screenName = screens.find(s => s.id === Number(selectedScreenId))?.name || 'selected screen'
    if (!window.confirm(`Cancel all ${confirmedIds.length} bookings for ${screenName}?`)) return
    setCancellingAll(true)
    try {
      await api.put('/admin/reservations/bulk-cancel', confirmedIds)
      setReservations(prev => prev.map(r =>
        confirmedIds.includes(r.id) ? { ...r, status: 'CANCELLED' } : r
      ))
      setMessage(`Cancelled ${confirmedIds.length} booking(s)`)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel all')
    } finally {
      setCancellingAll(null)
    }
  }

  const refreshSeats = () => {
    if (!selectedShowtimeId) return
    api.get(`/admin/showtimes/${selectedShowtimeId}/seats`)
      .then(res => setSeats(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
  }

  const handleSeatClick = async (seat) => {
    if (seat.status === 'AVAILABLE' || !seat.reservationId) return
    const label = `${seat.rowLabel}${seat.seatNumber}`
    const owner = seat.username || 'Unknown user'
    const amount = seat.totalAmount != null ? `, $${parseFloat(seat.totalAmount).toFixed(2)}` : ''
    if (!window.confirm(`Cancel ${owner}'s booking for seat ${label}${amount}?`)) return
    setCancellingId(seat.reservationId)
    try {
      await api.put(`/reservations/${seat.reservationId}/cancel`)
      setMessage(`Booking for seat ${label} cancelled`)
      refreshSeats()
      if (selectedScreenId) fetchReservations(selectedScreenId)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel')
    } finally {
      setCancellingId(null)
    }
  }

  const handleCancelAllShowtime = async () => {
    const ids = [...new Set(
      seats.filter(s => s.status !== 'AVAILABLE' && s.reservationId).map(s => s.reservationId)
    )]
    if (ids.length === 0) return
    const st = showtimes.find(x => String(x.id) === String(selectedShowtimeId))
    const label = st ? `${st.movieTitle} (${formatDate(st.showDate)} ${formatTime(st.showTime)})` : 'this showtime'
    if (!window.confirm(`Cancel all ${ids.length} booking(s) for ${label}?`)) return
    setCancellingAll(true)
    try {
      await api.put('/admin/reservations/bulk-cancel', ids)
      setMessage(`Cancelled ${ids.length} booking(s)`)
      refreshSeats()
      if (selectedScreenId) fetchReservations(selectedScreenId)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel all')
    } finally {
      setCancellingAll(null)
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

  const activeCount = reservations.filter(r => r.status === 'CONFIRMED' || r.status === 'PENDING').length

  const rows = seats.reduce((acc, seat) => {
    if (!acc[seat.rowLabel]) acc[seat.rowLabel] = []
    acc[seat.rowLabel].push(seat)
    return acc
  }, {})
  const rowLabels = Object.keys(rows).sort()

  const bookedCount = seats.filter(s => s.status === 'BOOKED').length
  const heldCount = seats.filter(s => s.status === 'HELD').length
  const availableCount = seats.filter(s => s.status === 'AVAILABLE').length

  const selectedShowtime = showtimes.find(x => String(x.id) === String(selectedShowtimeId))

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 pt-20">
      <div className="flex items-center gap-3 mb-6">
        <CalendarX2 className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Bookings</h1>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Monitor className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
          <select
            value={selectedScreenId}
            onChange={handleScreenChange}
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm appearance-none cursor-pointer"
            style={{
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
            }}
          >
            <option value="">All Screens</option>
            {screens.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.screenType})</option>
            ))}
          </select>
        </div>

        {activeCount > 0 && (
          <button
            onClick={handleCancelAll}
            disabled={cancellingAll}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              backgroundColor: cancellingAll ? 'var(--color-border)' : 'var(--color-error-light)',
              color: cancellingAll ? 'var(--color-text-muted)' : 'var(--color-error)',
              cursor: cancellingAll ? 'not-allowed' : 'pointer',
            }}
          >
            {cancellingAll ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Cancelling...</>
            ) : (
              <><XCircle className="w-4 h-4" /> Cancel All ({activeCount})</>
            )}
          </button>
        )}

        <button
          onClick={() => fetchReservations(selectedScreenId || null)}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
        >
          Refresh
        </button>
      </div>

      {selectedScreenId && (
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <LayoutGrid className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
            <select
              value={selectedMovieId}
              onChange={e => { setSelectedMovieId(e.target.value); setSelectedShowtimeId('') }}
              className="w-full pl-10 pr-4 py-2 rounded-lg text-sm appearance-none cursor-pointer"
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
            >
              <option value="">Select a show...</option>
              {availableShows.map(m => (
                <option key={m.movieId} value={m.movieId}>{m.movieTitle}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Monitor className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
            <select
              value={selectedShowtimeId}
              onChange={e => setSelectedShowtimeId(e.target.value)}
              disabled={!selectedMovieId}
              className="w-full pl-10 pr-4 py-2 rounded-lg text-sm appearance-none cursor-pointer"
              style={{
                backgroundColor: selectedMovieId ? 'var(--color-surface)' : 'var(--color-border)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                cursor: selectedMovieId ? 'pointer' : 'not-allowed',
              }}
            >
              <option value="">Select a time...</option>
              {availableTimes.map(st => (
                <option key={st.id} value={st.id}>
                  {formatDate(st.showDate)} · {formatTime(st.showTime)} · {st.screenName}
                </option>
              ))}
            </select>
          </div>

          {showtimesLoading && <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--color-text-muted)' }} />}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded text-sm mb-6" style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {message && (
        <div className="flex items-center gap-2 p-3 rounded text-sm mb-6" style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', color: 'var(--color-success)' }}>
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {message}
        </div>
      )}

      {selectedShowtimeId && (
        <div className="rounded-lg p-6 mb-8" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                {selectedShowtime?.movieTitle}
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {selectedShowtime?.screenName} ({selectedShowtime?.screenType}) · {selectedShowtime && formatDate(selectedShowtime.showDate)} {selectedShowtime && formatTime(selectedShowtime.showTime)}
              </p>
              {!seatsLoading && seats.length > 0 && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  {availableCount} available · {heldCount} held · {bookedCount} booked
                </p>
              )}
            </div>

            {!seatsLoading && seats.filter(s => s.status !== 'AVAILABLE' && s.reservationId).length > 0 && (
              <button
                onClick={handleCancelAllShowtime}
                disabled={cancellingAll}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  backgroundColor: cancellingAll ? 'var(--color-border)' : 'var(--color-error-light)',
                  color: cancellingAll ? 'var(--color-text-muted)' : 'var(--color-error)',
                  cursor: cancellingAll ? 'not-allowed' : 'pointer',
                }}
              >
                {cancellingAll ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Cancelling...</>
                ) : (
                  <><XCircle className="w-4 h-4" /> Cancel All (showtime)</>
                )}
              </button>
            )}
          </div>

          {seatsError && (
            <div className="flex items-center gap-2 p-3 rounded text-sm mb-4" style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {seatsError}
            </div>
          )}

          {seatsLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-text-muted)' }} />
            </div>
          )}

          {!seatsLoading && !seatsError && seats.length === 0 && (
            <div className="text-center py-16" style={{ color: 'var(--color-text-muted)' }}>
              <p>No seats found for this showtime.</p>
            </div>
          )}

          {!seatsLoading && !seatsError && seats.length > 0 && (
            <>
              <div className="text-center mb-6">
                <div className="mx-auto w-3/4 h-2 rounded-t-lg mb-1" style={{ backgroundColor: 'var(--color-border-light)' }} />
                <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Screen</span>
              </div>

              <div className="space-y-2 mb-6">
                {rowLabels.map(row => (
                  <div key={row} className="flex items-center gap-3 justify-center">
                    <span className="w-6 text-right text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{row}</span>
                    <div className="flex gap-1.5 flex-wrap justify-center">
                      {rows[row]
                        .sort((a, b) => parseInt(a.seatNumber) - parseInt(b.seatNumber))
                        .map(seat => {
                          let bg = 'var(--color-success)'
                          let textColor = '#000'
                          if (seat.status === 'HELD') { bg = 'var(--color-warning)'; textColor = '#000' }
                          else if (seat.status === 'BOOKED') { bg = 'var(--color-error)'; textColor = '#fff' }
                          const clickable = seat.status !== 'AVAILABLE' && seat.reservationId

                          return (
                            <button
                              key={seat.id}
                              onClick={() => handleSeatClick(seat)}
                              disabled={!clickable || cancellingId === seat.reservationId}
                              className="w-8 h-8 rounded text-xs font-medium transition-all"
                              style={{
                                backgroundColor: bg,
                                color: textColor,
                                cursor: clickable && cancellingId !== seat.reservationId ? 'pointer' : 'default',
                                opacity: cancellingId === seat.reservationId ? 0.5 : 1,
                              }}
                              title={seat.status === 'AVAILABLE'
                                ? `${row}${seat.seatNumber} — Available`
                                : `${row}${seat.seatNumber} — ${seat.status}${seat.username ? ` · ${seat.username}` : ''} (click to cancel)`}
                            >
                              {cancellingId === seat.reservationId ? <Loader2 className="w-3.5 h-3.5 mx-auto animate-spin" /> : seat.seatNumber}
                            </button>
                          )
                        })}
                    </div>
                    <span className="w-6 text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{row}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-center gap-6">
                {[
                  { label: 'Available', color: 'var(--color-success)' },
                  { label: 'Held (pending)', color: 'var(--color-warning)' },
                  { label: 'Booked', color: 'var(--color-error)' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
                    <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {!selectedShowtimeId && loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-text-muted)' }} />
        </div>
      )}

      {!selectedShowtimeId && !loading && reservations.length === 0 && !error && (
        <div className="text-center py-20" style={{ color: 'var(--color-text-muted)' }}>
          <CalendarX2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No bookings found</p>
          <p className="text-sm mt-1">Select a screen and a showtime to see the seat grid.</p>
        </div>
      )}

      {!selectedShowtimeId && !loading && reservations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reservations.map(r => (
            <div
              key={r.id}
              className="rounded-lg p-5 transition-all"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                opacity: r.status === 'CANCELLED' ? 0.6 : 1,
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base truncate" style={{ color: 'var(--color-text)' }}>
                    {r.movieTitle}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {r.screenName} · {formatDate(r.showDate)} {formatTime(r.showTime)}
                  </p>
                </div>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-semibold ml-3 flex-shrink-0"
                  style={{
                    backgroundColor: r.status === 'CONFIRMED'
                      ? 'var(--color-success)'
                      : r.status === 'PENDING'
                        ? 'var(--color-warning)'
                        : 'var(--color-border)',
                    color: r.status === 'CANCELLED' ? 'var(--color-text-muted)' : '#000',
                  }}
                >
                  {r.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>User</span>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{r.username}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Seats</span>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{r.seats}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Amount</span>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>${parseFloat(r.totalAmount).toFixed(2)}</p>
                </div>
              </div>

              {(r.status === 'CONFIRMED' || r.status === 'PENDING') && (
                <button
                  onClick={() => handleCancel(r.id)}
                  disabled={cancellingId === r.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: cancellingId === r.id ? 'var(--color-border)' : 'var(--color-error-light)',
                    color: cancellingId === r.id ? 'var(--color-text-muted)' : 'var(--color-error)',
                    cursor: cancellingId === r.id ? 'not-allowed' : 'pointer',
                  }}
                >
                  {cancellingId === r.id ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Cancelling</>
                  ) : 'Cancel Booking'}
                </button>
              )}

              {r.status === 'CANCELLED' && (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  Cancelled
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminReservationPage
