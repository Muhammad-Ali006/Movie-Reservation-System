import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { CalendarCheck, Loader2, AlertCircle, Ticket, Pencil, XCircle, CheckCircle2, Clock } from 'lucide-react'
import api from '../utils/api'

const STATUS_STYLES = {
  CONFIRMED: { color: 'var(--color-success)', bg: 'rgba(34, 197, 94, 0.12)' },
  PENDING: { color: 'var(--color-warning)', bg: 'rgba(255, 193, 7, 0.12)' },
  CANCELLED: { color: 'var(--color-text-muted)', bg: 'rgba(140, 140, 140, 0.12)' },
}

function UserReservationsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const message = location.state?.message

  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const fetchReservations = () => {
    api.get('/reservations/my')
      .then(res => setReservations(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError('Failed to load your reservations'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchReservations()
  }, [])

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    })
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [h, m] = timeStr.split(':')
    const date = new Date()
    date.setHours(parseInt(h), parseInt(m))
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const formatPendingUntil = (pendingUntil) => {
    if (!pendingUntil) return ''
    const d = new Date(pendingUntil)
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const handleCancel = async (reservation) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return
    setBusyId(reservation.id)
    setActionError('')
    try {
      await api.put(`/reservations/${reservation.id}/cancel`)
      fetchReservations()
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to cancel reservation')
    } finally {
      setBusyId(null)
    }
  }

  const handleChangeSeats = (reservation) => {
    navigate(`/booking/${reservation.showtimeId}/change`, {
      state: { changeMode: true, reservationId: reservation.id }
    })
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 pt-20">
        <p style={{ color: 'var(--color-text-muted)' }}>Loading your bookings...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 pt-20">
        <div className="p-3 rounded text-sm" style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)' }}>
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 pt-20">
      <div className="flex items-center gap-3 mb-2">
        <CalendarCheck className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>My Bookings</h1>
      </div>
      <p className="mb-8" style={{ color: 'var(--color-text-muted)' }}>View and manage your movie reservations</p>

      {message && (
        <div className="flex items-center gap-2 p-3 rounded text-sm mb-6" style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', color: 'var(--color-success)' }}>
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {message}
        </div>
      )}

      {actionError && (
        <div className="flex items-center gap-2 p-3 rounded text-sm mb-6" style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {actionError}
        </div>
      )}

      {reservations.length === 0 ? (
        <div className="rounded-lg p-10 text-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <Ticket className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>No bookings yet</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            When you book seats, they will show up here.
          </p>
          <Link
            to="/movies"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
          >
            Browse Movies
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map(res => {
            const st = STATUS_STYLES[res.status] || STATUS_STYLES.CANCELLED
            const canAct = res.status !== 'CANCELLED'
            return (
              <div key={res.id} className="rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                        <Link to={`/movies/${res.movieSlug}`} style={{ color: 'inherit' }}>{res.movieTitle}</Link>
                      </h2>
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold"
                        style={{ color: st.color, backgroundColor: st.bg }}
                      >
                        {res.status === 'PENDING' && <Clock className="w-3 h-3" />}
                        {res.status}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      Booking #{res.id} · {formatDate(res.showDate)} · {formatTime(res.showTime)} · {res.screenName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                      PKR {parseFloat(res.totalAmount).toFixed(2)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {res.status === 'PENDING' && res.pendingUntil
                        ? <>Hold expires at {formatPendingUntil(res.pendingUntil)}</>
                        : `${res.seats ? res.seats.split(', ').length : 0} seats`}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: 'var(--color-bg)' }}>
                  <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    Seats
                  </p>
                  {res.seats ? (
                    <div className="flex flex-wrap gap-2">
                      {res.seats.split(', ').map((seat, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded text-xs font-semibold"
                          style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                        >
                          {seat}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>—</p>
                  )}
                </div>

                {canAct && (
                  <div className="flex flex-wrap gap-3">
                    {res.status === 'CONFIRMED' && res.ticketToken && (
                      <Link
                        to={`/tickets/${res.ticketToken}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                        style={{
                          backgroundColor: 'transparent',
                          color: 'var(--color-success)',
                          border: '1px solid var(--color-success)',
                        }}
                      >
                        <Ticket className="w-4 h-4" /> View Ticket
                      </Link>
                    )}
                    <button
                      onClick={() => handleChangeSeats(res)}
                      disabled={busyId === res.id}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                      style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
                    >
                      <Pencil className="w-4 h-4" /> Change Seats
                    </button>
                    <button
                      onClick={() => handleCancel(res)}
                      disabled={busyId === res.id}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                      style={{
                        backgroundColor: 'transparent',
                        color: 'var(--color-error)',
                        border: '1px solid var(--color-error)',
                        opacity: busyId === res.id ? 0.5 : 1,
                        cursor: busyId === res.id ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {busyId === res.id ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Cancelling...</>
                      ) : (
                        <><XCircle className="w-4 h-4" /> Cancel Booking</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default UserReservationsPage
