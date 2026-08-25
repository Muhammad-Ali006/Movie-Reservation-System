import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Palette, Film, CalendarClock, CalendarX2, Banknote, Ticket, Gauge,
  Loader2, AlertCircle,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import api from '../utils/api'

const tooltipStyle = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border-light)',
  borderRadius: '8px',
  fontSize: '12px',
}

function formatPKR(value) {
  return `PKR ${Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  const [revenue, setRevenue] = useState(null)
  const [capacity, setCapacity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/admin/reports/revenue'),
      api.get('/admin/reports/capacity'),
    ])
      .then(([revRes, capRes]) => {
        setRevenue(revRes.data)
        setCapacity(capRes.data)
      })
      .catch(() => setError('Failed to load reports'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 pt-20">
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <Loader2 className="w-4 h-4 animate-spin" /> Loading reports...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 pt-20">
        <div className="flex items-center gap-2 p-3 rounded text-sm animate-slide-down" style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      </div>
    )
  }

  const totalRevenue = Number(revenue?.totalRevenue || 0)
  const totalBookings = Number(revenue?.totalBookings || 0)
  const showtimes = capacity?.showtimes || []
  const byScreen = capacity?.byScreen || []
  const byMovie = (revenue?.byMovie || []).slice(0, 8)

  const avgOccupancy = showtimes.length > 0
    ? (showtimes.reduce((sum, st) => sum + Number(st.occupancy || 0), 0) / showtimes.length).toFixed(1)
    : '0'

  const revenueChartData = byMovie.map(m => ({
    name: m.movieTitle,
    revenue: Number(m.revenue),
  }))

  const capacityChartData = byScreen.map(s => ({
    name: `${s.screenName} (${s.screenType})`,
    occupancy: Number(s.occupancy),
  }))

  const stats = [
    { label: 'Total Revenue', value: formatPKR(totalRevenue), icon: Banknote, accent: 'var(--color-primary)' },
    { label: 'Bookings', value: totalBookings.toLocaleString('en-US'), icon: Ticket, accent: 'var(--color-success)' },
    { label: 'Avg Occupancy', value: `${avgOccupancy}%`, icon: Gauge, accent: 'var(--color-accent)' },
    { label: 'Showtimes', value: showtimes.length.toLocaleString('en-US'), icon: CalendarClock, accent: 'var(--color-text-secondary)' },
  ]

  const navCards = [
    { to: '/admin/genres', icon: Palette, title: 'Genres', desc: 'Add, edit, or remove genres' },
    { to: '/admin/movies', icon: Film, title: 'Movies', desc: 'Manage movies, posters, cast, and genres' },
    { to: '/admin/showtimes', icon: CalendarClock, title: 'Showtimes', desc: 'Create, edit, or remove showtimes' },
    { to: '/admin/reservations', icon: CalendarX2, title: 'Bookings', desc: 'View and cancel reservations' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 pt-20">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Admin Dashboard</h1>
      <p className="mb-8" style={{ color: 'var(--color-text-muted)' }}>
        Welcome, <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{user?.username}</span>
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={stat.label} className="rounded-lg p-5 animate-fade-in" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center gap-2 mb-3">
              <stat.icon className="w-5 h-5" style={{ color: stat.accent }} />
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                {stat.label}
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Revenue by Movie</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>Confirmed bookings only, top {revenueChartData.length || 0} movies</p>
          {revenueChartData.length === 0 ? (
            <p className="py-10 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>No confirmed bookings yet</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} tickFormatter={v => `${Number(v) / 1000}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={value => [formatPKR(value), 'Revenue']} cursor={{ fill: 'rgba(229, 9, 20, 0.08)' }} />
                  <Bar dataKey="revenue" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Occupancy by Screen</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>Active seats held ÷ total capacity</p>
          {capacityChartData.length === 0 ? (
            <p className="py-10 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>No showtimes yet</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={capacityChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} formatter={value => [`${value}%`, 'Occupancy']} cursor={{ fill: 'rgba(255, 193, 7, 0.08)' }} />
                  <Bar dataKey="occupancy" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Management</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {navCards.map(card => (
          <Link
            key={card.to}
            to={card.to}
            className="rounded-lg p-6 transition-all"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
            <div className="flex items-center gap-3 mb-2">
              <card.icon className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              <h3 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>{card.title}</h3>
            </div>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default AdminDashboard
