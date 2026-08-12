import { Link } from 'react-router-dom'
import { UserPlus, Play } from 'lucide-react'

function Home() {
  const token = localStorage.getItem('token')

  return (
    <div className="hero-banner relative overflow-hidden" style={{
      backgroundImage: `
        linear-gradient(to right, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.7) 40%, rgba(10,10,10,0.3) 70%, rgba(10,10,10,0.1) 100%),
        linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0.4) 40%, rgba(10,10,10,0.2) 100%),
        url(/cinema-background.jpeg)
      `,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
    }}>
      <div className="max-w-7xl mx-auto px-6 pt-20">
        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight" style={{ color: 'var(--color-text)' }}>
          Movie
          <span className="block" style={{ color: 'var(--color-primary)' }}>Reservation</span>
        </h1>

        {/* CTA Buttons */}
        {!token && (
          <div className="flex flex-wrap gap-4">
            <Link
              to="/movies"
              className="inline-flex items-center gap-2 text-white px-6 sm:px-8 py-3 rounded-lg font-bold text-base sm:text-lg transition-all hover:scale-105"
              style={{ backgroundColor: 'var(--color-primary)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}>
              <Play className="w-5 h-5 fill-current" />
              Browse Movies
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 rounded-lg font-bold text-base sm:text-lg transition-all hover:scale-105"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', backdropFilter: 'blur(10px)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}>
              <UserPlus className="w-5 h-5" />
              Sign Up
            </Link>
          </div>
        )}

        {token && (
          <Link
            to="/movies"
            className="inline-flex items-center gap-2 text-white px-6 sm:px-8 py-3 rounded-lg font-bold text-base sm:text-lg transition-all hover:scale-105"
            style={{ backgroundColor: 'var(--color-primary)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}>
            <Play className="w-5 h-5 fill-current" />
            Browse Movies
          </Link>
        )}
      </div>

      {/* Decorative gradient orb */}
      <div className="absolute top-1/4 right-10 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)' }}></div>
    </div>
  )
}

export default Home
