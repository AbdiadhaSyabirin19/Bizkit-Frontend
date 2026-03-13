import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'

export default function DashboardPage() {
  const [daily, setDaily] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDaily()
  }, [])

  const fetchDaily = async () => {
    try {
      const res = await api.get('/sales/daily')
      setDaily(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    {
      label: 'Total Transaksi',
      value: daily?.total_transaksi ?? 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/20',
      bgLight: 'bg-blue-50',
      bgDark: 'dark:bg-blue-500/10'
    },
    {
      label: 'Total Item Terjual',
      value: daily?.total_qty ?? 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/20',
      bgLight: 'bg-emerald-50',
      bgDark: 'dark:bg-emerald-500/10'
    },
    {
      label: 'Total Omzet',
      value: daily?.total_omzet
        ? `Rp ${Number(daily.total_omzet).toLocaleString('id-ID')}`
        : 'Rp 0',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'from-orange-500 to-amber-600',
      shadow: 'shadow-orange-500/20',
      bgLight: 'bg-orange-50',
      bgDark: 'dark:bg-orange-500/10'
    },
  ]

  return (
    <Layout title="Dashboard Overview">
      <div className="space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">Dashboard</h1>
            <p className="text-gray-500 dark:text-zinc-400 font-medium mt-1">Selamat datang kembali! Berikut ringkasan performa hari ini.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
             <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Live Update</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            [1,2,3].map(i => (
              <div key={i} className="h-32 bg-white dark:bg-zinc-800 rounded-3xl animate-pulse border border-gray-100 dark:border-zinc-700"></div>
            ))
          ) : (
            stats.map((stat) => (
              <div key={stat.label} className="group bg-white dark:bg-zinc-800 p-7 rounded-[32px] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-zinc-700/50 hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-5">
                  <div className={`p-3 rounded-2xl ${stat.bgLight} ${stat.bgDark} transition-colors group-hover:scale-110 duration-300`}>
                    <div className={`text-transparent bg-clip-text bg-gradient-to-br ${stat.gradient}`}>
                      {stat.icon}
                    </div>
                  </div>
                  <div className="h-1.5 w-8 bg-gray-100 dark:bg-gray-700 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{stat.value}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Dynamic Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Payment Summary */}
          <div className="bg-white dark:bg-zinc-800 p-8 rounded-[32px] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-zinc-700/50">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-gray-800 dark:text-white tracking-tight">Metode Pembayaran</h2>
              <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full uppercase tracking-widest">Real-time</span>
            </div>
            
            {!loading && daily?.payment_summary && Object.keys(daily.payment_summary).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(daily.payment_summary).map(([method, total]) => (
                  <div key={method} className="group flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center font-bold text-gray-500 dark:text-zinc-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        {method.charAt(0)}
                      </div>
                      <span className="font-bold text-gray-700 dark:text-gray-200">{method}</span>
                    </div>
                    <span className="text-lg font-black text-gray-900 dark:text-white">
                      Rp {Number(total).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                 <div className="w-16 h-16 bg-gray-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-zinc-800">
                    <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                 </div>
                 <p className="text-gray-400 dark:text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Belum ada transaksi</p>
              </div>
            )}
          </div>

          {/* Placeholder for future Charts or Recent Sales */}
          <div className="bg-gradient-to-br from-[#0fb38e] to-[#00a37b] p-8 rounded-[32px] shadow-xl shadow-emerald-500/20 flex flex-col justify-center items-center text-center text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-20 -mt-20"></div>
            <div className="relative z-10">
               <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/30 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
               </div>
               <h3 className="text-2xl font-black mb-2 tracking-tight">Kembangkan Bisnis Anda</h3>
               <p className="text-white/80 font-medium max-w-[280px] text-sm">Lihat laporan analitik lengkap untuk melihat tren pertumbuhan outlet Anda.</p>
               <button className="mt-8 px-8 py-3 bg-white text-emerald-600 font-black rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 text-sm uppercase tracking-wider">Buka Analitik</button>
            </div>
          </div>

        </div>

        {/* Empty State / Footer Callout */}
        {!loading && daily?.total_transaksi === 0 && (
          <div className="bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-[32px] p-12 text-center border border-dashed border-gray-300 dark:border-zinc-700">
            <p className="text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-[0.3em] text-[11px]">Siap melayani pelanggan hari ini? 🚀</p>
          </div>
        )}

      </div>
    </Layout>
  )
}