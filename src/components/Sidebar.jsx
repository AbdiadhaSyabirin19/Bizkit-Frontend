import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePermission } from '../hooks/usePermission'

const menus = [
  {
    label: 'Penjualan',
    icon: 'Penjualan',
    children: [
      { label: 'Promo & Voucher', path: '/promos',  module: 'promos' },
      { label: 'Outlet',          path: '/outlets', module: 'outlets' },
    ],
  },
  {
    label: 'Produk',
    icon: 'Produk',
    children: [
      { label: 'Produk',      path: '/products',    module: 'products' },
      { label: 'Kategori',    path: '/categories',  module: 'categories' },
      { label: 'Merek',       path: '/brands',      module: 'brands' },
      { label: 'Satuan',      path: '/units',       module: 'units' },
      { label: 'Varian',      path: '/variants',    module: 'variants' },
      { label: 'Multi Harga', path: '/multi-harga', module: 'multi_harga' },
    ],
  },
  {
    label: 'Laporan',
    icon: 'Laporan',
    children: [
      {
        groupLabel: 'UMUM',
        items: [
          { label: 'Laporan Absensi',    path: '/reports/attendance', module: 'reports_attendance' },
          { label: 'Pergantian Shift',   path: '/reports/shift',      module: 'reports_shift' },
        ]
      },
      {
        groupLabel: 'PENJUALAN',
        items: [
          { label: 'Penjualan Harian',   path: '/reports/daily',      module: 'reports_daily' },
          { label: 'Rekap Penjualan',    path: '/reports/sales',      module: 'reports_sales' },
          { label: 'Trend Penjualan',    path: '/reports/trend',      module: 'reports_trend' },
        ]
      },
    ],
  },
  {
    label: 'Pengaturan',
    icon: 'Pengaturan',
    children: [
      { label: 'User',              path: '/users',           module: 'users' },
      { label: 'Hak Akses',         path: '/roles',           module: 'roles' },
      { label: 'Metode Pembayaran', path: '/payment-methods', module: 'payment_methods' },
      { label: 'Pengaturan Umum',   path: '/settings',        module: 'settings' },
    ],
  },
]

const getActiveMenuLabel = (pathname) => {
  for (const menu of menus) {
    for (const child of menu.children) {
      if (child.groupLabel) {
        for (const item of child.items) {
          if (pathname.startsWith(item.path)) return menu.label
        }
      } else {
        if (pathname.startsWith(child.path)) return menu.label
      }
    }
  }
  return null
}

const MenuIcon = ({ label }) => {
  const icons = {
    Penjualan: (
      <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7M4 18h3" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 6v0m0 6v0m0 6v0" className="opacity-0" />
        <circle cx="5" cy="6" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="5" cy="18" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
    Produk: (
      <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7M4 18h3" />
        <circle cx="5" cy="6" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="5" cy="18" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
    Laporan: (
      <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16v-4m4 4V9m4 7v-9m4 9V4" />
      </svg>
    ),
    Pengaturan: (
      <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  }
  return icons[label] || null
}

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user, logout } = useAuth()
  const { canView } = usePermission()
  const navigate = useNavigate()
  const location = useLocation()

  const [openMenus, setOpenMenus] = useState(() => {
    const activeLabel = getActiveMenuLabel(location.pathname)
    return activeLabel ? [activeLabel] : []
  })

  useEffect(() => {
    const activeLabel = getActiveMenuLabel(location.pathname)
    if (activeLabel) {
      setOpenMenus(prev => prev.includes(activeLabel) ? prev : [...prev, activeLabel])
    }
  }, [location.pathname])

  const toggleMenu = (label) => {
    setOpenMenus(prev =>
      prev.includes(label) ? prev.filter(m => m !== label) : [...prev, label]
    )
  }

  const handleLogout = () => { logout(); navigate('/login') }
  const handleNavClick = () => { if (window.innerWidth < 1024) setIsOpen(false) }

  const getVisibleChildren = (children) => {
    return children
      .map(child => {
        if (child.groupLabel) {
          const visibleItems = child.items.filter(item => canView(item.module))
          return visibleItems.length > 0 ? { ...child, items: visibleItems } : null
        }
        return canView(child.module) ? child : null
      })
      .filter(Boolean)
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-56 bg-[#00a37b] text-white z-30 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-8 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/20 rounded-md flex items-center justify-center p-1.5 backdrop-blur-sm">
               <svg viewBox="0 0 24 24" className="w-full h-full text-white" fill="currentColor">
                 <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
               </svg>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-white text-xl font-medium tracking-tight">KASIR</span>
              <span className="text-white text-xl font-bold tracking-tight text-white uppercase italic">KULINER</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          {menus.map((menu) => {
            const visibleChildren = getVisibleChildren(menu.children)
            if (visibleChildren.length === 0) return null

            const isMenuOpen = openMenus.includes(menu.label)
            const isActive = getActiveMenuLabel(location.pathname) === menu.label

            return (
              <div key={menu.label}>
                <button
                  onClick={() => toggleMenu(menu.label)}
                  className={`
                    w-full flex items-center gap-4 px-4 py-3.5 transition-all duration-200 rounded-lg group
                    ${isActive ? 'bg-[#008a68] shadow-sm' : 'hover:bg-[#008a68]/50'}
                  `}
                >
                  <MenuIcon label={menu.label} />
                  <span className={`flex-1 text-left text-lg font-semibold ${isActive ? 'text-white' : 'text-white/90'}`}>
                    {menu.label}
                  </span>
                  <svg
                    className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isMenuOpen ? 'rotate-90' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <div className={`overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                  <div className="py-1 ml-4 border-l-2 border-white/20">
                    {visibleChildren.map((child) => {
                      if (child.groupLabel) {
                        return (
                          <div key={child.groupLabel} className="mt-2 first:mt-0">
                            <p className="px-6 py-2 text-white/50 text-xs font-bold uppercase tracking-widest">
                              {child.groupLabel}
                            </p>
                            {child.items.map((item) => (
                              <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={handleNavClick}
                                className={({ isActive }) =>
                                  `flex items-center gap-3 pl-6 pr-4 py-2.5 text-sm transition-all
                                  ${isActive ? 'text-white font-bold' : 'text-white/70 hover:text-white hover:bg-white/5 mx-2 rounded-md'}`
                                }
                              >
                                {item.label}
                              </NavLink>
                            ))}
                          </div>
                        )
                      }

                      return (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          onClick={handleNavClick}
                          className={({ isActive }) =>
                            `flex items-center gap-3 pl-6 pr-4 py-2.5 text-sm transition-all
                            ${isActive ? 'text-white font-bold' : 'text-white/70 hover:text-white hover:bg-white/5 mx-2 rounded-md'}`
                          }
                        >
                          {child.label}
                        </NavLink>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </nav>

        {/* User info + Logout */}
        <div className="mt-auto border-t border-white/10 px-6 py-6 bg-black/5">
          {user && (
            <div className="mb-4">
              <p className="text-white text-sm font-bold truncate">{user.name || user.Name}</p>
              <p className="text-white/60 text-xs truncate uppercase tracking-wider">{user.role?.name || user.role?.Name || '-'}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all rounded-lg text-sm font-bold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            KELUAR
          </button>
        </div>
      </aside>
    </>
  )
}