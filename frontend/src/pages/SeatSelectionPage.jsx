import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import api from '../utils/api'

function SeatSelectionPage() {
  const { showtimeId } = useParams()
  const navigate = useNavigate()
  const [seats, setSeats] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/showtimes/${showtimeId}/seats`)
      .then(res => setSeats(res.data))
      .catch(() => setError('Failed to load seat layout'))
      .finally(() => setLoading(false))
  }, [showtimeId])

  const rows = seats.reduce((acc, seat) => {
    if (!acc[seat.rowLabel]) acc[seat.rowLabel] = []
    acc[seat.rowLabel].push(seat)
    return acc
  }, {})

  const rowLabels = Object.keys(rows).sort()

  const toggleSeat = (seatId, status) => {
    if (status !== 'AVAILABLE') return
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

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 pt-20">
      <Link to="/movies" className="flex items-center gap-1 text-sm mb-6" style={{ color: 'var(--color-primary)' }}>
        <ArrowLeft className="w-4 h-4" /> Back to Movies
      </Link>

      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <h2 className="text-xl font-semibold mb-6 text-center" style={{ color: 'var(--color-text)' }}>
          Select Your Seats
        </h2>

        <div className="text-center mb-8">
          <div className="mx-auto w-3/4 h-2 rounded-t-lg mb-1" style={{ backgroundColor: 'var(--color-border-light)' }} />
          <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>Screen</span>
        </div>

        <div className="space-y-2 mb-8">
          {rowLabels.map(row => (
            <div key={row} className="flex items-center gap-3 justify-center">
              <span className="w-6 text-right text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{row}</span>
              <div className="flex gap-1.5">
                {rows[row]
                  .sort((a, b) => parseInt(a.seatNumber) - parseInt(b.seatNumber))
                  .map(seat => {
                    const isBooked = seat.status === 'BOOKED'
                    const isSelected = selectedIds.has(seat.id)
                    let bg = isBooked ? 'var(--color-border)' : 'var(--color-success)'
                    if (isSelected) bg = 'var(--color-primary)'

                    return (
                      <button
                        key={seat.id}
                        disabled={isBooked}
                        onClick={() => toggleSeat(seat.id, seat.status)}
                        className="w-8 h-8 rounded text-xs font-medium transition-all"
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
            { label: 'Booked', color: 'var(--color-border)' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{item.label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {selectedIds.size === 0 ? 'No seats selected' : `${selectedIds.size} seat${selectedIds.size > 1 ? 's' : ''} selected`}
          </span>
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
        </div>
      </div>
    </div>
  )
}

export default SeatSelectionPage
