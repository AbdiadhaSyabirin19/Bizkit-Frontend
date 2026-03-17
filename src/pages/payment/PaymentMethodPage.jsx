import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import ConfirmDialog from '../../components/ConfirmDialog'
import api from '../../api/axios'
import { usePermission } from '../../hooks/usePermission'

export default function PaymentMethodPage() {
  const navigate = useNavigate()
  const { can } = usePermission()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [confirm, setConfirm] = useState({ open: false, id: null })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/payment-methods')
      setData(res.data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/payment-methods/${confirm.id}`)
      fetchData()
    } catch (err) { console.error(err) }
    finally { setConfirm({ open: false, id: null }) }
  }

  const filtered = data.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.Name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout title="Metode Pembayaran">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header Label */}
        <div className="mb-6">
           <h1 className="text-xl font-bold text-gray-800">Metode Pembayaran</h1>
        </div>

        <div className="bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100 p-8 space-y-6">
          
          {/* Search Section - Right Aligned */}
          <div className="flex justify-end items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">Search:</label>
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 w-64 transition-all"
            />
          </div>

          {/* Table Section */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/30">
                  <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider w-24 tracking-wider">
                    <div className="flex items-center gap-2">
                       No
                       <div className="flex flex-col text-[8px] opacity-30">
                         <span>▲</span>
                         <span>▼</span>
                       </div>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                     <div className="flex items-center gap-2">
                       Payment Method Name
                       <div className="flex flex-col text-[8px] opacity-30">
                         <span>▲</span>
                         <span>▼</span>
                       </div>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider w-32">
                     <div className="flex items-center gap-2">
                       Aksi
                       <div className="flex flex-col text-[8px] opacity-30">
                         <span>▲</span>
                         <span>▼</span>
                       </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan="3" className="px-6 py-10 text-center text-gray-400 text-sm italic">Memuat data...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="3" className="px-6 py-10 text-center text-gray-400 text-sm italic">Tidak ada data metode pembayaran</td></tr>
                ) : (
                  filtered.map((row, idx) => (
                    <tr key={row.ID} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium group-hover:text-emerald-600 transition-colors">{idx + 1}</td>
                      <td className="px-6 py-4 text-sm text-gray-800 font-semibold">{row.name || row.Name}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-4">
                          {can('payment_methods', 'edit') && (
                            <button 
                              onClick={() => navigate(`/payment-methods/${row.ID}/edit`)}
                              className="text-gray-400 hover:text-emerald-500 transition-colors"
                              title="Edit"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          {can('payment_methods', 'delete') && (
                            <button 
                              onClick={() => setConfirm({ open: true, id: row.ID })}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-gray-50">
            <p className="text-sm font-semibold text-gray-600 italic">
              Showing {filtered.length === 0 ? 0 : 1} to {filtered.length} of {data.length} entries
            </p>
            <div className="flex items-center gap-1">
              <button disabled className="px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">Previous</button>
              <button className="w-8 h-8 rounded-lg bg-emerald-500 text-white text-sm font-bold flex items-center justify-center">1</button>
              <button disabled className="px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* FAB */}
      {can('payment_methods', 'create') && (
        <button 
          onClick={() => navigate('/payment-methods/add')}
          className="fixed bottom-10 right-10 w-14 h-14 bg-[#00A389] text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-[#008F78] transition-all hover:scale-110 z-30"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      <ConfirmDialog 
        isOpen={confirm.open} 
        onClose={() => setConfirm({ open: false })} 
        onConfirm={handleDelete} 
        title="Hapus Metode Pembayaran"
        message="Apakah Anda yakin ingin menghapus metode pembayaran ini?"
      />
    </Layout>
  )
}