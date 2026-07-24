import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../utils/api'

function MovieDetailPage() {
  const { id } = useParams()
  const [movie, setMovie] = useState(null)
  const [cast, setCast] = useState([])
  const [genres, setGenres] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [movieRes, genresRes] = await Promise.all([
          api.get(`/movies/${id}`),
          api.get('/genres'),
        ])
        setMovie(movieRes.data.movie)
        setCast(movieRes.data.cast)
        setGenres(genresRes.data)
      } catch (err) {
        setError('Failed to load movie details')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const genreMap = Object.fromEntries(genres.map(g => [g.id, g.name]))

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <p className="text-gray-500">Loading movie details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <Link to="/movies" className="text-sm text-blue-600 hover:underline mb-4 block">
          &larr; Back to Movies
        </Link>
        <div className="bg-red-50 text-red-600 p-3 rounded text-sm">{error}</div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <Link to="/movies" className="text-sm text-blue-600 hover:underline mb-4 block">
          &larr; Back to Movies
        </Link>
        <p className="text-gray-500">Movie not found.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Link to="/movies" className="text-sm text-blue-600 hover:underline mb-6 block">
        &larr; Back to Movies
      </Link>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full md:w-80 h-96 md:h-auto object-cover"
            />
          ) : (
            <div className="w-full md:w-80 h-96 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No Poster</span>
            </div>
          )}

          <div className="p-6 flex-1">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{movie.title}</h1>

            <div className="flex items-center gap-4 mb-4">
              <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                {genreMap[movie.genreId] || 'Unknown Genre'}
              </span>
              <span className="text-gray-500 text-sm">
                {movie.durationMinutes} min
              </span>
            </div>

            {movie.description && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-2">Description</h2>
                <p className="text-gray-600 leading-relaxed">{movie.description}</p>
              </div>
            )}
          </div>
        </div>

        {cast.length > 0 && (
          <div className="border-t p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Cast</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {cast.map((member) => (
                <div key={member.id} className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-gray-800">{member.actorName}</p>
                  <p className="text-sm text-gray-500">as {member.roleName}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MovieDetailPage
