import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'

function AdminMovieForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    posterUrl: '',
    durationMinutes: '',
    releaseDate: '',
    originalLanguage: '',
    director: '',
  })
  const [genres, setGenres] = useState([])
  const [selectedGenreIds, setSelectedGenreIds] = useState([])
  const [cast, setCast] = useState([])

  const [posterFile, setPosterFile] = useState(null)
  const [posterPreview, setPosterPreview] = useState(null)

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [castActorName, setCastActorName] = useState('')
  const [castRoleName, setCastRoleName] = useState('')
  const [castPhotoFile, setCastPhotoFile] = useState(null)
  const [addingCast, setAddingCast] = useState(false)
  const [castError, setCastError] = useState('')

  const [posterUploading, setPosterUploading] = useState(false)
  const [posterError, setPosterError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const requests = [api.get('/genres')]
        if (isEditing) {
          requests.push(api.get(`/movies/${id}`))
        }
        const results = await Promise.all(requests)
        setGenres(results[0].data)
        if (isEditing) {
          const { movie, cast: movieCast, genreIds } = results[1].data
          setFormData({
            title: movie.title,
            description: movie.description || '',
            posterUrl: movie.posterUrl || '',
            durationMinutes: movie.durationMinutes,
            releaseDate: movie.releaseDate || '',
            originalLanguage: movie.originalLanguage || '',
            director: movie.director || '',
          })
          setSelectedGenreIds(genreIds || [])
          setCast(movieCast)
          if (movie.posterUrl) {
            setPosterPreview(movie.posterUrl)
          }
        }
      } catch (err) {
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, isEditing])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleGenreToggle = (genreId) => {
    setSelectedGenreIds(prev =>
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    )
  }

  const handlePosterChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPosterFile(file)
      setPosterPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const payload = {
        ...formData,
        durationMinutes: Number(formData.durationMinutes),
        genreIds: selectedGenreIds,
      }

      let movieId
      if (isEditing) {
        const res = await api.put(`/admin/movies/${id}`, payload)
        movieId = res.data.id
      } else {
        const res = await api.post('/admin/movies', payload)
        movieId = res.data.id
      }

      if (posterFile) {
        const form = new FormData()
        form.append('file', posterFile)
        await api.post(`/admin/movies/${movieId}/poster`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      navigate('/admin/movies')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save movie')
    } finally {
      setSaving(false)
    }
  }

  const handlePosterUpload = async () => {
    if (!posterFile || !id) return
    setPosterUploading(true)
    setPosterError('')
    try {
      const form = new FormData()
      form.append('file', posterFile)
      const res = await api.post(`/admin/movies/${id}/poster`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setFormData({ ...formData, posterUrl: res.data.posterUrl })
      setPosterFile(null)
    } catch (err) {
      setPosterError(err.response?.data?.message || 'Failed to upload poster')
    } finally {
      setPosterUploading(false)
    }
  }

  const handleAddCast = async (e) => {
    e.preventDefault()
    if (!castActorName.trim() || !castRoleName.trim()) return
    setAddingCast(true)
    setCastError('')
    try {
      const form = new FormData()
      form.append('actorName', castActorName.trim())
      form.append('roleName', castRoleName.trim())
      if (castPhotoFile) {
        form.append('photo', castPhotoFile)
      }
      await api.post(`/admin/movies/${id}/cast`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const res = await api.get(`/movies/${id}`)
      setCast(res.data.cast)
      setCastActorName('')
      setCastRoleName('')
      setCastPhotoFile(null)
    } catch (err) {
      setCastError(err.response?.data?.message || 'Failed to add cast member')
    } finally {
      setAddingCast(false)
    }
  }

  const handleRemoveCast = async (castId) => {
    try {
      await api.delete(`/admin/movies/${id}/cast/${castId}`)
      setCast(cast.filter(c => c.id !== castId))
    } catch (err) {
      setCastError(err.response?.data?.message || 'Failed to remove cast member')
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-6">
        <Link to="/admin/movies" className="text-sm text-blue-600 hover:underline mb-1 block">
          &larr; Back to Movies
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">
          {isEditing ? 'Edit Movie' : 'Add Movie'}
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Movie title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Movie description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
            <input
              type="number"
              name="durationMinutes"
              value={formData.durationMinutes}
              onChange={handleChange}
              required
              min="1"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 120"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Release Date</label>
            <input
              type="date"
              name="releaseDate"
              value={formData.releaseDate}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Original Language</label>
            <input
              type="text"
              name="originalLanguage"
              value={formData.originalLanguage}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. English"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Director</label>
            <input
              type="text"
              name="director"
              value={formData.director}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Christopher Nolan"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Genres</label>
          <div className="flex flex-wrap gap-2">
            {genres.map(g => (
              <label
                key={g.id}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm cursor-pointer border transition ${
                  selectedGenreIds.includes(g.id)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedGenreIds.includes(g.id)}
                  onChange={() => handleGenreToggle(g.id)}
                  className="sr-only"
                />
                {g.name}
              </label>
            ))}
          </div>
          {genres.length === 0 && (
            <p className="text-gray-500 text-sm">No genres available. Create genres first.</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {saving ? 'Saving...' : isEditing ? 'Update Movie' : 'Create Movie'}
          </button>
          <Link
            to="/admin/movies"
            className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 text-sm inline-flex items-center"
          >
            Cancel
          </Link>
        </div>
      </form>

      <div className="mt-8 space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Poster</h2>

          {posterPreview && (
            <img
              src={posterPreview}
              alt="Poster preview"
              className="mb-4 rounded max-h-64 object-contain"
            />
          )}

          <div className="flex items-center gap-3">
            <label className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 cursor-pointer inline-block">
              Choose Poster Image
              <input
                type="file"
                accept="image/*"
                onChange={handlePosterChange}
                className="hidden"
              />
            </label>
            {posterFile && (
              <span className="text-sm text-gray-500">{posterFile.name}</span>
            )}
            {posterFile && isEditing && (
              <button
                type="button"
                onClick={handlePosterUpload}
                disabled={posterUploading}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {posterUploading ? 'Uploading...' : 'Upload Poster'}
              </button>
            )}
          </div>

          {!isEditing && posterFile && (
            <p className="text-gray-500 text-sm mt-2">Poster will be uploaded after creating the movie.</p>
          )}

          {posterError && (
            <div className="bg-red-50 text-red-600 p-2 rounded mt-2 text-sm">{posterError}</div>
          )}
        </div>

        {isEditing && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Cast</h2>

            {castError && (
              <div className="bg-red-50 text-red-600 p-2 rounded mb-4 text-sm">{castError}</div>
            )}

            {cast.length > 0 ? (
              <div className="space-y-2 mb-4">
                {cast.map((c) => (
                  <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded px-4 py-2">
                    <div className="flex items-center gap-3">
                      {c.photoUrl ? (
                        <img src={c.photoUrl} alt={c.actorName} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 text-xs">
                          {c.actorName?.charAt(0)}
                        </div>
                      )}
                      <span className="text-sm">
                        <span className="font-medium">{c.actorName}</span>
                        <span className="text-gray-500"> as </span>
                        <span>{c.roleName}</span>
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveCast(c.id)}
                      className="text-red-600 text-sm hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm mb-4">No cast members yet.</p>
            )}

            <form onSubmit={handleAddCast} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Actor Name</label>
                  <input
                    type="text"
                    value={castActorName}
                    onChange={(e) => setCastActorName(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Christian Bale"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Character Name</label>
                  <input
                    type="text"
                    value={castRoleName}
                    onChange={(e) => setCastRoleName(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Bruce Wayne"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Actor Photo</label>
                  <label className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 cursor-pointer inline-block">
                    Choose Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCastPhotoFile(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                  {castPhotoFile && (
                    <span className="text-sm text-gray-500 ml-2">{castPhotoFile.name}</span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={addingCast}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap mt-5"
                >
                  {addingCast ? 'Adding...' : 'Add Cast'}
                </button>
              </div>
            </form>
          </div>
        )}

        {!isEditing && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Cast</h2>
            <p className="text-gray-500 text-sm">Cast can be added after creating the movie. Save the movie first, then edit it to add cast members.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminMovieForm
