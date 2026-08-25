import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Clock, ChevronLeft, ChevronRight, Film, Search, X, ChevronDown, Loader2 } from 'lucide-react'
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
  const [selectedGenreIds, setSelectedGenreIds] = useState([])
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [allMovies, setAllMovies] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [genreFilterOpen, setGenreFilterOpen] = useState(false)
  const [gridKey, setGridKey] = useState(0)

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
      if (selectedGenreIds.length > 0) params.genreIds = selectedGenreIds.join(',')

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
  }, [page, sortBy, sortDir, activeTab, selectedGenreIds, genres.length])

  const fetchAllMovies = useCallback(async () => {
    if (allMovies.length > 0) return
    setSearchLoading(true)
    try {
      const res = await api.get('/movies', { params: { size: 100, sortBy: 'title', sortDir: 'asc' } })
      setAllMovies(res.data.content || [])
    } catch {
      setAllMovies([])
    } finally {
      setSearchLoading(false)
    }
  }, [allMovies.length])

  useEffect(() => {
    if (searchQuery.trim()) {
      fetchAllMovies()
    }
  }, [searchQuery, fetchAllMovies])

  useEffect(() => {
    if (!searchQuery.trim()) {
      fetchMovies()
    }
  }, [fetchMovies, searchQuery])

  const filteredMovies = searchQuery.trim()
    ? allMovies.filter(movie => {
        const q = searchQuery.toLowerCase()
        const titleMatch = movie.title?.toLowerCase().includes(q)
        const directorMatch = movie.director?.toLowerCase().includes(q)
        const actorMatch = movie.actorNames?.some(name => name.toLowerCase().includes(q))
        return titleMatch || directorMatch || actorMatch
      })
    : movies

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setPage(0)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setPage(0)
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setPage(0)
    setGridKey(k => k + 1)
  }

  const handleGenreToggle = (genreId) => {
    setSelectedGenreIds(prev => {
      const next = prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
      if (next.length === genres.length) return []
      return next
    })
    setPage(0)
    setGridKey(k => k + 1)
  }

  const genreMap = Object.fromEntries(genres.map(g => [g.id, g.name]))
  const isSearching = searchQuery.trim().length > 0

  const genreLabel = selectedGenreIds.length === 0
    ? 'All Genres'
    : selectedGenreIds.map(id => genreMap[id]).join(', ')

  const handleSortChange = (newSort) => {
    if (newSort === sortBy) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSort)
      setSortDir(newSort === 'title' ? 'asc' : 'desc')
    }
    setPage(0)
    setGridKey(k => k + 1)
  }

  return (
    <div className="relative min-h-screen">
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
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(10,10,10,0.82)' }} />
        <div
          className="absolute inset-x-0 bottom-0 h-40"
          style={{ background: 'linear-gradient(to top, var(--color-bg), transparent)' }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 pt-20">
        {/* Search Bar */}
        <div className="relative mb-5 max-w-md mx-auto">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by title, director, or actor..."
            className="w-full pl-11 pr-10 py-2.5 text-sm"
            style={{
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: '9999px',
            }}
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-text-muted)' }}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tabs */}
        {!isSearching && (
          <div className="flex justify-center gap-1 mb-5 p-1 rounded-lg w-fit mx-auto" style={{ backgroundColor: 'var(--color-surface)' }}>
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
        )}

        {/* Filters Row */}
        {!isSearching && (
          <div className="flex flex-col items-center gap-4 mb-8">
            {/* Genre trigger + Sort buttons */}
            <div className="flex flex-wrap justify-center items-center gap-3">
              <button
                onClick={() => setGenreFilterOpen(o => !o)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: selectedGenreIds.length > 0 ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: selectedGenreIds.length > 0 ? '#fff' : 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                }}>
                Genre: {genreLabel}
                <ChevronDown
                  className="w-4 h-4 transition-transform"
                  style={{ transform: genreFilterOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

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

            {/* Expandable genre chips */}
            {genreFilterOpen && (
              <div className="flex flex-wrap justify-center gap-2 max-w-3xl animate-slide-down">
                {genres.map(g => (
                  <button
                    key={g.id}
                    onClick={() => handleGenreToggle(g.id)}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-all"
                    style={selectedGenreIds.includes(g.id)
                      ? { backgroundColor: 'var(--color-primary)', color: '#fff' }
                      : { backgroundColor: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }
                    }>
                    {g.name}
                    {selectedGenreIds.includes(g.id) && <X className="w-3 h-3 ml-1" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Movie Grid */}
        {loading || searchLoading ? (
          <div className="flex items-center justify-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading movies...
          </div>
        ) : isSearching ? (
          filteredMovies.length === 0 ? (
            <p className="text-center" style={{ color: 'var(--color-text-muted)' }}>
              No movies found for "{searchQuery}".
            </p>
          ) : (
            <>
              <p className="text-sm mb-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
                Found {filteredMovies.length} movie{filteredMovies.length !== 1 ? 's' : ''} for "{searchQuery}"
              </p>
              <div key={gridKey} className="grid-transition grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredMovies.map((movie, index) => (
                  <Link
                    key={movie.id}
                    to={`/movies/${movie.slug}`}
                    className="search-result-card rounded-lg overflow-hidden transition-all relative"
                    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', animationDelay: `${index * 50}ms` }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-light)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'translateY(0)' }}>
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
                        {movie.genreIds?.slice(0, 2).map((gid, i) => (
                          <span
                            key={i}
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
            </>
          )
        ) : movies.length === 0 ? (
          <p className="text-center" style={{ color: 'var(--color-text-muted)' }}>
            {activeTab === 'NOW_SHOWING'
              ? 'No movies are currently showing.'
              : activeTab === 'COMING_SOON'
                ? 'No upcoming movies.'
                : 'No movies found.'}
          </p>
        ) : (
          <div key={gridKey} className="grid-transition grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {movies.map(movie => (
              <Link
                key={movie.id}
                to={`/movies/${movie.slug}`}
                className="rounded-lg overflow-hidden transition-all relative"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-light)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'translateY(0)' }}>
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
                    {movie.genreIds?.slice(0, 2).map((gid, i) => (
                      <span
                        key={i}
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
        {!isSearching && totalPages > 1 && (
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
