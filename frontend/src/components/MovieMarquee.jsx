import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Film, ArrowRight } from 'lucide-react'
import api from '../utils/api'

function MovieMarquee({ title, availability, reverse }) {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api.get('/movies', { params: { availability, size: 6 } })
      .then(res => { if (!cancelled) setMovies(res.data.content || []) })
      .catch(() => { if (!cancelled) setMovies([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [availability])

  if (loading || movies.length === 0) return null

  const isNowShowing = availability === 'NOW_SHOWING'
  const animate = movies.length >= 5
  const copies = [...movies, ...movies]

  const renderCard = (movie, key) => (
    <Link
      key={key}
      to={`/movies/${movie.slug}`}
      className="movie-card w-60 shrink-0 rounded-lg overflow-hidden relative"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <span
        className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full z-10"
        style={{
          backgroundColor: isNowShowing ? 'var(--color-primary)' : 'var(--color-bg)',
          color: isNowShowing ? '#fff' : 'var(--color-text-muted)',
          border: isNowShowing ? 'none' : '1px solid var(--color-border)',
        }}>
        {isNowShowing ? 'NOW SHOWING' : 'COMING SOON'}
      </span>

      {movie.posterUrl ? (
        <img src={movie.posterUrl} alt={movie.title} className="w-full h-64 object-cover" />
      ) : (
        <div className="w-full h-64 flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
          <Film className="w-10 h-10" style={{ color: 'var(--color-text-muted)' }} />
        </div>
      )}

      <div className="p-4">
        <h3 className="font-semibold mb-1 truncate" style={{ color: 'var(--color-text)' }}>
          {movie.title}
        </h3>
        <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <Clock className="w-3 h-3" />
          {movie.durationMinutes} min
        </div>
      </div>
    </Link>
  )

  return (
    <section className="marquee-section py-10" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="max-w-7xl mx-auto px-6 mb-6 flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          {title}
        </h2>
        <Link
          to="/movies"
          className="inline-flex items-center gap-1 text-sm font-medium transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}>
          View all
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {animate ? (
        <div className="marquee">
          <div
            className="marquee-track"
            style={{ animationDuration: `${movies.length * 4}s`, animationDirection: reverse ? 'reverse' : 'normal' }}>
            {copies.map((movie, i) => renderCard(movie, `${movie.id}-${i}`))}
          </div>
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-2">
          {movies.map((movie, i) => renderCard(movie, `${movie.id}-${i}`))}
        </div>
      )}
    </section>
  )
}

export default MovieMarquee
