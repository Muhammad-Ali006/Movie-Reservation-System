import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Clock, Globe, Calendar, Clapperboard, Ticket, Monitor, ChevronRight } from 'lucide-react'
import api from '../utils/api'

function MovieDetailPage() {
  const { slug } = useParams()
  const [movie, setMovie] = useState(null)
  const [cast, setCast] = useState([])
  const [genreIds, setGenreIds] = useState([])
  const [genres, setGenres] = useState([])
  const [showtimes, setShowtimes] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [movieRes, genresRes] = await Promise.all([
          api.get(`/movies/${slug}`),
          api.get('/genres'),
        ])
        setMovie(movieRes.data.movie)
        setCast(movieRes.data.cast)
        setGenreIds(movieRes.data.genreIds || [])
        setGenres(genresRes.data)

        const showRes = await api.get('/showtimes', { params: { movieId: movieRes.data.movie.id } })
        setShowtimes(showRes.data)

        if (showRes.data.length > 0) {
          const dates = [...new Set(showRes.data.map(s => s.showDate))].sort()
          setSelectedDate(dates[0])
        }
      } catch {
        setError('Failed to load movie details')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [slug])

  const genreMap = Object.fromEntries(genres.map(g => [g.id, g.name]))
  const movieGenres = genreIds.map(gid => genreMap[gid]).filter(Boolean)

  const availableDates = [...new Set(showtimes.map(s => s.showDate))].sort()

  const filteredShowtimes = selectedDate
    ? showtimes.filter(s => s.showDate === selectedDate)
    : showtimes

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [h, m] = timeStr.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const h12 = hour % 12 || 12
    return `${h12}:${m} ${ampm}`
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 pt-20">
        <p style={{ color: 'var(--color-text-muted)' }}>Loading movie details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 pt-20">
        <Link to="/movies" className="flex items-center gap-1 text-sm mb-4 block" style={{ color: 'var(--color-primary)' }}>
          <ArrowLeft className="w-4 h-4" /> Back to Movies
        </Link>
        <div className="p-3 rounded text-sm" style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)' }}>{error}</div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 pt-20">
        <Link to="/movies" className="flex items-center gap-1 text-sm mb-4 block" style={{ color: 'var(--color-primary)' }}>
          <ArrowLeft className="w-4 h-4" /> Back to Movies
        </Link>
        <p style={{ color: 'var(--color-text-muted)' }}>Movie not found.</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 pt-20">
      <Link to="/movies" className="flex items-center gap-1 text-sm mb-6" style={{ color: 'var(--color-primary)' }}>
        <ArrowLeft className="w-4 h-4" /> Back to Movies
      </Link>

      {/* Movie Info */}
      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="md:flex">
          {movie.posterUrl ? (
            <img src={movie.posterUrl} alt={movie.title} className="w-full md:w-80 h-96 md:h-auto object-cover" />
          ) : (
            <div className="w-full md:w-80 h-96 flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>No Poster</span>
            </div>
          )}

          <div className="p-6 flex-1">
            <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>{movie.title}</h1>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              {movieGenres.map((genreName, index) => (
                <span key={index} className="text-sm px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                  {genreName}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>{movie.durationMinutes} min</span>
              </div>
              {movie.releaseDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                  <span style={{ color: 'var(--color-text-secondary)' }}>{movie.releaseDate}</span>
                </div>
              )}
              {movie.originalLanguage && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                  <span style={{ color: 'var(--color-text-secondary)' }}>{movie.originalLanguage}</span>
                </div>
              )}
              {movie.director && (
                <div className="flex items-center gap-2">
                  <Clapperboard className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                  <span style={{ color: 'var(--color-text-secondary)' }}>{movie.director}</span>
                </div>
              )}
            </div>

            {movie.description && (
              <div>
                <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Description</h2>
                <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{movie.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Cast */}
        {cast.length > 0 && (
          <div className="p-6" style={{ borderTop: '1px solid var(--color-border)' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Cast</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {cast.map((member) => (
                <div key={member.id} className="text-center">
                  {member.photoUrl ? (
                    <img src={member.photoUrl} alt={member.actorName} className="w-20 h-20 rounded-full object-cover mx-auto mb-2" />
                  ) : (
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: 'var(--color-bg)' }}>
                      <span className="text-xl" style={{ color: 'var(--color-primary)' }}>{member.actorName?.charAt(0)}</span>
                    </div>
                  )}
                  <p className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>{member.actorName}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>as {member.roleName}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Showtimes */}
        <div className="p-6" style={{ borderTop: '1px solid var(--color-border)' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Showtimes & Booking</h2>

          {showtimes.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>No showtimes available for this movie yet.</p>
          ) : (
            <>
              {/* Date Tabs */}
              <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                {availableDates.map(date => (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
                    style={{
                      backgroundColor: selectedDate === date ? 'var(--color-primary)' : 'var(--color-bg)',
                      color: selectedDate === date ? '#fff' : 'var(--color-text-muted)',
                      border: selectedDate === date ? 'none' : '1px solid var(--color-border)',
                    }}>
                    {formatDate(date)}
                  </button>
                ))}
              </div>

              {/* Showtime Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredShowtimes.map(showtime => (
                  <Link
                    key={showtime.id}
                    to={`/booking/${showtime.id}`}
                    className="rounded-lg p-4 transition-all block"
                    style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                        {formatTime(showtime.showTime)}
                      </span>
                      <span className="text-lg font-semibold" style={{ color: 'var(--color-accent)' }}>
                        PKR {showtime.pricePerSeat}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                        <span>{showtime.screenName}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                          {showtime.screenType}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                        <span>{showtime.availableSeats} / {showtime.totalSeats} seats available</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--color-primary)' }}>
                      Select Seats <ChevronRight className="w-3 h-3" />
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default MovieDetailPage
