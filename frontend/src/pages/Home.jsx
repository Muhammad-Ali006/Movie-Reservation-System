function Home() {
  const token = localStorage.getItem('token')

  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">
        Movie Reservation System
      </h1>
      <p className="text-gray-600 text-lg mb-8">
        Browse movies, view showtimes, and reserve your seats
      </p>
      {!token && (
        <div className="space-x-4">
          <a
            href="/signup"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Get Started
          </a>
          <a
            href="/login"
            className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50"
          >
            Login
          </a>
        </div>
      )}
      {token && (
        <p className="text-green-600 text-lg">
          Movies coming soon! Backend API is being built.
        </p>
      )}
    </div>
  )
}

export default Home
