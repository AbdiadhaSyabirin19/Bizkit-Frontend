import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { usePermission } from '../hooks/usePermission'
import api from '../api/axios'

const menus = [
  {
    label: 'Penjualan',
    icon: 'Penjualan',
    children: [
      { label: 'Penjualan',       path: '/sales',   module: 'sales', icon: 'Penjualan' },
      { label: 'Promo & Voucher', path: '/promos',  module: 'promos', icon: 'Penjualan' },
    ],
  },
  {
    label: 'Produk',
    icon: 'Produk',
    children: [
      { label: 'Produk',      path: '/products',    module: 'products', icon: 'Produk' },
      { label: 'Kategori',    path: '/categories',  module: 'categories', icon: 'Produk' },
      { label: 'Merek',       path: '/brands',      module: 'brands', icon: 'Produk' },
      { label: 'Satuan',      path: '/units',       module: 'units', icon: 'Produk' },
      { label: 'Varian',      path: '/variants',    module: 'variants', icon: 'Produk' },
      { label: 'Multi Harga', path: '/multi-harga', module: 'multi_harga', icon: 'Produk' },
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
    Penjualan: (
      <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
    Produk: (
      <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
        fixed top-0 left-0 h-full w-[260px] bg-[#0fb38e] text-white z-50 flex flex-col
        transform transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]
        border-r border-white/20
        shadow-[6px_0_32px_-2px_rgba(0,0,0,0.35)]
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>

        {/* Logo Section */}
        <div className="px-6 py-6 border-b border-white/10 mb-4 bg-[#0ca180]">
          <div className="flex items-center justify-center">
             {storeLogo ? (
                <img
                  src={storeLogo}
                  alt={storeName}
                  className="h-12 w-auto object-contain"
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