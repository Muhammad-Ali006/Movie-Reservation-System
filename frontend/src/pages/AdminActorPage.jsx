import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'

function AdminActorPage() {
  const [actors, setActors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingActor, setEditingActor] = useState(null)
  const [formData, setFormData] = useState({ name: '', bio: '', photoUrl: '' })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    fetchActors()
  }, [])

  const fetchActors = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/admin/actors')
      setActors(response.data)
    } catch (err) {
      setError('Failed to load actors')
    } finally {
      setLoading(false)
    }
  }

  const openCreateForm = () => {
    setEditingActor(null)
    setFormData({ name: '', bio: '', photoUrl: '' })
    setFormError('')
    setShowForm(true)
  }

  const openEditForm = (actor) => {
    setEditingActor(actor)
    setFormData({
      name: actor.name,
      bio: actor.bio || '',
      photoUrl: actor.photoUrl || '',
    })
    setFormError('')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingActor(null)
    setFormData({ name: '', bio: '', photoUrl: '' })
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
      if (editingActor) {
        await api.put(`/admin/actors/${editingActor.id}`, formData)
      } else {
        await api.post('/admin/actors', formData)
      }
      closeForm()
      fetchActors()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id) => {
    setDeleteError('')
    try {
      await api.delete(`/admin/actors/${id}`)
      setDeletingId(null)
      fetchActors()
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete actor')
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/admin" className="text-sm text-blue-600 hover:underline mb-1 block">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Manage Actors</h1>
        </div>
        <button
          onClick={openCreateForm}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          + Add Actor
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
            {editingActor ? 'Edit Actor' : 'Add Actor'}
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
                placeholder="Actor name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleFormChange}
                rows="3"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional bio"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photo URL
              </label>
              <input
                type="text"
                name="photoUrl"
                value={formData.photoUrl}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional photo URL"
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
                  : editingActor
                    ? 'Update Actor'
                    : 'Create Actor'}
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
        <p className="text-gray-500">Loading actors...</p>
      ) : actors.length === 0 ? (
        <p className="text-gray-500">No actors found.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Name</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Bio</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Photo</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {actors.map((actor) => (
                <tr key={actor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{actor.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{actor.bio || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {actor.photoUrl ? (
                      <img src={actor.photoUrl} alt={actor.name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm space-x-2">
                    <button
                      onClick={() => openEditForm(actor)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    {deletingId === actor.id ? (
                      <span className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(actor.id)}
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
                        onClick={() => setDeletingId(actor.id)}
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

export default AdminActorPage
