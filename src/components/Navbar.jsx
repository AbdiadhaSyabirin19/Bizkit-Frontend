import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Navbar({ title, setIsOpen }) {
  const { user, logout } = useAuth()
  const { isDarkMode, toggleDarkMode } = useTheme()
  const navigate = useNavigate()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

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
    <header className="bg-white dark:bg-black text-gray-800 dark:text-white px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm border-b border-gray-100 dark:border-gray-800 transition-all duration-300">

      {/* Hamburger + Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95"
        >
          <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="font-bold text-lg tracking-tight text-gray-800 dark:text-white uppercase">{title || 'Dashboard'}</h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 px-3 py-2 rounded-xl transition-all duration-200 group"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-800 dark:text-white leading-none mb-1">{user?.name || 'User'}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                {user?.role?.name || 'Administrator'}
              </p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl flex items-center justify-center transition-all group-hover:scale-105">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </button>

          {/* Dropdown Menu - Glassmorphism */}
          <div className={`
            absolute right-0 mt-3 w-64 bg-white dark:bg-gray-950 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden text-gray-700
            transition-all duration-300 origin-top-right z-50
            ${isDropdownOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
          `}>
            <div className="px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] leading-none mb-1.5">Profil Saya</p>
              <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{user?.name || user?.username || 'Admin'}</p>
            </div>

            <div className="p-2 space-y-1">
              <button 
                onClick={toggleDarkMode}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 group"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-sm ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-orange-500/10 text-orange-500'}`}>
                  {isDarkMode ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707" />
                    </svg>
                  )}
                </div>
                <span className="flex-1 text-left dark:text-gray-200 font-medium">Mode Gelap</span>
                <div className={`w-9 h-5 rounded-full transition-all relative ${isDarkMode ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${isDarkMode ? 'left-5' : 'left-1'}`}></div>
                </div>
              </button>

              <button 
                onClick={() => { setIsDropdownOpen(false); navigate('/change-password') }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-500/10 dark:bg-gray-400/10 text-gray-500 dark:text-gray-400 flex items-center justify-center transition-all group-hover:bg-gray-500 group-hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <span className="flex-1 text-left dark:text-gray-200 font-medium">Ganti Kata Sandi</span>
              </button>
            </div>

            <div className="p-2 border-t border-gray-100 dark:border-gray-800/50">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all duration-200 group text-red-600 dark:text-red-400"
              >
                <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center transition-all group-hover:bg-white/20 group-hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <span className="flex-1 text-left">Keluar Sesi</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}