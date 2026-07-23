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
    genreId: '',
    durationMinutes: '',
  })
  const [genres, setGenres] = useState([])
  const [actors, setActors] = useState([])
  const [cast, setCast] = useState([])

  const [posterFile, setPosterFile] = useState(null)
  const [posterPreview, setPosterPreview] = useState(null)

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [castActorId, setCastActorId] = useState('')
  const [castRoleName, setCastRoleName] = useState('')
  const [addingCast, setAddingCast] = useState(false)
  const [castError, setCastError] = useState('')

  const [posterUploading, setPosterUploading] = useState(false)
  const [posterError, setPosterError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const requests = [
          api.get('/genres'),
          api.get('/actors'),
        ]
        if (isEditing) {
          requests.push(api.get(`/movies/${id}`))
        }
        const results = await Promise.all(requests)
        setGenres(results[0].data)
        setActors(results[1].data)
        if (isEditing) {
          const { movie, cast: movieCast } = results[2].data
          setFormData({
            title: movie.title,
            description: movie.description || '',
            posterUrl: movie.posterUrl || '',
            genreId: movie.genreId,
            durationMinutes: movie.durationMinutes,
          })
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
        genreId: Number(formData.genreId),
        durationMinutes: Number(formData.durationMinutes),
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
    if (!castActorId || !castRoleName.trim()) return
    setAddingCast(true)
    setCastError('')
    try {
      await api.post(`/admin/movies/${id}/cast`, {
        actorId: Number(castActorId),
        roleName: castRoleName.trim(),
      })
      const res = await api.get(`/movies/${id}`)
      setCast(res.data.cast)
      setCastActorId('')
      setCastRoleName('')
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

  const availableActors = actors.filter(
    a => !cast.some(c => c.actorId === a.id)
  )

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
            <select
              name="genreId"
              value={formData.genreId}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select genre</option>
              {genres.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

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

      {isEditing && (
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
              <input
                type="file"
                accept="image/*"
                onChange={handlePosterChange}
                className="text-sm text-gray-600"
              />
              {posterFile && (
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

            {posterError && (
              <div className="bg-red-50 text-red-600 p-2 rounded mt-2 text-sm">{posterError}</div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Cast</h2>

            {castError && (
              <div className="bg-red-50 text-red-600 p-2 rounded mb-4 text-sm">{castError}</div>
            )}

            {cast.length > 0 ? (
              <div className="space-y-2 mb-4">
                {cast.map((c) => (
                  <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded px-4 py-2">
                    <span className="text-sm">
                      <span className="font-medium">{c.actorName}</span>
                      <span className="text-gray-500"> as </span>
                      <span>{c.roleName}</span>
                    </span>
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

            {availableActors.length > 0 ? (
              <form onSubmit={handleAddCast} className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Actor</label>
                  <select
                    value={castActorId}
                    onChange={(e) => setCastActorId(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select actor</option>
                    {availableActors.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                  <input
                    type="text"
                    value={castRoleName}
                    onChange={(e) => setCastRoleName(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Batman"
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingCast}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                >
                  {addingCast ? 'Adding...' : 'Add'}
                </button>
              </form>
            ) : (
              <p className="text-gray-500 text-sm">All actors have been assigned.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminMovieForm
