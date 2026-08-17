import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Filter, ChevronLeft, ChevronRight, Film } from 'lucide-react'
import api from '../utils/api'

const TABS = [
  { key: 'NOW_SHOWING', label: 'Now Showing' },
  { key: 'COMING_SOON', label: 'Coming Soon' },
  { key: 'ALL', label: 'All Movies' },
]

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Newest' },
  { value: 'title', label: 'Title A-Z' },
  { value: 'releaseDate', label: 'Release Date' },
  { value: 'duration', label: 'Duration' },
]

function MovieListingPage() {
  const [movies, setMovies] = useState([])
  const [genres, setGenres] = useState([])
  const [activeTab, setActiveTab] = useState('ALL')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchMovies = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page,
        size: 8,
        sortBy,
        sortDir,
      }
      if (activeTab !== 'ALL') params.availability = activeTab
      if (selectedGenre) params.genreId = selectedGenre

      const [moviesRes, genresRes] = await Promise.all([
        api.get('/movies', { params }),
        genres.length === 0 ? api.get('/genres') : Promise.resolve({ data: genres }),
      ])

      setMovies(moviesRes.data.content || [])
      setTotalPages(moviesRes.data.totalPages || 0)
      if (genres.length === 0) setGenres(genresRes.data)
    } catch {
      setMovies([])
    } finally {
      setLoading(false)
    }
  }, [page, sortBy, sortDir, activeTab, selectedGenre, genres.length])

  useEffect(() => {
    fetchMovies()
  }, [fetchMovies])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setPage(0)
  }

  const handleGenreChange = (genreId) => {
    setSelectedGenre(genreId)
    setPage(0)
  }

  const handleSortChange = (newSort) => {
    if (newSort === sortBy) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSort)
      setSortDir(newSort === 'title' ? 'asc' : 'desc')
    }
    setPage(0)
  }

  const genreMap = Object.fromEntries(genres.map(g => [g.id, g.name]))

  return (
    <div className="relative min-h-screen">
      {/* Reel background band: fixed, inset from screen edges, ends at the footer */}
      <div className="fixed inset-x-4 top-0 bottom-16 rounded-2xl overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/reel.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 2rem, black calc(100% - 2rem), transparent)',
            maskImage: 'linear-gradient(to right, transparent, black 2rem, black calc(100% - 2rem), transparent)',
          }}
        />
        {/* Uniform black filter */}
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(10,10,10,0.82)' }} />
        {/* Bottom fade so the reel ends cleanly just before the footer */}
        <div
          className="absolute inset-x-0 bottom-0 h-40"
          style={{ background: 'linear-gradient(to top, var(--color-bg), transparent)' }}
        />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 pt-20">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>Browse Movies</h1>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 p-1 rounded-lg w-fit" style={{ backgroundColor: 'var(--color-surface)' }}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className="px-4 py-2 rounded-md text-sm font-medium transition-all"
                style={{
                  backgroundColor: activeTab === tab.key ? 'var(--color-primary)' : 'transparent',
                  color: activeTab === tab.key ? '#fff' : 'var(--color-text-muted)',
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
              <select
                value={selectedGenre}
                onChange={(e) => handleGenreChange(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm"
                style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}>
                <option value="">All Genres</option>
                {genres.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-1 flex-wrap">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleSortChange(opt.value)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                  style={{
                    backgroundColor: sortBy === opt.value ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: sortBy === opt.value ? '#fff' : 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)',
                  }}>
                  {opt.label} {sortBy === opt.value ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </button>
              ))}
            </div>
          </div>

      {/* Movie Grid */}
      {loading ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Loading movies...</p>
      ) : movies.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>
          {activeTab === 'NOW_SHOWING'
            ? 'No movies are currently showing.'
            : activeTab === 'COMING_SOON'
              ? 'No upcoming movies.'
              : 'No movies found.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {movies.map(movie => (
            <Link
              key={movie.id}
              to={`/movies/${movie.slug}`}
              className="rounded-lg overflow-hidden transition-all relative"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-light)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'translateY(0)' }}>
              {/* Badge */}
              <span
                className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full z-10"
                style={{
                  backgroundColor: movie.hasShowtimes ? 'var(--color-primary)' : 'var(--color-bg)',
                  color: movie.hasShowtimes ? '#fff' : 'var(--color-text-muted)',
                  border: movie.hasShowtimes ? 'none' : '1px solid var(--color-border)',
                }}>
                {movie.hasShowtimes ? 'NOW SHOWING' : 'COMING SOON'}
              </span>

              {movie.posterUrl ? (
                <img src={movie.posterUrl} alt={movie.title} className="w-full h-64 object-cover" />
              ) : (
                <div className="w-full h-64 flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
                  <Film className="w-10 h-10" style={{ color: 'var(--color-text-muted)' }} />
                </div>
              )}

              <div className="p-4">
                <h2 className="text-lg font-semibold mb-1 truncate" style={{ color: 'var(--color-text)' }}>
                  {movie.title}
                </h2>
                <div className="flex flex-wrap gap-1 mb-2">
                  {movie.genreIds?.slice(0, 2).map((gid, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
                      {genreMap[gid] || 'Unknown'}
                    </span>
                  ))}
                  {movie.genreIds?.length > 2 && (
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>+{movie.genreIds.length - 2}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <Clock className="w-3 h-3" />
                  {movie.durationMinutes} min
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-lg transition-all disabled:opacity-30"
            style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-2 rounded-lg transition-all disabled:opacity-30"
            style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
      </div>
    </div>
  )
}

export default MovieListingPage
