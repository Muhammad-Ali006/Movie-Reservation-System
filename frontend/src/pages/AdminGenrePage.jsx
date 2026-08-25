import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, AlertCircle, Loader2 } from 'lucide-react'
import api from '../utils/api'

function AdminGenrePage() {
  const [genres, setGenres] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingGenre, setEditingGenre] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => { fetchGenres() }, [])

  const fetchGenres = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/genres')
      setGenres(response.data)
    } catch {
      setError('Failed to load genres')
    } finally {
      setLoading(false)
    }
  }

  const openCreateForm = () => {
    setEditingGenre(null)
    setFormData({ name: '', description: '' })
    setFormError('')
    setShowForm(true)
  }

  const openEditForm = (genre) => {
    setEditingGenre(genre)
    setFormData({ name: genre.name, description: genre.description || '' })
    setFormError('')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingGenre(null)
    setFormData({ name: '', description: '' })
    setFormError('')
  }

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setFormError('')
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')
    try {
      if (editingGenre) {
        await api.put(`/admin/genres/${editingGenre.id}`, formData)
      } else {
        await api.post('/admin/genres', formData)
      }
      closeForm()
      fetchGenres()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id) => {
    setDeleteError('')
    try {
      await api.delete(`/admin/genres/${id}`)
      setDeletingId(null)
      fetchGenres()
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete genre')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 pt-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <Link to="/admin" className="flex items-center gap-1 text-sm mb-1" style={{ color: 'var(--color-accent)' }}>
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-text)' }}>Manage Genres</h1>
        </div>
        <button onClick={openCreateForm} className="flex items-center gap-1 text-white px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: 'var(--color-primary)' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}>
          <Plus className="w-4 h-4" /> Add Genre
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded mb-4 text-sm animate-slide-down" style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)' }}>
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {showForm && (
        <div className="rounded-lg p-6 mb-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            {editingGenre ? 'Edit Genre' : 'Add Genre'}
          </h2>

          {formError && (
            <div className="flex items-center gap-2 p-3 rounded mb-4 text-sm animate-slide-down" style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)' }}>
              <AlertCircle className="w-4 h-4" /> {formError}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleFormChange} required
                className="w-full rounded-lg px-4 py-2" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="Genre name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Description</label>
              <textarea name="description" value={formData.description} onChange={handleFormChange} rows="3"
                className="w-full rounded-lg px-4 py-2" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="Optional description" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={formLoading}
                className="text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-primary)' }}>
                {formLoading ? 'Saving...' : editingGenre ? 'Update Genre' : 'Create Genre'}
              </button>
              <button type="button" onClick={closeForm}
                className="px-4 py-2 rounded-lg text-sm" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteError && (
        <div className="flex items-center gap-2 p-3 rounded mb-4 text-sm animate-slide-down" style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)' }}>
          <AlertCircle className="w-4 h-4" /> {deleteError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading genres...
        </div>
      ) : genres.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No genres found.</p>
      ) : (
        <div className="rounded-lg overflow-x-auto" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <table className="w-full min-w-[400px]">
            <thead style={{ backgroundColor: 'var(--color-bg)' }}>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th className="text-left px-6 py-3 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Name</th>
                <th className="text-left px-6 py-3 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Description</th>
                <th className="text-right px-6 py-3 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {genres.map((genre) => (
                <tr key={genre.id} style={{ borderBottom: '1px solid var(--color-border)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td className="px-6 py-4 text-sm font-medium" style={{ color: 'var(--color-text)' }}>{genre.name}</td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{genre.description || '—'}</td>
                  <td className="px-6 py-4 text-right text-sm space-x-2">
                    <button onClick={() => openEditForm(genre)} style={{ color: 'var(--color-text-secondary)' }} className="hover:underline"
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}>Edit</button>
                    {deletingId === genre.id ? (
                      <span className="inline-flex items-center gap-1">
                        <button onClick={() => handleDelete(genre.id)} className="font-medium hover:underline" style={{ color: 'var(--color-text-secondary)' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}>Confirm</button>
                        <button onClick={() => setDeletingId(null)} className="hover:underline" style={{ color: 'var(--color-text-muted)' }}>Cancel</button>
                      </span>
                    ) : (
                      <button onClick={() => setDeletingId(genre.id)} className="hover:underline" style={{ color: 'var(--color-text-secondary)' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminGenrePage
