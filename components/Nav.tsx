import Link from 'next/link'

export default function Nav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-stone-100">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-stone-900 hover:text-stone-600 transition-colors"
        >
          Bradley Mering
        </Link>
        <nav className="flex items-center gap-8">
          <Link
            href="/"
            className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
          >
            Journal
          </Link>
          <Link
            href="/about"
            className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  )
}
