import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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

  useEffect(() => {
    fetchGenres()
  }, [])

  const fetchGenres = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/genres')
      setGenres(response.data)
    } catch (err) {
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
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/admin" className="text-sm text-blue-600 hover:underline mb-1 block">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Manage Genres</h1>
        </div>
        <button
          onClick={openCreateForm}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          + Add Genre
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingGenre ? 'Edit Genre' : 'Add Genre'}
          </h2>

          {formError && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
              {formError}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Genre name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                rows="3"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional description"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={formLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {formLoading
                  ? 'Saving...'
                  : editingGenre
                    ? 'Update Genre'
                    : 'Create Genre'}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteError && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
          {deleteError}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading genres...</p>
      ) : genres.length === 0 ? (
        <p className="text-gray-500">No genres found.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Name</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Description</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {genres.map((genre) => (
                <tr key={genre.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{genre.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{genre.description || '—'}</td>
                  <td className="px-6 py-4 text-right text-sm space-x-2">
                    <button
                      onClick={() => openEditForm(genre)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    {deletingId === genre.id ? (
                      <span className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(genre.id)}
                          className="text-red-600 font-medium hover:underline"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="text-gray-500 hover:underline"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setDeletingId(genre.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
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
