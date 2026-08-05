import { Link } from 'react-router-dom'
import { Palette, Film, CalendarClock, CalendarX2 } from 'lucide-react'

function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 pt-20">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Admin Dashboard</h1>
      <p className="mb-8" style={{ color: 'var(--color-text-muted)' }}>
        Welcome, <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{user?.username}</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/admin/genres"
          className="rounded-lg p-6 transition-all"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
          <div className="flex items-center gap-3 mb-2">
            <Palette className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--color-primary)' }}>Genres</h2>
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Add, edit, or remove genres</p>
        </Link>

        <Link
          to="/admin/movies"
          className="rounded-lg p-6 transition-all"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
          <div className="flex items-center gap-3 mb-2">
            <Film className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--color-primary)' }}>Movies</h2>
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Manage movies, posters, cast, and genres</p>
        </Link>

        <Link
          to="/admin/showtimes"
          className="rounded-lg p-6 transition-all"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
          <div className="flex items-center gap-3 mb-2">
            <CalendarClock className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--color-primary)' }}>Showtimes</h2>
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Create, edit, or remove showtimes</p>
        </Link>

        <Link
          to="/admin/reservations"
          className="rounded-lg p-6 transition-all"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
          <div className="flex items-center gap-3 mb-2">
            <CalendarX2 className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--color-primary)' }}>Bookings</h2>
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>View and cancel reservations</p>
        </Link>
      </div>
    </div>
  )
}

export default AdminDashboard
