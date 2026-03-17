import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { usePermission } from '../hooks/usePermission'
import api from '../api/axios'

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
    icon: 'Pengaturan',
    children: [
      { label: 'User',              path: '/users',           module: 'users', icon: 'Cog' },
      { label: 'Hak Akses',         path: '/roles',           module: 'roles', icon: 'Cog' },
      { label: 'Metode Pembayaran', path: '/payment-methods', module: 'payment_methods', icon: 'Cog' },
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
    ListBullets: (
      <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H3m18 0h-8M9 12H3m18 0h-8M9 19H3m18 0h-8" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 4.5v1m0 6v1m0 6v1" />
        <circle cx="5" cy="5" r="1" fill="currentColor" />
        <circle cx="5" cy="12" r="1" fill="currentColor" />
        <circle cx="5" cy="19" r="1" fill="currentColor" />
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
    Pengaturan: (
      <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    Cog: (
      <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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

  const [storeLogo, setStoreLogo] = useState(null)
  const [storeName, setStoreName] = useState('')

  useEffect(() => {
    api.get('/settings')
      .then(res => {
        const d = res.data.data
        setStoreLogo(d?.Logo || d?.logo || null)
        setStoreName(d?.StoreName || d?.store_name || '')
      })
      .catch(() => {})
  }, [])

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
        fixed top-0 left-0 h-full w-[260px] bg-[#00A389] text-white z-50 flex flex-col
        transform transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]
        border-r border-white/20
        shadow-[6px_0_32px_-2px_rgba(0,0,0,0.35)]
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>

        {/* Logo Section */}
        <div className="px-4 py-6 border-b border-white/10 mb-4 bg-[#008F78]">
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
                  <span className="font-bold text-lg tracking-tight uppercase">Kasir Kuliner</span>
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
                  <MenuIcon label={menu.label} />
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