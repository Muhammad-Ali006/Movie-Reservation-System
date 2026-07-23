import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'

function AdminGenrePage() {
  const [genres, setGenres] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/admin" className="text-sm text-blue-600 hover:underline mb-1 block">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Manage Genres</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
          {error}
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
                    <button className="text-blue-600 hover:underline" disabled>
                      Edit
                    </button>
                    <button className="text-red-600 hover:underline" disabled>
                      Delete
                    </button>
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
