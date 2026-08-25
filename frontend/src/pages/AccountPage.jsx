import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, Mail, Shield, User, CalendarCheck, LogOut } from 'lucide-react'
import api from '../utils/api'

function AccountPage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/auth/me')
      .then(res => setProfile(res.data))
      .catch(() => setError('Failed to load your profile'))
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8 pt-20">
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <Loader2 className="w-4 h-4 animate-spin" /> Loading profile...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8 pt-20">
        <div className="flex items-center gap-2 p-3 rounded text-sm animate-slide-down" style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      </div>
    )
  }

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—'

  const rows = [
    { icon: User, label: 'Username', value: profile?.username },
    { icon: Mail, label: 'Email', value: profile?.email },
    { icon: Shield, label: 'Role', value: profile?.role },
    { icon: CalendarCheck, label: 'Member Since', value: memberSince },
  ]

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 pt-20">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>My Account</h1>
      <p className="mb-8" style={{ color: 'var(--color-text-muted)' }}>Your profile details</p>

      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
          >
            {(profile?.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{profile?.username}</p>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold mt-1"
              style={{ color: 'var(--color-accent)', backgroundColor: 'var(--color-accent-light)' }}
            >
              <Shield className="w-3 h-3" /> {profile?.role || 'USER'}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {rows.map(row => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-4 rounded-lg p-4"
              style={{ backgroundColor: 'var(--color-bg)' }}
            >
              <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                <row.icon className="w-4 h-4" /> {row.label}
              </span>
              <span className="text-sm font-medium text-right" style={{ color: 'var(--color-text)' }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={handleLogout}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  )
}

export default AccountPage
