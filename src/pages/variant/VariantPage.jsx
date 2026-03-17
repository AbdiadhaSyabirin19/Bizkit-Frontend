import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import ConfirmDialog from '../../components/ConfirmDialog'
import api from '../../api/axios'
import { usePermission } from '../../hooks/usePermission'

const getID = (row) => row.ID || row.id

export default function VariantPage() {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const { can } = usePermission()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/variants')
      setData(res.data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const filtered = data.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async () => {
    try {
      await api.delete(`/variants/${confirm.id}`)
      fetchData()
    } catch (err) { console.error(err) }
    finally { setConfirm({ open: false, id: null }) }
  }

  return (
    <Layout title="Varian">
      <div className="max-w-6xl mx-auto p-4">
        {/* Search Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-end gap-4 mb-6">
          <div className="relative w-full max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Cari..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#E9ECEF] border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-bold text-gray-700 w-16">No</th>
                <th className="px-6 py-3 font-bold text-gray-700">Nama Kategori Varian</th>
                <th className="px-6 py-3 font-bold text-gray-700">Deskripsi</th>
                <th className="px-6 py-3 font-bold text-gray-700 text-center">Minimal Pemilihan</th>
                <th className="px-6 py-3 font-bold text-gray-700 text-center">Maksimal Pemilihan</th>
                <th className="px-6 py-3 font-bold text-gray-700 text-center">Varian</th>
                <th className="px-6 py-3 font-bold text-gray-700 text-center">Status</th>
                <th className="px-6 py-3 font-bold text-gray-700 w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="8" className="px-6 py-10 text-center text-gray-400">Memuat data...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="8" className="px-6 py-10 text-center text-gray-400">Tidak ada data varian</td></tr>
              ) : (
                filtered.map((row, idx) => (
                  <tr key={getID(row)} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 font-medium">{idx + 1}</td>
                    <td className="px-6 py-4 text-gray-700 font-medium">{row.name}</td>
                    <td className="px-6 py-4 text-gray-600">{row.description || '-'}</td>
                    <td className="px-6 py-4 text-gray-600 text-center">{row.min_select}</td>
                    <td className="px-6 py-4 text-gray-600 text-center">{row.max_select}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => navigate(`/variants/${getID(row)}`)}
                        className="px-4 py-1.5 bg-[#17A2B8] hover:bg-[#138496] text-white rounded-md text-xs font-medium transition-colors">
                        Lihat
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-gray-700 font-medium text-xs">
                        {row.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-4">
                        {can('variants', 'edit') && (
                          <button onClick={() => navigate(`/variants/${getID(row)}/edit`)} className="text-gray-600 hover:text-blue-500 transition">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {can('variants', 'delete') && (
                          <button onClick={() => setConfirm({ open: true, id: getID(row) })} className="text-gray-400 hover:text-red-500 transition">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="flex justify-end mt-4">
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded text-gray-400 hover:bg-gray-50 transition">
              ←
            </button>
            <button className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded font-bold text-xs">
              1
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded text-gray-400 hover:bg-gray-50 transition">
              →
            </button>
          </div>
        </div>

        {/* FAB */}
        {can('variants', 'create') && (
          <button 
            onClick={() => navigate('/variants/add')}
            className="fixed bottom-10 right-10 w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-emerald-700 transition-all hover:scale-110 z-30"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}

        <ConfirmDialog isOpen={confirm.open} onClose={() => setConfirm({ open: false })} onConfirm={handleDelete} />
      </div>
    </Layout>
  )
}