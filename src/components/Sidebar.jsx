import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePermission } from '../hooks/usePermission'

const menus = [
  {
    label: 'Penjualan',
    icon: 'Penjualan',
    children: [
      { label: 'Penjualan',       path: '/sales',   module: 'sales', icon: 'Cart' },
      { label: 'Promo & Voucher', path: '/promos',  module: 'promos', icon: 'Percent' },
      { label: 'Outlet',          path: '/outlets', module: 'outlets', icon: 'Home' },
    ],
  },
  {
    label: 'Produk',
    icon: 'Produk',
    children: [
      { label: 'Produk',      path: '/products',    module: 'products', icon: 'Box' },
      { label: 'Kategori',    path: '/categories',  module: 'categories', icon: 'List' },
      { label: 'Merek',       path: '/brands',      module: 'brands', icon: 'Tag' },
      { label: 'Satuan',      path: '/units',       module: 'units', icon: 'Scale' },
      { label: 'Varian',      path: '/variants',    module: 'variants', icon: 'Git' },
      { label: 'Multi Harga', path: '/multi-harga', module: 'multi_harga', icon: 'Coin' },
    ],
  },
  {
    label: 'Laporan',
    icon: 'Laporan',
    children: [
      {
        groupLabel: 'UMUM',
        items: [
          { label: 'Laporan Absensi',    path: '/reports/attendance', module: 'reports_attendance', icon: 'Users' },
          { label: 'Pergantian Shift',   path: '/reports/shift',      module: 'reports_shift', icon: 'Clock' },
        ]
      },
      {
        groupLabel: 'PENJUALAN',
        items: [
          { label: 'Penjualan Harian',   path: '/reports/daily',      module: 'reports_daily', icon: 'ChartPie' },
          { label: 'Trend Penjualan',    path: '/reports/trend',      module: 'reports_trend', icon: 'ChartBar' },
          { label: 'Riwayat Penjualan',  path: '/reports/sales',      module: 'reports_sales', icon: 'History' },
        ]
      },
    ],
  },
  {
    label: 'Pengaturan',
    icon: 'Pengaturan',
    children: [
      { label: 'User',              path: '/users',           module: 'users', icon: 'UserCircle' },
      { label: 'Hak Akses',         path: '/roles',           module: 'roles', icon: 'Shield' },
      { label: 'Metode Pembayaran', path: '/payment-methods', module: 'payment_methods', icon: 'CreditCard' },
      { label: 'Pengaturan Umum',   path: '/settings',        module: 'settings', icon: 'Cog' },
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

const MenuIcon = ({ label, size = "w-6 h-6" }) => {
  const icons = {
    Penjualan: (
      <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7M4 18h3" />
        <circle cx="5" cy="6" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="5" cy="18" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
    Produk: (
      <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7M4 18h3" />
        <circle cx="5" cy="6" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="5" cy="18" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
    Laporan: (
      <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16v-4m4 4V9m4 7v-9m4 9V4" />
      </svg>
    ),
    Pengaturan: (
      <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    Cart: (
       <svg className={size} fill="currentColor" viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
    ),
    Percent: (
       <svg className={size} fill="currentColor" viewBox="0 0 24 24"><path d="M7.31 6.15l1.42 1.42L18.85 17.7l1.42 1.42-1.42 1.42-1.42-1.42-10.12-10.12-1.42-1.42 1.42-1.42M13.2 16.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2m-2.4-9c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z"/></svg>
    ),
    Home: (
       <svg className={size} fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
    ),
    Box: (
       <svg className={size} fill="currentColor" viewBox="0 0 24 24"><path d="M20 7h-4V5l-2-2h-4L8 5v2H4c-1.1 0-2 .9-2 2v5l2 2h16l2-2V9c0-1.1-.9-2-2-2zM10 5h4v2h-4V5zM4 9h16v5H4V9z"/></svg>
    ),
    List: (
       <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16m-7 6h7M4 18h3" /><circle cx="5" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>
    ),
    Tag: (
       <svg className={size} fill="currentColor" viewBox="0 0 24 24"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 8C4.67 8 4 7.33 4 6.5S4.67 5 5.5 5 7 5.67 7 6.5 6.33 8 5.5 8z"/></svg>
    ),
    Scale: (
       <svg className={size} fill="currentColor" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7zm-3.5-8.5l1.5 1.5 4-4L15.5 9 10 14.5 7 11.5l1.5-1.5z"/></svg>
    ),
    Git: (
       <svg className={size} fill="currentColor" viewBox="0 0 24 24"><path d="M18.82 15.42L15 11.6V8.4C16.2 7.78 17 6.49 17 5c0-2.21-1.79-4-4-4S9 2.79 9 5c0 1.49.8 2.78 2 3.4v3.2l-3.82 3.82c-.59.59-.59 1.54 0 2.12l.18.18c.59.59 1.54.59 2.12 0l3.52-3.52 3.52 3.52c.59.59 1.54.59 2.12 0l.18-.18c.59-.58.59-1.53 0-2.12zM11 5c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zM11 5c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z"/></svg>
    ),
    Coin: (
       <svg className={size} fill="currentColor" viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
    ),
    Users: (
       <svg className={size} fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 13c-1.2 0-3.07.6-3.07 1.8V17h6.14v-2.2c0-1.2-1.87-1.8-3.07-1.8zm-9 0c-1.2 0-3.07.6-3.07 1.8V17h6.14v-2.2c0-1.2-1.87-1.8-3.07-1.8zm0-4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm9 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>
    ),
    Clock: (
       <svg className={size} fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
    ),
    ChartPie: (
       <svg className={size} fill="currentColor" viewBox="0 0 24 24"><path d="M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2 0v8.43l4.57 4.57c.56-.91.95-1.92 1.25-2.98l-5.82-5.82V2zm0 10.57v9.43c4.14-.38 7.5-3.4 8.5-7.39l-8.5-2.04z"/></svg>
    ),
    ChartBar: (
       <svg className={size} fill="currentColor" viewBox="0 0 24 24"><path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8h2.8v6h-2.8z"/></svg>
    ),
    History: (
       <svg className={size} fill="currentColor" viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
    ),
    UserCircle: (
       <svg className={size} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
    ),
    Shield: (
       <svg className={size} fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
    ),
    CreditCard: (
       <svg className={size} fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
    ),
    Cog: (
       <svg className={size} fill="currentColor" viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.21.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
    ),
  }
  return icons[label] || null
}

export default function Sidebar({ isOpen, setIsOpen }) {
  const { canView } = usePermission()
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
        fixed top-0 left-0 h-full w-60 bg-[#00a37b] text-white z-30 flex flex-col
        transform transition-transform duration-300 ease-in-out
        border-r border-black/5 shadow-[4px_0_15px_-3px_rgba(0,0,0,0.1)]
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 flex-shrink-0">
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
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {menus.map((menu) => {
            const visibleChildren = getVisibleChildren(menu.children)
            if (visibleChildren.length === 0) return null

            const isMenuOpen = openMenus.includes(menu.label)
            const isAnyChildActive = getActiveMenuLabel(location.pathname) === menu.label

            return (
              <div key={menu.label}>
                <button
                  onClick={() => toggleMenu(menu.label)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 rounded-lg group
                    ${isAnyChildActive ? 'bg-[#008a68]/40' : 'hover:bg-[#008a68]/30'}
                  `}
                >
                  <MenuIcon label={menu.label} size="w-5 h-5" />
                  <span className={`flex-1 text-left text-base font-semibold ${isAnyChildActive ? 'text-white' : 'text-white/90'}`}>
                    {menu.label}
                  </span>
                  <svg
                    className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div className={`overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="py-1 space-y-0.5">
                    {visibleChildren.map((child) => {
                      if (child.groupLabel) {
                        return (
                          <div key={child.groupLabel} className="pt-2">
                            <p className="px-6 py-1 text-white/50 text-[10px] font-bold uppercase tracking-[0.2em]">
                              {child.groupLabel}
                            </p>
                            {child.items.map((item) => (
                              <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={handleNavClick}
                                className={({ isActive }) =>
                                  `flex items-center gap-3 mx-2 px-4 py-2.5 text-sm transition-all rounded-lg
                                  ${isActive 
                                    ? 'bg-white text-[#00a37b] font-bold shadow-md' 
                                    : 'text-white/80 hover:bg-white/10'}`
                                }
                              >
                                <MenuIcon label={item.icon} size="w-4 h-4" />
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
                            `flex items-center gap-3 mx-2 px-4 py-2.5 text-sm transition-all rounded-lg
                            ${isActive 
                              ? 'bg-white text-[#00a37b] font-bold shadow-md' 
                              : 'text-white/80 hover:bg-white/10'}`
                          }
                        >
                          <MenuIcon label={child.icon} size="w-4 h-4" />
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
      </aside>
    </>
  )
}