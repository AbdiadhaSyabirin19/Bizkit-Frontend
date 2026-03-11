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
      icon: '🧾',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Total Item Terjual',
      value: daily?.total_qty ?? 0,
      icon: '📦',
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Total Omzet',
      value: daily?.total_omzet
        ? `Rp ${Number(daily.total_omzet).toLocaleString('id-ID')}`
        : 'Rp 0',
      icon: '💰',
      color: 'bg-orange-50 text-orange-600',
    },
  ]

  return (
    <Layout tittle="Dashboard">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Ringkasan penjualan hari ini</p>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-500 text-sm">{stat.label}</p>
                  <span className={`text-2xl p-2 rounded-xl ${stat.color}`}>
                    {stat.icon}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Metode Pembayaran */}
        {daily?.payment_summary && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4">Rekap Metode Pembayaran</h2>
            <div className="space-y-3">
              {Object.entries(daily.payment_summary).map(([method, total]) => (
                <div key={method} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-600 text-sm">{method}</span>
                  <span className="font-semibold text-gray-800">
                    Rp {Number(total).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Kosong */}
        {!loading && daily?.total_transaksi === 0 && (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-gray-500">Belum ada transaksi hari ini</p>
          </div>
        )}

      </div>
    </Layout>
  )
}