import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import QRCode from 'qrcode'
import {
  Ticket as TicketIcon,
  Printer,
  AlertCircle,
  ArrowLeft,
  Film,
  CalendarDays,
  Clock,
  MonitorPlay,
  Armchair,
  Banknote,
  Loader2,
} from 'lucide-react'
import api from '../utils/api'

function TicketPage() {
  const { token } = useParams()
  const [ticket, setTicket] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    setLoading(true)
    api.get(`/tickets/${token}/details`)
      .then(res => {
        setTicket(res.data)
        if (res.data.status === 'VALID') {
          return QRCode.toDataURL(token, { width: 180, margin: 1 })
            .then(url => setQrDataUrl(url))
        }
      })
      .catch(() => setError('Failed to load ticket'))
      .finally(() => setLoading(false))
  }, [token])

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

  const shortToken = token && token.length > 24 ? `${token.slice(0, 12)}…${token.slice(-8)}` : token

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-6 py-8 pt-20">
        <div className="flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading ticket...
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

  if (!ticket || ticket.status !== 'VALID') {
    const isUsed = ticket?.status === 'ALREADY USED'
    return (
      <div className="max-w-lg mx-auto px-6 py-8 pt-20">
        <div className="rounded-lg p-8 text-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5"
            style={{ backgroundColor: isUsed ? 'rgba(255, 193, 7, 0.12)' : 'var(--color-error-light)' }}
          >
            <AlertCircle className="w-8 h-8" style={{ color: isUsed ? 'var(--color-warning)' : 'var(--color-error)' }} />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {isUsed ? 'Ticket Already Used' : 'Ticket Not Valid'}
          </h2>
          <p className="text-sm mb-7" style={{ color: 'var(--color-text-secondary)' }}>
            {isUsed
              ? 'This ticket has already been scanned at the cinema.'
              : (ticket?.message || 'This ticket is not valid.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/movies"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
            >
              <Film className="w-4 h-4" /> Browse Movies
            </Link>
            <Link
              to="/my-bookings"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--color-accent)',
                border: '1px solid var(--color-accent)',
              }}
            >
              <TicketIcon className="w-4 h-4" /> My Bookings
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-8 pt-20">
      <Link
        to="/my-bookings"
        className="flex items-center gap-1 text-sm mb-6 no-print"
        style={{ color: 'var(--color-primary)' }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Bookings
      </Link>

      <div className="rounded-lg overflow-hidden ticket-print-card" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-3 px-6 py-4" style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}>
          <TicketIcon className="w-6 h-6" />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">Cinema Ticket</p>
            <p className="text-lg font-semibold">{ticket.movieTitle}</p>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-3 mb-5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                <CalendarDays className="w-4 h-4" /> Date
              </span>
              <span className="font-medium">{formatDate(ticket.showDate)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                <Clock className="w-4 h-4" /> Time
              </span>
              <span className="font-medium">{formatTime(ticket.showTime)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                <MonitorPlay className="w-4 h-4" /> Screen
              </span>
              <span className="font-medium">{ticket.screenName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                <Armchair className="w-4 h-4" /> Seats
              </span>
              <span className="font-medium">{ticket.seats}</span>
            </div>
            <div className="flex items-center justify-between text-sm pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
              <span className="flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                <Banknote className="w-4 h-4" /> Total Paid
              </span>
              <span className="font-bold" style={{ color: 'var(--color-success)' }}>
                PKR {parseFloat(ticket.totalAmount).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="rounded-lg p-4 flex flex-col items-center" style={{ backgroundColor: 'var(--color-bg)' }}>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Ticket QR code" className="w-44 h-44 animate-scale-pop" />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center" style={{ color: 'var(--color-text-muted)' }}>
                Loading QR...
              </div>
            )}
            <p className="mt-3 text-xs font-semibold tracking-widest break-all text-center" style={{ color: 'var(--color-primary)' }}>
              {shortToken}
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Present this QR at the entrance to validate your ticket.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={() => window.print()}
        className="no-print w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all"
        style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
      >
        <Printer className="w-4 h-4" /> Print Ticket
      </button>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .ticket-print-card, .ticket-print-card * { visibility: visible !important; }
          .ticket-print-card {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            border: 1px solid #111 !important;
          }
          .ticket-print-card * { color: #111111 !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  )
}

export default TicketPage
