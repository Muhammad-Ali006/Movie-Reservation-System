import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle, AlertCircle, Loader2, Clock, Pencil, Ticket } from 'lucide-react'
import api from '../utils/api'

function BookingConfirmationPage() {
  const { showtimeId } = useParams()
  const location = useLocation()
  const selectedSeats = location.state?.selectedSeats || []

  const [showtime, setShowtime] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [hold, setHold] = useState(null)
  const [creatingHold, setCreatingHold] = useState(false)
  const [holdError, setHoldError] = useState('')

  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')
  const [confirmed, setConfirmed] = useState(null)

  const [secondsLeft, setSecondsLeft] = useState(null)
  const [expired, setExpired] = useState(false)

  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)

  const timerRef = useRef(null)

  useEffect(() => {
    if (selectedSeats.length === 0) {
      setLoading(false)
      return
    }
    api.get(`/showtimes/${showtimeId}`)
      .then(res => setShowtime(res.data))
      .catch(() => setError('Failed to load showtime details'))
      .finally(() => setLoading(false))
  }, [showtimeId, selectedSeats.length])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startCountdown = (pendingUntil) => {
    const end = new Date(pendingUntil).getTime()
    const tick = () => {
      const left = Math.max(0, Math.floor((end - Date.now()) / 1000))
      setSecondsLeft(left)
      if (left <= 0) {
        clearInterval(timerRef.current)
        setExpired(true)
      }
    }
    tick()
    timerRef.current = setInterval(tick, 1000)
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  const formatTime = (timeStr) => {
    const [h, m] = timeStr.split(':')
    const date = new Date()
    date.setHours(parseInt(h), parseInt(m))
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const handleCreateHold = async () => {
    setCreatingHold(true)
    setHoldError('')
    setPayError('')
    try {
      const seatIds = selectedSeats.map(s => s.id)
      const res = await api.post('/reservations', { showtimeId: parseInt(showtimeId), seatIds })
      setHold(res.data)
      startCountdown(res.data.pendingUntil)
    } catch (err) {
      setHoldError(err.response?.data?.message || 'Failed to hold seats')
    } finally {
      setCreatingHold(false)
    }
  }

  const handlePay = async () => {
    setPaying(true)
    setPayError('')
    try {
      const res = await api.post(`/reservations/${hold.id}/confirm`)
      if (timerRef.current) clearInterval(timerRef.current)
      setConfirmed(res.data)
    } catch (err) {
      const msg = err.response?.data?.message
      setPayError(msg || 'Failed to complete booking')
      if (msg && msg.toLowerCase().includes('expired')) {
        if (timerRef.current) clearInterval(timerRef.current)
        setExpired(true)
      }
    } finally {
      setPaying(false)
    }
  }

  const handleCancelHold = async () => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return
    setCancelling(true)
    try {
      await api.put(`/reservations/${hold.id}/cancel`)
      if (timerRef.current) clearInterval(timerRef.current)
      setCancelled(true)
    } catch (err) {
      setHoldError(err.response?.data?.message || 'Failed to cancel reservation')
    } finally {
      setCancelling(false)
    }
  }

  const handleCancelConfirmed = async () => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return
    setCancelling(true)
    try {
      await api.put(`/reservations/${confirmed.id}/cancel`)
      setCancelled(true)
    } catch (err) {
      setPayError(err.response?.data?.message || 'Failed to cancel reservation')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-6 py-8 pt-20">
        <div className="flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading booking details...
        </div>
      </div>
    )
  }

  if (selectedSeats.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-6 py-8 pt-20">
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />
            <span className="font-medium">No seats selected</span>
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Please select your seats before proceeding to confirmation.
          </p>
          <Link
            to={`/booking/${showtimeId}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Seat Selection
          </Link>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-6 py-8 pt-20">
        <div className="p-3 rounded text-sm" style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)' }}>
          {error}
        </div>
      </div>
    )
  }

  if (confirmed && !cancelled) {
    return (
      <div className="max-w-lg mx-auto px-6 py-8 pt-20">
        <div className="rounded-lg p-6 text-center animate-fade-in" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <CheckCircle className="w-12 h-12 mx-auto mb-4 animate-scale-pop" style={{ color: 'var(--color-success)' }} />
          <h2 className="text-xl font-semibold mb-2">Booking Confirmed!</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            Your reservation has been confirmed successfully.
          </p>

          <div className="rounded-lg p-4 mb-6 text-left space-y-2" style={{ backgroundColor: 'var(--color-bg)' }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-muted)' }}>Reservation ID</span>
              <span className="font-medium">#{confirmed.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-muted)' }}>Movie</span>
              <span className="font-medium">{showtime?.movieTitle}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-muted)' }}>Date</span>
              <span className="font-medium">{showtime ? formatDate(showtime.showDate) : ''}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-muted)' }}>Time</span>
              <span className="font-medium">{showtime ? formatTime(showtime.showTime) : ''}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-muted)' }}>Screen</span>
              <span className="font-medium">{showtime?.screenName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-muted)' }}>Seats</span>
              <span className="font-medium">
                {selectedSeats.map(s => `${s.rowLabel}${s.seatNumber}`).join(', ')}
              </span>
            </div>
            <div className="flex justify-between text-sm pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Total Paid</span>
              <span className="font-semibold" style={{ color: 'var(--color-success)' }}>
                PKR {parseFloat(confirmed.totalAmount).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
            {confirmed.ticketToken && (
              <Link
                to={`/tickets/${confirmed.ticketToken}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--color-success)',
                  border: '1px solid var(--color-success)',
                }}
              >
                <Ticket className="w-4 h-4" /> View Ticket
              </Link>
            )}
            <Link
              to="/movies"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
            >
              Back to Movies
            </Link>
            <Link
              to={`/booking/${showtimeId}/change`}
              state={{ changeMode: true, reservationId: confirmed.id }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--color-accent)',
                border: '1px solid var(--color-accent)',
              }}
            >
              <Pencil className="w-4 h-4" /> Change Seats
            </Link>
            <button
              onClick={handleCancelConfirmed}
              disabled={cancelling}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: 'transparent',
                color: cancelling ? 'var(--color-text-muted)' : 'var(--color-error)',
                border: '1px solid var(--color-error)',
                cursor: cancelling ? 'not-allowed' : 'pointer',
                opacity: cancelling ? 0.5 : 1,
              }}
            >
              {cancelling ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Cancelling...</>
              ) : 'Cancel Reservation'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (cancelled) {
    return (
      <div className="max-w-lg mx-auto px-6 py-8 pt-20">
        <div className="rounded-lg p-6 text-center animate-fade-in" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-warning)' }} />
          <h2 className="text-xl font-semibold mb-2">Reservation Cancelled</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            Your reservation has been cancelled. Your seats have been released.
          </p>
          <Link
            to="/movies"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
          >
            Back to Movies
          </Link>
        </div>
      </div>
    )
  }

  if (hold && !expired) {
    const total = hold.seatIds.length * parseFloat(showtime?.pricePerSeat || 0)
    return (
      <div className="max-w-lg mx-auto px-6 py-8 pt-20">
        <div className="rounded-lg p-6 text-center animate-fade-in" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <Clock className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-warning)' }} />
          <h2 className="text-xl font-semibold mb-2">Seats Held!</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Your seats are reserved. Complete your booking within the time limit.
          </p>

          <div className="text-4xl font-bold mb-6" style={{ color: 'var(--color-primary)' }}>
            {formatCountdown(secondsLeft ?? 0)}
          </div>

          <div className="rounded-lg p-4 mb-6 text-left space-y-2" style={{ backgroundColor: 'var(--color-bg)' }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-muted)' }}>Reservation ID</span>
              <span className="font-medium">#{hold.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-muted)' }}>Movie</span>
              <span className="font-medium">{showtime?.movieTitle}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-muted)' }}>Seats</span>
              <span className="font-medium">{selectedSeats.map(s => `${s.rowLabel}${s.seatNumber}`).join(', ')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-muted)' }}>Total</span>
              <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>PKR {total.toFixed(2)}</span>
            </div>
          </div>

          {payError && (
            <div className="flex items-center gap-2 p-3 rounded text-sm mb-4 animate-slide-down" style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {payError}
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={paying}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all mb-3"
            style={{
              backgroundColor: paying ? 'var(--color-border)' : 'var(--color-success)',
              color: paying ? 'var(--color-text-muted)' : '#fff',
              cursor: paying ? 'not-allowed' : 'pointer',
            }}
          >
            {paying ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
            ) : (
              'Complete Booking'
            )}
          </button>

          <button
            onClick={handleCancelHold}
            disabled={cancelling}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              backgroundColor: 'transparent',
              color: cancelling ? 'var(--color-text-muted)' : 'var(--color-error)',
              border: '1px solid var(--color-error)',
              cursor: cancelling ? 'not-allowed' : 'pointer',
              opacity: cancelling ? 0.5 : 1,
            }}
          >
            {cancelling ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Cancelling...</>
            ) : 'Cancel Hold'}
          </button>
        </div>
      </div>
    )
  }

  if (expired) {
    return (
      <div className="max-w-lg mx-auto px-6 py-8 pt-20">
        <div className="rounded-lg p-6 text-center animate-fade-in" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-warning)' }} />
          <h2 className="text-xl font-semibold mb-2">Hold Expired</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            The 2-minute window has passed and your seats were released. Please select your seats again.
          </p>
          <Link
            to={`/booking/${showtimeId}`}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Seat Selection
          </Link>
        </div>
      </div>
    )
  }

  const total = showtime ? selectedSeats.length * parseFloat(showtime.pricePerSeat) : 0

  return (
    <div className="max-w-lg mx-auto px-6 py-8 pt-20">
      <Link
        to={`/booking/${showtimeId}`}
        className="flex items-center gap-1 text-sm mb-6"
        style={{ color: 'var(--color-primary)' }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to Seat Selection
      </Link>

      <div className="rounded-lg p-6 animate-fade-in" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <h2 className="text-xl font-semibold mb-6">Confirm Your Booking</h2>

        {showtime && (
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-muted)' }}>Movie</span>
              <span className="font-medium">{showtime.movieTitle}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-muted)' }}>Date</span>
              <span className="font-medium">{formatDate(showtime.showDate)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-muted)' }}>Time</span>
              <span className="font-medium">{formatTime(showtime.showTime)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-muted)' }}>Screen</span>
              <span className="font-medium">{showtime.screenName}</span>
            </div>
          </div>
        )}

        <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: 'var(--color-bg)' }}>
          <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
            Selected Seats
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedSeats
              .sort((a, b) => a.rowLabel.localeCompare(b.rowLabel) || parseInt(a.seatNumber) - parseInt(b.seatNumber))
              .map(seat => (
                <span
                  key={seat.id}
                  className="px-3 py-1 rounded text-xs font-semibold"
                  style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}
                >
                  {seat.rowLabel}{seat.seatNumber}
                </span>
              ))}
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-text-muted)' }}>
                Price per seat ({selectedSeats.length} {selectedSeats.length === 1 ? 'seat' : 'seats'})
              </span>
              <span>PKR {showtime ? parseFloat(showtime.pricePerSeat).toFixed(2) : '0.00'}</span>
            </div>
          </div>

          <div className="flex justify-between text-sm font-semibold pt-3 mt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
            <span>Total</span>
            <span style={{ color: 'var(--color-primary)' }}>PKR {total.toFixed(2)}</span>
          </div>
        </div>

          {holdError && (
            <div className="flex items-center gap-2 p-3 rounded text-sm mb-4 animate-slide-down" style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {holdError}
          </div>
        )}

        <button
          onClick={handleCreateHold}
          disabled={creatingHold}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all"
          style={{
            backgroundColor: creatingHold ? 'var(--color-border)' : 'var(--color-primary)',
            color: creatingHold ? 'var(--color-text-muted)' : '#fff',
            cursor: creatingHold ? 'not-allowed' : 'pointer',
          }}
        >
          {creatingHold ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Holding Seats...
            </>
          ) : (
            'Confirm Booking'
          )}
        </button>

        <p className="text-xs text-center mt-4" style={{ color: 'var(--color-text-muted)' }}>
          Your seats will be held for 2 minutes. Complete your booking before the timer runs out.
        </p>
      </div>
    </div>
  )
}

export default BookingConfirmationPage
