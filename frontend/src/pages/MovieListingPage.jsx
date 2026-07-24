import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'

function MovieListingPage() {
  const [movies, setMovies] = useState([])
  const [genres, setGenres] = useState([])
  const [selectedGenre, setSelectedGenre] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moviesRes, genresRes] = await Promise.all([
          api.get('/movies'),
          api.get('/genres'),
        ])
        setMovies(moviesRes.data)
        setGenres(genresRes.data)
      } catch (err) {
        setError('Failed to load movies')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const genreMap = Object.fromEntries(genres.map(g => [g.id, g.name]))

  const filteredMovies = selectedGenre
    ? movies.filter(m => m.genreId === Number(selectedGenre))
    : movies

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <p className="text-gray-500">Loading movies...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <div className="bg-red-50 text-red-600 p-3 rounded text-sm">{error}</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Browse Movies</h1>

        <div className="flex items-center gap-2">
          <label htmlFor="genre-filter" className="text-sm text-gray-600">
            Genre:
          </label>
          <select
            id="genre-filter"
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Genres</option>
            {genres.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredMovies.length === 0 ? (
        <p className="text-gray-500">
          {selectedGenre ? 'No movies found for this genre.' : 'No movies available.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMovies.map(movie => (
            <Link
              key={movie.id}
              to={`/movies/${movie.id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {movie.posterUrl ? (
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">No Poster</span>
                </div>
              )}

              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-1 truncate">
                  {movie.title}
                </h2>
                <p className="text-sm text-gray-600 mb-2">
                  {genreMap[movie.genreId] || 'Unknown Genre'}
                </p>
                <p className="text-sm text-gray-500">
                  {movie.durationMinutes} min
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default MovieListingPage
