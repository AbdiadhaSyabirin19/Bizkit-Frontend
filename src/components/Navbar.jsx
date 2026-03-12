import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar({ title, setIsOpen }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="bg-[#00a37b] text-white px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm border-b border-black/5">

      {/* Hamburger + Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition backdrop-blur-sm"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="font-bold text-lg tracking-tight uppercase">{title || 'Dashboard'}</h1>
      </div>

      {/* User Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-3 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all duration-200 group"
        >
          <span className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">{user?.name || user?.Name || 'User'}</span>
          <div className="w-9 h-9 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center backdrop-blur-md group-hover:border-white/40 transition-all">
            <svg className="w-5 h-5 text-white/90 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </button>

        {/* Dropdown Menu */}
        <div className={`
          absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden text-gray-700
          transition-all duration-200 origin-top-right
          ${isDropdownOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
        `}>
          <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-100">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none">Logged in as</p>
            <p className="text-sm font-bold text-gray-800 mt-1.5 truncate">Hi, {user?.name || user?.username || 'ownerdemo'}</p>
          </div>

          <div className="p-2">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-white transition-colors">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </div>
              <span className="flex-1 text-left">Dark Mode</span>
              <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
            </button>

            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-white transition-colors">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <span className="flex-1 text-left">Ganti Kata Sandi</span>
            </button>
          </div>

          <div className="p-2 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-lg hover:bg-red-50 text-red-600 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <span className="flex-1 text-left">Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}