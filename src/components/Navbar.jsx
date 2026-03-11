import { useAuth } from '../context/AuthContext'

export default function Navbar({ title, setIsOpen }) {
  const { user } = useAuth()

  return (
    <header className="bg-emerald-700 text-white px-6 py-3 flex items-center justify-between sticky top-0 z-10">

      {/* Hamburger + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className="lg:hidden p-1 rounded hover:bg-emerald-600 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="font-semibold text-base">{title || 'Dashboard'}</h1>
      </div>

      {/* User */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-emerald-100">{user?.name}</span>
        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      </div>
    </header>
  )
}