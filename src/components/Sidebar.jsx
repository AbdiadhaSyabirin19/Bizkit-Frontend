import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { usePermission } from '../hooks/usePermission'
import { useSettings } from '../context/SettingsContext'

const menus = [
  {
    label: 'Penjualan',
    icon: 'ListBullets',
    children: [
      { label: 'Penjualan',       path: '/sales',   module: 'sales', icon: 'ShoppingCart' },
      { label: 'Promo & Voucher', path: '/promos',  module: 'promos', icon: 'Percent' },
    ],
  },
  {
    label: 'Produk',
    icon: 'ListBullets',
    children: [
      { label: 'Produk',      path: '/products',    module: 'products', icon: 'Box' },
      { label: 'Kategori',    path: '/categories',  module: 'categories', icon: 'List' },
      { label: 'Merek',       path: '/brands',      module: 'brands', icon: 'AlphaA' },
      { label: 'Satuan',      path: '/units',       module: 'units', icon: 'ShoppingBag' },
      { label: 'Varian',      path: '/variants',    module: 'variants', icon: 'Tree' },
      { label: 'Multi Harga', path: '/multi-harga', module: 'multi_harga', icon: 'FilterDollar' },
    ],
  },
  {
    label: 'Laporan',
    icon: 'Laporan',
    children: [
      {
        groupLabel: 'UMUM',
        items: [
          { label: 'Laporan Absensi',    path: '/reports/attendance', module: 'reports_attendance', icon: 'Laporan' },
          { label: 'Pergantian Shift',   path: '/reports/shift',      module: 'reports_shift', icon: 'Laporan' },
        ]
      },
      {
        groupLabel: 'PENJUALAN',
        items: [
          { label: 'Penjualan Harian',   path: '/reports/daily',      module: 'reports_daily', icon: 'Laporan' },
          { label: 'Trend Penjualan',    path: '/reports/trend',      module: 'reports_trend', icon: 'Laporan' },
          { label: 'Riwayat Penjualan',  path: '/reports/sales',      module: 'reports_sales', icon: 'Laporan' },
        ]
      },
    ],
  },
  {
    label: 'Pengaturan',
    icon: 'Gears',
    children: [
      { label: 'User',              path: '/users',           module: 'users', icon: 'Users' },
      { label: 'Hak Akses',         path: '/roles',           module: 'roles', icon: 'UserGear' },
      { label: 'Metode Pembayaran', path: '/payment-methods', module: 'payment_methods', icon: 'CreditCardDollar' },
      { label: 'Pengaturan Umum',   path: '/settings',        module: 'settings', icon: 'Sliders' },
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
    ListBullets: (
      <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6h10M10 12h10M10 18h10M4 6l1 1 2-2M4 12l1 1 2-2" />
        <circle cx="5" cy="18" r="1.5" fill="currentColor" />
      </svg>
    ),
    ShoppingCart: (
      <svg className={size} fill="currentColor" viewBox="0 0 24 24">
        <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
      </svg>
    ),
    Percent: (
      <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 7l10 10M17 7c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2zM7 13c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2z" />
      </svg>
    ),
    Box: (
      <svg className={size} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 3L2 8l10 5 10-5-10-5z" />
        <path d="M2 12l10 5 10-5" opacity="0.3" />
        <path d="M2 17l10 5 10-5" />
        <path d="M4.5 10.5v5L12 19l7.5-3.5v-5L12 14l-7.5-3.5z" />
      </svg>
    ),
    List: (
      <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
    AlphaA: (
      <svg className={size} fill="currentColor" viewBox="0 0 24 24">
        <path d="M11 7l-5 12h2.1l1.1-2.8h5.6l1.1 2.8H18l-5-12h-2zm-.1 7.4L12 11l1.1 3.4h-2.2z" />
      </svg>
    ),
    ShoppingBag: (
      <svg className={size} fill="currentColor" viewBox="0 0 24 24">
        <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-8-2h4v2h-4V4zm8 15H4V8h3v2c0 .55.45 1 1 1s1-.45 1-1V8h6v2c0 .55.45 1 1 1s1-.45 1-1V8h3v11z" />
      </svg>
    ),
    Tree: (
      <svg className={size} fill="currentColor" viewBox="0 0 24 24">
        <path d="M22 11V3h-7v3H9V3H2v8h7V8h2v10h4v3h7v-8h-7v3h-2V8h2v3h7zM4 9V5h3v4H4zm15 14v-4h3v4h-3z" />
      </svg>
    ),
    FilterDollar: (
      <svg className={size} fill="currentColor" viewBox="0 0 24 24">
        <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" opacity="0.1" />
      </svg>
    ),
    Laporan: (
      <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    Gears: (
      <svg className={size} fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.5 13.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zm0-4c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z" />
        <path d="M21.2 11.2l-2.07-.35c-.14-.49-.33-.96-.58-1.4l1.19-1.74c.22-.32.18-.76-.09-1.03l-1.41-1.41c-.27-.27-.71-.31-1.03-.09l-1.74 1.19c-.44-.25-.91-.44-1.4-.58l-.35-2.07c-.07-.39-.41-.68-.81-.68h-2c-.4 0-.74.29-.81.68l-.35 2.07c-.49.14-.96.33-1.41.58L6.8 5l-.11-.08c-.32-.22-.76-.18-1.03.09l-1.41 1.41c-.27.27-.31.71-.09 1.03L5.35 9.2c-.25.44-.44.91-.58 1.41l-2.07.35c-.39.07-.68.41-.68.81v2c0 .4.29.74.68.81l2.07.35c.14.49.33.95.58 1.4l-1.19 1.74c-.22.32-.18.76.09 1.03l1.41 1.41c.27.27.71.31 1.03.09l1.74-1.19c.44.25.91.44 1.4.58l.35 2.07c.07.39.41.68.81.68h2c.4 0 .74-.29.81-.68l.35-2.07c.49-.14.95-.33 1.4-.58l1.74 1.19c.32.22.76.18 1.03-.09l1.41-1.41c.27-.27.31-.71.09-1.03l-1.19-1.74c.25-.44.44-.91.58-1.4l2.07-.35c.39-.07.68-.41.68-.81v-2c0-.4-.29-.74-.68-.81zM11.5 16c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
        <path d="M7 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 3c-.55 0-1-.45-1-1s.45-1 1-1 1.45 1 1 1-.45 1-1 1z" opacity="0.5" />
      </svg>
    ),
    Users: (
      <svg className={size} fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    ),
    UserGear: (
      <svg className={size} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
        <path d="M12 14c-2.67 0-8 1.34-8 4v2h8v-2c0-.33.04-.66.1-.98.71-.16 1.41-.3 2.15-.36.31-2.03 2.07-3.66 4.25-3.66.52 0 1.01.09 1.47.25-.01-.41-.02-.83-.02-1.25 0-2.66-5.33-4-8-4z" />
        <path d="M19.43 14.98c.04.33.07.66.07 1.02s-.03.69-.07 1.02l1.63 1.27c.15.12.19.34.09.51l-1.54 2.67c-.09.17-.31.24-.48.17l-1.92-.77c-.4.31-.83.57-1.3.77l-.29 2.04c-.02.19-.19.33-.39.33h-3.08c-.2 0-.37-.14-.39-.33l-.29-2.04c-.47-.2-.9-.46-1.3-.77l-1.92.77c-.17.07-.38 0-.48-.17l-1.54-2.67c-.1-.17-.06-.39.09-.51l1.63-1.27c-.04-.33-.07-.66-.07-1.02s.03-.69.07-1.02l-1.63-1.27c-.15-.12-.19-.34-.09-.51l1.54-2.67c.09-.17.31-.24.48-.17l1.92.77c.4-.31.83-.57 1.3-.77l.29-2.04c.02-.19.19-.33.39-.33h3.08c.2 0 .37.14.39.33l.29 2.04c.47.2.9.46 1.3.77l1.92-.77c.17-.07.38 0 .48.17l1.54 2.67c.1.17.06.39-.09.51l-1.63 1.27zM17.5 18c.83 0 1.5-.67 1.5-1.5S18.33 15 17.5 15s-1.5.67-1.5 1.5.67 1.5 1.5 1.5z" />
      </svg>
    ),
    CreditCardDollar: (
      <svg className={size} fill="currentColor" viewBox="0 0 24 24">
        <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
        <path d="M12 14c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
        <path d="M15 14h1.5v1.5H15zM17.5 14H19v1.5h-1.5zM15 16.5h1.5V18H15zM17.5 16.5H19V18h-1.5z" opacity="0.3" />
      </svg>
    ),
    Sliders: (
      <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M3 14h18M3 18h18" opacity="0.3" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 8v4M12 12v4M17 16v4" />
        <circle cx="7" cy="10" r="1.5" fill="currentColor" />
        <circle cx="12" cy="14" r="1.5" fill="currentColor" />
        <circle cx="17" cy="18" r="1.5" fill="currentColor" />
      </svg>
    ),
    ChevronRight: (
       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
    ),
    ChevronDown: (
       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/></svg>
    )
  }
  return icons[label] || null
}

export default function Sidebar({ isOpen, setIsOpen }) {
  const { canView } = usePermission()
  const location = useLocation()
  const { logo: storeLogo, store_name: storeName } = useSettings()

  const [openMenus, setOpenMenus] = useState(() => {
    const activeLabel = getActiveMenuLabel(location.pathname) || 'Laporan'
    return [activeLabel]
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={() => setIsOpen(false)} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-[260px] bg-[#019D76] text-white z-50 flex flex-col
        transform transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]
        border-r border-white/20
        shadow-[6px_0_32px_-2px_rgba(0,0,0,0.35)]
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>

        {/* Logo Section */}
        <div className="px-0 py-6 mb-2">
          <div className="flex items-center justify-center">
             {storeLogo ? (
                <img
                  src={storeLogo}
                  alt={storeName}
                  className="w-full h-auto max-h-16 object-contain"
                  onError={() => setStoreLogo(null)}
                />
              ) : (
                <div className="flex items-center gap-2">
                   <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md shadow-lg border border-white/10">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <span className="font-bold text-lg tracking-tight uppercase">{storeName}</span>
                </div>
              )}
          </div>
        </div>



        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-2 custom-scrollbar">
          {menus.map((menu) => {
            const visibleChildren = getVisibleChildren(menu.children)
            if (visibleChildren.length === 0) return null

            const isMenuOpen = openMenus.includes(menu.label)
            const isAnyChildActive = getActiveMenuLabel(location.pathname) === menu.label

            return (
              <div key={menu.label} className="group/menu">
                <button
                  onClick={() => toggleMenu(menu.label)}
                  className={`
                    w-full flex items-center gap-3.5 px-4 py-3.5 transition-all duration-300 rounded-xl
                    ${isAnyChildActive ? 'bg-white/10 text-white font-bold' : 'text-white/80 hover:bg-white/5 hover:text-white'}
                  `}
                >
                  <MenuIcon label={menu.icon} />
                  <span className="flex-1 text-left text-[15px] font-semibold tracking-tight">
                    {menu.label}
                  </span>
                  <div className={`transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`}>
                    <MenuIcon label={isMenuOpen ? 'ChevronDown' : 'ChevronRight'} size="w-4 h-4" />
                  </div>
                </button>

                <div className={`
                  grid transition-all duration-300 ease-in-out
                  ${isMenuOpen ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'}
                `}>
                  <div className="overflow-hidden space-y-1 ml-4 border-l border-white/10 pl-2">
                    {visibleChildren.map((child) => {
                      if (child.groupLabel) {
                        return (
                          <div key={child.groupLabel} className="pt-2 pb-1">
                            <p className="px-6 py-1 text-emerald-100/40 text-[9px] font-black uppercase tracking-[0.25em]">
                              {child.groupLabel}
                            </p>
                            {child.items.map((item) => (
                              <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={handleNavClick}
                                className={({ isActive }) =>
                                  `flex items-center gap-3 px-4 py-2.5 text-sm transition-all rounded-xl mt-1
                                  ${isActive 
                                    ? 'bg-[#E0F2F1] text-[#00796B] font-bold shadow-sm' 
                                    : 'text-white/80 hover:bg-white/10 hover:text-white'}`
                                }
                              >
                                <MenuIcon label={item.icon} size="w-4 h-4" />
                                <span className="tracking-tight">{item.label}</span>
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
                            `flex items-center gap-3 px-4 py-2.5 text-sm transition-all rounded-xl
                            ${isActive 
                              ? 'bg-[#E0F2F1] text-[#00796B] font-bold shadow-sm' 
                              : 'text-white/80 hover:bg-white/10 hover:text-white'}`
                          }
                        >
                          <MenuIcon label={child.icon} size="w-4 h-4" />
                          <span className="tracking-tight">{child.label}</span>
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