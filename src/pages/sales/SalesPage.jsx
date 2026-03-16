import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import { usePermission } from '../../hooks/usePermission'

const formatRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')
const formatDate = (str) => {
  if (!str) return '-'
  return new Date(str).toLocaleDateString('id-ID', {
    day: '2-digit', month: '2-digit', year: '2-digit'
  })
}

export default function SalesPage() {
  const navigate = useNavigate()
  const { can } = usePermission()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchSales = async () => {
    setLoading(true)
    try {
      const res = await api.get('/sales')
      setSales(res.data?.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSales()
  }, [])

  const filtered = sales.filter(s => {
    const q = search.toLowerCase()
    return (
      (s.invoice_number || '').toLowerCase().includes(q) ||
      (s.customer_name || '').toLowerCase().includes(q)
    )
  })

  return (
    <Layout title="Penjualan">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
          {can('sales', 'create') ? (
            <button 
              onClick={() => navigate('/sales/add')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Tambah Penjualan
            </button>
          ) : <div />}
          
          <div className="relative w-full max-w-xs">
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Cari transaksi..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">Tgl</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-400 text-sm">
                    Belum ada data penjualan
                  </td>
                </tr>
              ) : (
                filtered.map((sale, idx) => (
                  <tr key={sale.ID || sale.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 text-sm text-gray-600">{idx + 1}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(sale.created_at || sale.CreatedAt)}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 font-medium">{sale.customer_name || sale.CustomerName || 'Umum'}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 font-bold">{formatRp(sale.grand_total || sale.GrandTotal)}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => navigate(`/sales/${sale.ID || sale.id}`)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
