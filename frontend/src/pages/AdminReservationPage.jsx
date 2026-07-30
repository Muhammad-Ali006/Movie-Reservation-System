import { useState, useEffect } from 'react'
import { CalendarX2, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import api from '../utils/api'

function AdminReservationPage() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState(null)

  const fetchReservations = () => {
    setLoading(true)
    setError('')
    api.get('/admin/reservations')
      .then(res => setReservations(res.data))
      .catch(() => setError('Failed to load reservations'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchReservations()
  }, [])

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

  const formatDate = (dateStr) => {
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

  const byScreen = reservations.reduce((acc, r) => {
    const key = r.screenName || 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})

  const screenNames = Object.keys(byScreen).sort()

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 pt-20">
        <p style={{ color: 'var(--color-text-muted)' }}>Loading reservations...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 pt-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <CalendarX2 className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Bookings</h1>
        </div>
        <button
          onClick={fetchReservations}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded text-sm mb-6" style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {!loading && screenNames.length === 0 && !error && (
        <p style={{ color: 'var(--color-text-muted)' }}>No reservations found.</p>
      )}

      <div className="space-y-6">
        {screenNames.map(screenName => (
          <div key={screenName} className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="px-5 py-3 font-semibold text-sm" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)' }}>
              {screenName}
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {byScreen[screenName].map(r => (
                <div key={r.id} className="px-5 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate" style={{ color: 'var(--color-text)' }}>
                        {r.movieTitle}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                        backgroundColor: r.status === 'CONFIRMED' ? 'var(--color-success)' : 'var(--color-border)',
                        color: r.status === 'CONFIRMED' ? '#000' : 'var(--color-text-muted)',
                        opacity: r.status === 'CANCELLED' ? 0.5 : 1,
                      }}>
                        {r.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      <span>{r.username}</span>
                      <span>Seats: {r.seats}</span>
                      <span>{formatDate(r.showDate)} {formatTime(r.showTime)}</span>
                      <span>${parseFloat(r.totalAmount).toFixed(2)}</span>
                    </div>
                  </div>
                  {r.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleCancel(r.id)}
                      disabled={cancellingId === r.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all flex-shrink-0"
                      style={{
                        backgroundColor: cancellingId === r.id ? 'var(--color-border)' : 'var(--color-error-light)',
                        color: cancellingId === r.id ? 'var(--color-text-muted)' : 'var(--color-error)',
                        cursor: cancellingId === r.id ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {cancellingId === r.id ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Cancelling</>
                      ) : 'Cancel'}
                    </button>
                  )}
                  {r.status === 'CANCELLED' && (
                    <span className="text-xs px-3 py-1.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                      <CheckCircle className="w-3.5 h-3.5 inline mr-1" style={{ color: 'var(--color-text-muted)' }} />
                      Done
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminReservationPage
