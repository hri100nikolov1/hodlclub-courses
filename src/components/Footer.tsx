export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="container mx-auto max-w-6xl px-4 py-4">
        <p className="text-center text-xs text-gray-400">
          © {new Date().getFullYear()} HODLClub. Всички права запазени.{' '}
          <span className="mx-1">·</span>
          Съдържанието е с <span className="font-medium">образователна цел</span> и не представлява финансов съвет или препоръка за инвестиция.{' '}
          <span className="mx-1">·</span>
          <a href="/privacy" className="hover:text-gray-600 underline transition">
            Политика за поверителност
          </a>
        </p>
      </div>
    </footer>
  )
}
