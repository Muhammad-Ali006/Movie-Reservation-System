import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../utils/api'

function MovieDetailPage() {
  const { slug } = useParams()
  const [movie, setMovie] = useState(null)
  const [cast, setCast] = useState([])
  const [genreIds, setGenreIds] = useState([])
  const [genres, setGenres] = useState([])
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
      } catch (err) {
        setError('Failed to load movie details')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [slug])

  const genreMap = Object.fromEntries(genres.map(g => [g.id, g.name]))
  const movieGenres = genreIds.map(gid => genreMap[gid]).filter(Boolean)

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-8">
        <p className="text-gray-500">Loading movie details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto py-8">
        <Link to="/movies" className="text-sm text-blue-600 hover:underline mb-4 block">
          &larr; Back to Movies
        </Link>
        <div className="bg-red-50 text-red-600 p-3 rounded text-sm">{error}</div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="max-w-5xl mx-auto py-8">
        <Link to="/movies" className="text-sm text-blue-600 hover:underline mb-4 block">
          &larr; Back to Movies
        </Link>
        <p className="text-gray-500">Movie not found.</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
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
            <h1 className="text-3xl font-bold text-gray-800 mb-3">{movie.title}</h1>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              {movieGenres.map((genreName, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                >
                  {genreName}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div>
                <span className="text-gray-500">Duration:</span>
                <span className="ml-2 text-gray-800">{movie.durationMinutes} min</span>
              </div>
              {movie.releaseDate && (
                <div>
                  <span className="text-gray-500">Release Date:</span>
                  <span className="ml-2 text-gray-800">{movie.releaseDate}</span>
                </div>
              )}
              {movie.originalLanguage && (
                <div>
                  <span className="text-gray-500">Language:</span>
                  <span className="ml-2 text-gray-800">{movie.originalLanguage}</span>
                </div>
              )}
              {movie.director && (
                <div>
                  <span className="text-gray-500">Director:</span>
                  <span className="ml-2 text-gray-800">{movie.director}</span>
                </div>
              )}
            </div>

            {movie.description && (
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-2">Description</h2>
                <p className="text-gray-600 leading-relaxed">{movie.description}</p>
              </div>
            )}
          </div>
        </div>

        {cast.length > 0 && (
          <div className="border-t p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Cast</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {cast.map((member) => (
                <div key={member.id} className="text-center">
                  {member.photoUrl ? (
                    <img
                      src={member.photoUrl}
                      alt={member.actorName}
                      className="w-20 h-20 rounded-full object-cover mx-auto mb-2"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center mx-auto mb-2">
                      <span className="text-gray-500 text-xl">{member.actorName?.charAt(0)}</span>
                    </div>
                  )}
                  <p className="font-medium text-gray-800 text-sm">{member.actorName}</p>
                  <p className="text-xs text-gray-500">as {member.roleName}</p>
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
