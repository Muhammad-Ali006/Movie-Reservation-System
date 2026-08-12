import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Loader2, Pencil, AlertCircle } from 'lucide-react'
import api from '../utils/api'

function SeatSelectionPage() {
  const { showtimeId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const changeMode = location.state?.changeMode
  const reservationId = location.state?.reservationId

  const [seats, setSeats] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const initialized = useRef(false)

  useEffect(() => {
    const url = changeMode
      ? `/showtimes/${showtimeId}/seats?heldReservationId=${reservationId}`
      : `/showtimes/${showtimeId}/seats`

    api.get(url)
      .then(res => {
        setSeats(res.data)
        if (changeMode && !initialized.current) {
          initialized.current = true
          setSelectedIds(new Set(res.data.filter(s => s.heldByMe).map(s => s.id)))
        }
      })
      .catch(() => setError('Failed to load seat layout'))
      .finally(() => setLoading(false))
  }, [showtimeId, changeMode, reservationId])

  const rows = seats.reduce((acc, seat) => {
    if (!acc[seat.rowLabel]) acc[seat.rowLabel] = []
    acc[seat.rowLabel].push(seat)
    return acc
  }, {})

  const rowLabels = Object.keys(rows).sort()

  const toggleSeat = (seatId, status, heldByMe) => {
    if (status !== 'AVAILABLE' && !heldByMe) return
    const next = new Set(selectedIds)
    if (next.has(seatId)) next.delete(seatId)
    else next.add(seatId)
    setSelectedIds(next)
  }

  const handleContinue = () => {
    const selectedSeats = seats.filter(s => selectedIds.has(s.id))
    navigate(`/booking/${showtimeId}/confirm`, {
      state: { selectedSeats }
    })
  }

  const handleChangeSeats = async () => {
    setSubmitting(true)
    setSubmitError('')
    try {
      await api.put(`/reservations/${reservationId}/seats`, {
        seatIds: Array.from(selectedIds)
      })
      navigate('/my-bookings', { state: { message: 'Your seats were updated successfully.' } })
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to update seats')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 pt-20">
        <p style={{ color: 'var(--color-text-muted)' }}>Loading seat layout...</p>
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

  const backLink = changeMode ? (
    <Link to="/my-bookings" className="flex items-center gap-1 text-sm mb-6" style={{ color: 'var(--color-primary)' }}>
      <ArrowLeft className="w-4 h-4" /> Back to My Bookings
    </Link>
  ) : (
    <Link to="/movies" className="flex items-center gap-1 text-sm mb-6" style={{ color: 'var(--color-primary)' }}>
      <ArrowLeft className="w-4 h-4" /> Back to Movies
    </Link>
  )

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 pt-20">
      {backLink}

      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <h2 className="text-xl font-semibold mb-2 text-center" style={{ color: 'var(--color-text)' }}>
          {changeMode ? 'Change Your Seats' : 'Select Your Seats'}
        </h2>
        {changeMode && (
          <p className="text-center text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
            Your current seats are pre-selected. Pick your new seats and confirm.
          </p>
        )}

        <div className="text-center mb-8">
          <div className="mx-auto w-3/4 h-2 rounded-t-lg mb-1" style={{ backgroundColor: 'var(--color-border-light)' }} />
          <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Screen</span>
        </div>

        <div className="space-y-2 mb-8">
          {rowLabels.map(row => (
            <div key={row} className="flex items-center gap-2 sm:gap-3 justify-center">
              <span className="w-6 text-right text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{row}</span>
              <div className="flex gap-1 sm:gap-1.5 overflow-x-auto">
                {rows[row]
                  .sort((a, b) => parseInt(a.seatNumber) - parseInt(b.seatNumber))
                  .map(seat => {
                    const isBooked = seat.status === 'BOOKED' || seat.status === 'HELD'
                    const isSelected = selectedIds.has(seat.id)
                    let bg = isBooked ? 'var(--color-border)' : 'var(--color-success)'
                    if (isSelected) bg = 'var(--color-primary)'

                    return (
                      <button
                        key={seat.id}
                        disabled={isBooked}
                        onClick={() => toggleSeat(seat.id, seat.status, seat.heldByMe)}
                        className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded text-[10px] sm:text-xs font-medium transition-all"
                        style={{
                          backgroundColor: bg,
                          opacity: isBooked ? 0.4 : 1,
                          cursor: isBooked ? 'not-allowed' : 'pointer',
                        }}
                        title={`${row}${seat.seatNumber} — ${seat.status}`}
                      >
                        {seat.seatNumber}
                      </button>
                    )
                  })}
              </div>
              <span className="w-6 text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{row}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-6 mb-6">
          {[
            { label: 'Available', color: 'var(--color-success)' },
            { label: 'Selected', color: 'var(--color-primary)' },
            { label: 'Held / Booked', color: 'var(--color-border)' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{item.label}</span>
            </div>
          ))}
        </div>

        {submitError && (
          <div className="flex items-center gap-2 p-3 rounded text-sm mb-4" style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {submitError}
          </div>
        )}

        <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {selectedIds.size === 0 ? 'No seats selected' : `${selectedIds.size} seat${selectedIds.size > 1 ? 's' : ''} selected`}
          </span>
          {changeMode ? (
            <button
              onClick={handleChangeSeats}
              disabled={submitting || selectedIds.size === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: selectedIds.size > 0 && !submitting ? 'var(--color-primary)' : 'var(--color-border)',
                color: selectedIds.size > 0 && !submitting ? '#fff' : 'var(--color-text-muted)',
                cursor: selectedIds.size > 0 && !submitting ? 'pointer' : 'not-allowed',
              }}>
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>
              ) : (
                <><Pencil className="w-4 h-4" /> Update Seats</>
              )}
            </button>
          ) : (
            <button
              onClick={handleContinue}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: selectedIds.size > 0 ? 'var(--color-primary)' : 'var(--color-border)',
                color: selectedIds.size > 0 ? '#fff' : 'var(--color-text-muted)',
                cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
              }}>
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default SeatSelectionPage
