import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import api from '../utils/api'

function AdminMovieForm() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(slug)
  const [movieId, setMovieId] = useState(null)

  const [formData, setFormData] = useState({
    title: '', description: '', posterUrl: '', durationMinutes: '',
    releaseDate: '', originalLanguage: '', director: '',
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
  const [castPhotoPreview, setCastPhotoPreview] = useState(null)
  const [addingCast, setAddingCast] = useState(false)
  const [castError, setCastError] = useState('')

  const [posterUploading, setPosterUploading] = useState(false)
  const [posterError, setPosterError] = useState('')
  const [movieCreated, setMovieCreated] = useState(false)
  const [createdSlug, setCreatedSlug] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const requests = [api.get('/genres')]
        if (isEditing) requests.push(api.get(`/movies/${slug}`))
        const results = await Promise.all(requests)
        setGenres(results[0].data)
        if (isEditing) {
          const { movie, cast: movieCast, genreIds } = results[1].data
          setMovieId(movie.id)
          setFormData({
            title: movie.title, description: movie.description || '', posterUrl: movie.posterUrl || '',
            durationMinutes: movie.durationMinutes, releaseDate: movie.releaseDate || '',
            originalLanguage: movie.originalLanguage || '', director: movie.director || '',
          })
          setSelectedGenreIds(genreIds || [])
          setCast(movieCast)
          if (movie.posterUrl) setPosterPreview(movie.posterUrl)
        }
      } catch (err) {
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [slug, isEditing])

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleGenreToggle = (genreId) => {
    setSelectedGenreIds(prev => prev.includes(genreId) ? prev.filter(id => id !== genreId) : [...prev, genreId])
  }

  const handlePosterChange = (e) => {
    const file = e.target.files[0]
    if (file) { setPosterFile(file); setPosterPreview(URL.createObjectURL(file)) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...formData, durationMinutes: Number(formData.durationMinutes), genreIds: selectedGenreIds }
      if (!payload.posterUrl) delete payload.posterUrl
      if (!payload.releaseDate) delete payload.releaseDate
      if (!payload.originalLanguage) delete payload.originalLanguage
      if (!payload.director) delete payload.director

      let newMovieId
      if (isEditing) {
        await api.put(`/admin/movies/${movieId}`, payload)
        newMovieId = movieId
      } else {
        const res = await api.post('/admin/movies', payload)
        newMovieId = res.data.id
        setMovieId(newMovieId)
        setCreatedSlug(res.data.slug)
        setMovieCreated(true)
      }

      if (posterFile) {
        const form = new FormData()
        form.append('file', posterFile)
        await api.post(`/admin/movies/${newMovieId}/poster`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      if (!isEditing) return
      navigate('/admin/movies')
    } catch (err) {
      setError(err.response?.data?.message || `Failed to save movie (error ${err.response?.status || 'network'})`)
    } finally {
      setSaving(false)
    }
  }

  const handlePosterUpload = async () => {
    if (!posterFile || !movieId) return
    setPosterUploading(true)
    setPosterError('')
    try {
      const form = new FormData()
      form.append('file', posterFile)
      const res = await api.post(`/admin/movies/${movieId}/poster`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
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
      if (castPhotoFile) form.append('photo', castPhotoFile)
      await api.post(`/admin/movies/${movieId}/cast`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      const fetchSlug = slug || createdSlug
      const res = await api.get(`/movies/${fetchSlug}`)
      setCast(res.data.cast)
      setCastActorName('')
      setCastRoleName('')
      setCastPhotoFile(null)
      setCastPhotoPreview(null)
    } catch (err) {
      setCastError(err.response?.data?.message || 'Failed to add cast member')
    } finally {
      setAddingCast(false)
    }
  }

  const handleRemoveCast = async (castId) => {
    try {
      await api.delete(`/admin/movies/${movieId}/cast/${castId}`)
      setCast(cast.filter(c => c.id !== castId))
    } catch (err) {
      setCastError(err.response?.data?.message || 'Failed to remove cast member')
    }
  }

  if (loading) return <div className="max-w-3xl mx-auto px-6 py-8 pt-20"><p style={{ color: 'var(--color-text-muted)' }}>Loading...</p></div>

  const inputStyle = { border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }
  const labelStyle = { color: 'var(--color-text-secondary)' }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 pt-20">
      <div className="mb-6">
        <Link to="/admin/movies" className="flex items-center gap-1 text-sm mb-1" style={{ color: 'var(--color-primary)' }}>
          <ArrowLeft className="w-4 h-4" /> Back to Movies
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
          {isEditing ? 'Edit Movie' : movieCreated ? 'Movie Created!' : 'Add Movie'}
        </h1>
        {movieCreated && !isEditing && (
          <p className="flex items-center gap-1 text-sm mt-1" style={{ color: 'var(--color-success)' }}>
            <CheckCircle className="w-4 h-4" /> Movie created successfully. You can now add cast members below, or click Done.
          </p>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded mb-4 text-sm" style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)' }}>
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {(!movieCreated || isEditing) && (
        <form onSubmit={handleSubmit} className="rounded-lg p-6 space-y-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div>
            <label className="block text-sm font-medium mb-1" style={labelStyle}>Title</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required
              className="w-full rounded-lg px-4 py-2" style={inputStyle} placeholder="Movie title" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={labelStyle}>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows="3"
              className="w-full rounded-lg px-4 py-2" style={inputStyle} placeholder="Movie description" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={labelStyle}>Duration (minutes)</label>
              <input type="number" name="durationMinutes" value={formData.durationMinutes} onChange={handleChange} required min="1"
                className="w-full rounded-lg px-4 py-2" style={inputStyle} placeholder="e.g. 120" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={labelStyle}>Release Date</label>
              <input type="date" name="releaseDate" value={formData.releaseDate} onChange={handleChange}
                className="w-full rounded-lg px-4 py-2" style={inputStyle} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={labelStyle}>Original Language</label>
              <input type="text" name="originalLanguage" value={formData.originalLanguage} onChange={handleChange}
                className="w-full rounded-lg px-4 py-2" style={inputStyle} placeholder="e.g. English" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={labelStyle}>Director</label>
              <input type="text" name="director" value={formData.director} onChange={handleChange}
                className="w-full rounded-lg px-4 py-2" style={inputStyle} placeholder="e.g. Christopher Nolan" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={labelStyle}>Genres</label>
            <div className="flex flex-wrap gap-2">
              {genres.map(g => (
                <label key={g.id}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm cursor-pointer border transition`}
                  style={selectedGenreIds.includes(g.id)
                    ? { backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: '#fff' }
                    : { borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  <input type="checkbox" checked={selectedGenreIds.includes(g.id)} onChange={() => handleGenreToggle(g.id)} className="sr-only" />
                  {g.name}
                </label>
              ))}
            </div>
            {genres.length === 0 && <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No genres available. Create genres first.</p>}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              {saving ? 'Saving...' : isEditing ? 'Update Movie' : 'Create Movie'}
            </button>
            <Link to="/admin/movies"
              className="px-6 py-2 rounded-lg text-sm inline-flex items-center"
              style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
              Cancel
            </Link>
          </div>
        </form>
      )}

      {(!movieCreated || isEditing) && (
        <div className="mt-8 space-y-6">
          <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Poster</h2>
            {posterPreview && <img src={posterPreview} alt="Poster preview" className="mb-4 rounded max-h-64 object-contain" />}
            <div className="flex items-center gap-3">
              <label className="px-4 py-2 rounded-lg text-sm cursor-pointer inline-block"
                style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                Choose Poster Image
                <input type="file" accept="image/*" onChange={handlePosterChange} className="hidden" />
              </label>
              {posterFile && <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{posterFile.name}</span>}
              {posterFile && isEditing && (
                <button type="button" onClick={handlePosterUpload} disabled={posterUploading}
                  className="text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                  style={{ backgroundColor: 'var(--color-primary)' }}>
                  {posterUploading ? 'Uploading...' : 'Upload Poster'}
                </button>
              )}
            </div>
            {!isEditing && posterFile && <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>Poster will be uploaded after creating the movie.</p>}
            {posterError && <div className="flex items-center gap-1 p-2 rounded mt-2 text-sm" style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)' }}><AlertCircle className="w-4 h-4" /> {posterError}</div>}
          </div>
        </div>
      )}

      {(isEditing || movieCreated) && (
        <div className="mt-8 rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Cast</h2>
          {castError && (
            <div className="flex items-center gap-1 p-2 rounded mb-4 text-sm" style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)' }}>
              <AlertCircle className="w-4 h-4" /> {castError}
            </div>
          )}
          {cast.length > 0 ? (
            <div className="space-y-2 mb-4">
              {cast.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2 rounded px-3 sm:px-4 py-2" style={{ backgroundColor: 'var(--color-bg)' }}>
                  <div className="flex items-center gap-3 min-w-0">
                    {c.photoUrl ? (
                      <img src={c.photoUrl} alt={c.actorName} className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                        style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)' }}>
                        {c.actorName?.charAt(0)}
                      </div>
                    )}
                    <span className="text-sm min-w-0 truncate">
                      <span className="font-medium" style={{ color: 'var(--color-text)' }}>{c.actorName}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}> as </span>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{c.roleName}</span>
                    </span>
                  </div>
                  <button onClick={() => handleRemoveCast(c.id)} className="text-sm hover:underline" style={{ color: 'var(--color-error)' }}>Remove</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>No cast members yet.</p>
          )}

          <form onSubmit={handleAddCast} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>Actor Name</label>
                <input type="text" value={castActorName} onChange={(e) => setCastActorName(e.target.value)} required
                  className="w-full rounded-lg px-4 py-2 text-sm" style={inputStyle} placeholder="e.g. Christian Bale" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>Character Name</label>
                <input type="text" value={castRoleName} onChange={(e) => setCastRoleName(e.target.value)} required
                  className="w-full rounded-lg px-4 py-2 text-sm" style={inputStyle} placeholder="e.g. Bruce Wayne" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1" style={labelStyle}>Actor Photo</label>
                {castPhotoPreview && <img src={castPhotoPreview} alt="Cast preview" className="mb-2 rounded" style={{ height: '80px', width: '80px', objectFit: 'cover' }} />}
                <label className="px-4 py-2 rounded-lg text-sm cursor-pointer inline-block"
                  style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  Choose Photo
                  <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files[0]; if (file) { setCastPhotoFile(file); setCastPhotoPreview(URL.createObjectURL(file)) } }} className="hidden" />
                </label>
                {castPhotoFile && <span className="text-sm ml-2" style={{ color: 'var(--color-text-muted)' }}>{castPhotoFile.name}</span>}
              </div>
              <button type="submit" disabled={addingCast}
                className="text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 whitespace-nowrap sm:mt-5"
                style={{ backgroundColor: 'var(--color-primary)' }}>
                {addingCast ? 'Adding...' : 'Add Cast'}
              </button>
            </div>
          </form>

          {movieCreated && !isEditing && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
              <Link to="/admin/movies"
                className="text-white px-6 py-2 rounded-lg text-sm inline-block"
                style={{ backgroundColor: 'var(--color-surface-hover)' }}>
                Done
              </Link>
            </div>
          )}
        </div>
      )}

      {!isEditing && !movieCreated && (
        <div className="mt-8 rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Cast</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Cast can be added after creating the movie. Save the movie first, then add cast members.</p>
        </div>
      )}
    </div>
  )
}

export default AdminMovieForm
