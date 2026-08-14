import { Link } from 'react-router-dom'
import { SearchX, ArrowLeft, Film } from 'lucide-react'

function NotFoundPage({ title = 'Page Not Found', message = "The page you're looking for doesn't exist or has been moved." }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 pt-20">
      <div className="text-center max-w-md">
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
          style={{ backgroundColor: 'var(--color-accent-light)' }}
        >
          <SearchX className="w-10 h-10" style={{ color: 'var(--color-accent)' }} />
        </div>
        <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-accent)' }}>
          404
        </p>
        <h1 className="text-3xl font-semibold mb-3">{title}</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
          {message}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <Link
            to="/movies"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--color-accent)',
              border: '1px solid var(--color-accent)',
            }}
          >
            <Film className="w-4 h-4" /> Browse Movies
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
