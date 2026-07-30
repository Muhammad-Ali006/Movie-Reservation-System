import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import api from '../utils/api'

function BookingConfirmationPage() {
  const { showtimeId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const selectedSeats = location.state?.selectedSeats || []

  const [showtime, setShowtime] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(null)
  const [confirmError, setConfirmError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)

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

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return
    setCancelling(true)
    try {
      await api.put(`/reservations/${confirmed.id}/cancel`)
      setCancelled(true)
    } catch (err) {
      setConfirmError(err.response?.data?.message || 'Failed to cancel reservation')
    } finally {
      setCancelling(false)
    }
  }

  const handleConfirm = async () => {
    setConfirming(true)
    setConfirmError('')
    try {
      const seatIds = selectedSeats.map(s => s.id)
      const res = await api.post('/reservations', { showtimeId: parseInt(showtimeId), seatIds })
      setConfirmed(res.data)
    } catch (err) {
      setConfirmError(err.response?.data?.message || 'Failed to complete booking')
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-6 py-8 pt-20">
        <p style={{ color: 'var(--color-text-muted)' }}>Loading booking details...</p>
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

  if (confirmed) {
    return (
      <div className="max-w-lg mx-auto px-6 py-8 pt-20">
        <div className="rounded-lg p-6 text-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          {cancelled ? (
            <>
              <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-warning)' }} />
              <h2 className="text-xl font-semibold mb-2">Reservation Cancelled</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                Your reservation has been cancelled. Your seats have been released.
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
                  <span style={{ color: 'var(--color-text-muted)' }}>Seats</span>
                  <span className="font-medium">
                    {selectedSeats.map(s => `${s.rowLabel}${s.seatNumber}`).join(', ')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--color-text-muted)' }}>Status</span>
                  <span className="font-semibold" style={{ color: 'var(--color-warning)' }}>CANCELLED</span>
                </div>
              </div>
              <Link
                to="/movies"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
              >
                Back to Movies
              </Link>
            </>
          ) : (
            <>
              <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-success)' }} />
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
                    ${parseFloat(confirmed.totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/movies"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
                >
                  Back to Movies
                </Link>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all"
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
            </>
          )}
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

      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
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
                  style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
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
              <span>${showtime ? parseFloat(showtime.pricePerSeat).toFixed(2) : '0.00'}</span>
            </div>
          </div>

          <div className="flex justify-between text-sm font-semibold pt-3 mt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
            <span>Total</span>
            <span style={{ color: 'var(--color-primary)' }}>${total.toFixed(2)}</span>
          </div>
        </div>

        {confirmError && (
          <div className="flex items-center gap-2 p-3 rounded text-sm mb-4" style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {confirmError}
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all"
          style={{
            backgroundColor: confirming ? 'var(--color-border)' : 'var(--color-primary)',
            color: confirming ? 'var(--color-text-muted)' : '#fff',
            cursor: confirming ? 'not-allowed' : 'pointer',
          }}
        >
          {confirming ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Confirm Booking'
          )}
        </button>
      </div>
    </div>
  )
}

export default BookingConfirmationPage
