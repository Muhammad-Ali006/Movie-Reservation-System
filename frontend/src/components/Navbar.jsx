import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Film, LogIn, LogOut, UserPlus, Shield, CalendarCheck, UserCircle, Menu, X } from 'lucide-react'

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const [mobileOpen, setMobileOpen] = useState(false)
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setMobileOpen(false)
    navigate('/login')
  }

  const closeMobile = () => setMobileOpen(false)

  return (
    <nav style={{
      background: 'linear-gradient(to bottom, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.8) 70%, transparent 100%)',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {!isHome && (
            <Link to="/" onClick={closeMobile} className="flex items-center gap-2 text-xl font-black tracking-tight" style={{ color: 'var(--color-primary)' }}>
              <Film className="w-6 h-6 sm:w-7 sm:h-7" />
              CINEMAX
            </Link>
          )}

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-5 ml-auto">
            {!isHome && (
              <Link to="/movies" className="flex items-center gap-1 text-sm font-medium transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}>
                <Film className="w-4 h-4" />
                Movies
              </Link>
            )}
            {token ? (
              <>
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Hello, {user?.username || 'User'}
                </span>
                <Link to="/my-bookings" className="flex items-center gap-1 text-sm font-medium transition-colors"
                  style={{ color: 'var(--color-text-secondary)' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}>
                  <CalendarCheck className="w-4 h-4" />
                  My Bookings
                </Link>
                <Link to="/account" className="flex items-center gap-1 text-sm font-medium transition-colors"
                  style={{ color: 'var(--color-text-secondary)' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}>
                  <UserCircle className="w-4 h-4" />
                  Account
                </Link>
                {user?.role === 'ADMIN' && (
                  <Link to="/admin" className="flex items-center gap-1 text-sm font-medium transition-colors"
                    style={{ color: 'var(--color-text-secondary)' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}>
                    <Shield className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-white px-4 py-2 rounded text-sm font-medium transition-all"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}>
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              !isHome && (
                <>
                  <Link to="/login" className="flex items-center gap-1 text-sm font-medium transition-colors"
                    style={{ color: 'var(--color-text-secondary)' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}>
                    <LogIn className="w-4 h-4" />
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="flex items-center gap-1 text-white px-4 py-2 rounded text-sm font-medium transition-all"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}>
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </Link>
                </>
              )
            )}
          </div>

          {/* Mobile hamburger */}
          {!(isHome && !token) && (
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2" style={{ color: 'var(--color-text)' }}>
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden px-4 pb-4 space-y-2 animate-slide-down" style={{ backgroundColor: 'rgba(10,10,10,0.98)', animationDuration: '0.35s' }}>
          {!isHome && (
            <Link to="/movies" onClick={closeMobile}
              className="flex items-center gap-2 py-2 text-sm font-medium animate-fade-in"
              style={{ color: 'var(--color-text-secondary)', animationDelay: '40ms' }}>
              <Film className="w-4 h-4" /> Movies
            </Link>
          )}
          {token ? (
            <>
              <div className="py-2 text-sm animate-fade-in" style={{ color: 'var(--color-text-muted)', animationDelay: '80ms' }}>
                Hello, {user?.username || 'User'}
              </div>
              <Link to="/my-bookings" onClick={closeMobile}
                className="flex items-center gap-2 py-2 text-sm font-medium animate-fade-in"
                style={{ color: 'var(--color-text-secondary)', animationDelay: '120ms' }}>
                <CalendarCheck className="w-4 h-4" /> My Bookings
              </Link>
              <Link to="/account" onClick={closeMobile}
                className="flex items-center gap-2 py-2 text-sm font-medium animate-fade-in"
                style={{ color: 'var(--color-text-secondary)', animationDelay: '160ms' }}>
                <UserCircle className="w-4 h-4" /> Account
              </Link>
              {user?.role === 'ADMIN' && (
                <Link to="/admin" onClick={closeMobile}
                  className="flex items-center gap-2 py-2 text-sm font-medium animate-fade-in"
                  style={{ color: 'var(--color-text-secondary)', animationDelay: '200ms' }}>
                  <Shield className="w-4 h-4" /> Admin
                </Link>
              )}
              <button onClick={handleLogout}
                className="flex items-center gap-2 text-white px-4 py-2 rounded text-sm font-medium w-full text-left animate-fade-in"
                style={{ backgroundColor: 'var(--color-primary)', animationDelay: '240ms' }}>
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          ) : (
            !isHome && (
              <>
                <Link to="/login" onClick={closeMobile}
                  className="flex items-center gap-2 py-2 text-sm font-medium animate-fade-in"
                  style={{ color: 'var(--color-text-secondary)', animationDelay: '80ms' }}>
                  <LogIn className="w-4 h-4" /> Login
                </Link>
                <Link to="/signup" onClick={closeMobile}
                  className="flex items-center gap-2 text-white px-4 py-2 rounded text-sm font-medium animate-fade-in"
                  style={{ backgroundColor: 'var(--color-primary)', animationDelay: '120ms' }}>
                  <UserPlus className="w-4 h-4" /> Sign Up
                </Link>
              </>
            )
          )}
        </div>
      )}
    </nav>
  )
}

export default Navbar
