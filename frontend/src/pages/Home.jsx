import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus, Play } from 'lucide-react'
import MovieMarquee from '../components/MovieMarquee'

const TAGLINES = ['Browse Shows', 'Pick Your Seat', 'Skip the Line']

function useTypewriter(phrases) {
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const current = phrases[index % phrases.length]
    let timeout

    if (waiting) {
      timeout = setTimeout(() => {
        setWaiting(false)
        setDeleting(true)
      }, 1500)
    } else if (deleting) {
      timeout = setTimeout(() => {
        setText(current.slice(0, text.length - 1))
        if (text.length <= 1) {
          setDeleting(false)
          setIndex(i => i + 1)
        }
      }, 40)
    } else {
      timeout = setTimeout(() => {
        const next = current.slice(0, text.length + 1)
        setText(next)
        if (next === current) setWaiting(true)
      }, 70)
    }

    return () => clearTimeout(timeout)
  }, [text, deleting, waiting, index, phrases])

  return text
}

function Home() {
  const token = localStorage.getItem('token')
  const typed = useTypewriter(TAGLINES)

  return (
    <>
      <div className="hero-banner relative overflow-hidden" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      {/* Background video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="/cinema-background.jpeg"
        preload="auto"
        className="inset-0 w-full h-full object-cover"
        style={{ position: 'absolute', zIndex: 0 }}
      >
        <source src="/back_vid_black_white.mp4" type="video/mp4" />
      </video>

      {/* Gradient overlays for text readability */}
      <div
        className="inset-0 pointer-events-none"
        style={{ position: 'absolute', zIndex: 1, background: 'linear-gradient(to right, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.7) 40%, rgba(10,10,10,0.3) 70%, rgba(10,10,10,0.1) 100%)' }}
      ></div>
      <div
        className="inset-0 pointer-events-none"
        style={{ position: 'absolute', zIndex: 1, background: 'linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0.4) 40%, rgba(10,10,10,0.2) 100%)' }}
      ></div>

      <div className="max-w-7xl px-6 pt-20 relative md:ml-32 lg:ml-40">
        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-black tracking-wide mb-4 leading-none hero-stagger-1" style={{ color: 'var(--color-primary)' }}>
          CINEMAX
        </h1>

        {/* Typing tagline */}
        <p className="text-2xl md:text-3xl font-semibold mb-8 hero-stagger-2" style={{ color: 'var(--color-text)' }}>
          {typed}
          <span className="typing-cursor"></span>
        </p>

        {/* CTA Buttons */}
        {!token && (
          <div className="flex flex-wrap gap-4 hero-stagger-3">
            <Link
              to="/movies"
              className="inline-flex items-center gap-2 text-white px-6 sm:px-8 py-3 rounded-lg font-bold text-base sm:text-lg transition-all hover:scale-105"
              style={{ backgroundColor: 'var(--color-primary)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}>
              <Play className="w-5 h-5 fill-current" />
              Browse Shows
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
            className="inline-flex items-center gap-2 text-white px-6 sm:px-8 py-3 rounded-lg font-bold text-base sm:text-lg transition-all hover:scale-105 hero-stagger-3"
            style={{ backgroundColor: 'var(--color-primary)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}>
            <Play className="w-5 h-5 fill-current" />
            Browse Movies
          </Link>
        )}
      </div>
    </div>

    <MovieMarquee title="Now Showing" availability="NOW_SHOWING" />
    <MovieMarquee title="Coming Soon" availability="COMING_SOON" reverse />
    </>
  )
}

export default Home
