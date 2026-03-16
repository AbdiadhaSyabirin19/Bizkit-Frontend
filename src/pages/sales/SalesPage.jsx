import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import { usePermission } from '../../hooks/usePermission'

const formatTotal = (n) => Number(n || 0).toLocaleString('id-ID')
const formatDateShort = (str) => {
  if (!str) return '-'
  const d = new Date(str)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`
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
      <div className="relative pb-24">
        <div className="flex justify-end mb-4">
          <div className="relative w-full max-w-[240px]">
            <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-sm"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#cbd5e1] text-gray-700 text-xs font-bold border-b border-gray-300">
                <th className="px-6 py-3 border-r border-gray-300 w-16">No</th>
                <th className="px-6 py-3 border-r border-gray-300">Tgl</th>
                <th className="px-6 py-3 border-r border-gray-300 text-center">
                  <div className="flex items-center gap-1 justify-center">
                    Customer
                    <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M5 12l5 5 5-5H5z" /></svg>
                  </div>
                </th>
                <th className="px-6 py-3 border-r border-gray-300 text-right">Total</th>
                <th className="px-6 py-3 text-center">Aksi</th>
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
                  <tr key={sale.ID || sale.id} className="hover:bg-gray-50/50 transition border-b border-gray-200">
                    <td className="px-6 py-2.5 text-xs text-center text-gray-600 border-r border-gray-100">{idx + 1}</td>
                    <td className="px-6 py-2.5 text-xs text-gray-600 border-r border-gray-100">{formatDateShort(sale.created_at || sale.CreatedAt)}</td>
                    <td className="px-6 py-2.5 text-xs text-gray-800 font-medium border-r border-gray-100">{sale.customer_name || sale.CustomerName || 'Umum'}</td>
                    <td className="px-6 py-2.5 text-xs text-right text-gray-800 font-medium border-r border-gray-100">{formatTotal(sale.grand_total || sale.GrandTotal)}</td>
                    <td className="px-6 py-2.5 text-center">
                      <button 
                        onClick={() => navigate(`/sales/${sale.ID || sale.id}`)}
                        className="p-1 text-[#475569] hover:bg-gray-100 rounded-full transition"
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

        {can('sales', 'create') && (
          <button 
            onClick={() => navigate('/sales/add')}
            className="fixed bottom-10 right-10 w-16 h-16 bg-[#00a37b] hover:bg-[#008a68] text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all hover:scale-110 active:scale-95 z-40"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        )}
      </div>
    </Layout>
  )
}
