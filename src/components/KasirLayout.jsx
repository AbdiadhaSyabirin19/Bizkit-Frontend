import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePermission } from '../hooks/usePermission'

const NAV_ITEMS = [
  {
    path: '/kasir',
    exact: true,
    label: 'Kasir',
    module: 'kasir_pos',
    icon: (active) => (
      <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2}
          d={active
            ? "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            : "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          }
        />
      </svg>
    ),
  },
  {
    path: '/kasir/dashboard',
    label: 'Dashboard',
    module: 'kasir_dashboard',
    icon: (active) => (
      <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2}
          d={active
            ? "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            : "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          }
        />
      </svg>
    ),
  },
  {
    path: '/kasir/riwayat',
    label: 'Riwayat',
    module: 'kasir_riwayat',
    icon: (active) => (
      <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2}
          d={active
            ? "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            : "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          }
        />
      </svg>
    ),
  },
  {
    path: '/kasir/shift',
    label: 'Shift',
    module: 'kasir_shift',
    icon: (active) => (
      <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2}
          d={active
            ? "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            : "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          }
        />
      </svg>
    ),
  },
]

export default function KasirLayout({ children, title }) {
  const { user, logout } = useAuth()
  const { canView } = usePermission()
  const navigate = useNavigate()
  const location = useLocation()
  
  const visibleNav = NAV_ITEMS.filter(item => canView(item.module))
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/kasir/login')
  }

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path
    return location.pathname.startsWith(item.path)
  }

  const userName = user?.name || user?.Name || 'Kasir'
  const outletName = user?.outlet?.Name || user?.outlet?.name || 'Outlet'
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Navbar Atas ── */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100 h-14 flex items-center px-4 gap-3 shadow-sm">
        {/* Logo */}
        <Link to="/kasir" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm shadow-emerald-200">
            <span className="text-white text-sm font-black">B</span>
          </div>
          <div className="hidden sm:block">
            <span className="text-sm font-bold text-gray-800">BizKit</span>
            <span className="text-xs text-emerald-600 font-semibold ml-1.5">Kasir</span>
          </div>
        </Link>

        {/* Title halaman */}
        <div className="flex-1 text-center">
          <h1 className="text-sm font-semibold text-gray-700 tracking-wide">{title}</h1>
        </div>

        {/* User info + logout */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-gray-700 leading-none">{userName}</p>
            <p className="text-xs text-gray-400 mt-0.5">{outletName}</p>
          </div>
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-emerald-200">
            <span className="text-emerald-700 text-sm font-bold">{userInitial}</span>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-500"
            title="Logout"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex flex-1 pt-14">

        {/* ── Sidebar Mini (desktop only) ── */}
        <aside className="hidden md:flex fixed left-0 top-14 bottom-0 w-16 bg-white border-r border-gray-100 flex-col items-center py-3 gap-1 z-20">
          {visibleNav.map(item => {
            const active = isActive(item)
            return (
              <Link key={item.path} to={item.path}
                className={`relative flex flex-col items-center gap-1 w-12 py-2.5 rounded-xl transition-all duration-200 group ${
                  active
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                }`}
                title={item.label}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-emerald-500 rounded-r-full" />
                )}
                {item.icon(active)}
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            )
          })}
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 md:ml-16 pb-20 md:pb-6 overflow-x-hidden">
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>

      {/* ── Bottom Navigation (mobile only) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 flex shadow-lg">
        {visibleNav.map(item => {
          const active = isActive(item)
          return (
            <Link key={item.path} to={item.path}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors relative ${
                active ? 'text-emerald-600' : 'text-gray-400'
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-500 rounded-b-full" />
              )}
              {item.icon(active)}
              <span className={`text-[10px] font-semibold ${active ? 'text-emerald-600' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* ── Confirm Logout Dialog ── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl text-center animate-in">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-800 mb-1">Keluar dari Kasir?</h3>
            <p className="text-sm text-gray-400 mb-5">Keranjang yang belum dibayar akan hilang.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button onClick={handleLogout}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors">
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}