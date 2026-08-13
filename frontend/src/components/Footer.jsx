function Footer() {
  return (
    <footer
      className="h-16 flex items-center justify-center"
      style={{
        background: 'var(--color-bg)',
        borderTop: '1px solid var(--color-border)',
        color: 'var(--color-text-muted)',
      }}
    >
      <span className="text-sm">
        &copy; {new Date().getFullYear()} CINEMAX
      </span>
    </footer>
  )
}

export default Footer
