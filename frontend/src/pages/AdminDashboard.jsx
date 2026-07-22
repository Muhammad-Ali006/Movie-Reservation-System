import { Link } from 'react-router-dom'

function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  return (
    <div className="max-w-7xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
      <p className="text-gray-600 mb-8">
        Welcome, <span className="font-semibold">{user?.username}</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/genres"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold text-blue-600 mb-2">Genres</h2>
          <p className="text-gray-500 text-sm">Add, edit, or remove genres</p>
        </Link>

        <Link
          to="/admin/movies"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold text-blue-600 mb-2">Movies</h2>
          <p className="text-gray-500 text-sm">Manage movies, posters, and cast</p>
        </Link>

        <Link
          to="/admin/actors"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold text-blue-600 mb-2">Actors</h2>
          <p className="text-gray-500 text-sm">Add or edit actors</p>
        </Link>
      </div>
    </div>
  )
}

export default AdminDashboard
