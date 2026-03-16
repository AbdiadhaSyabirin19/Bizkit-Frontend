import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import ConfirmDialog from '../../components/ConfirmDialog'
import api from '../../api/axios'
import { usePermission } from '../../hooks/usePermission'

const getID = (row) => row.ID || row.id

export default function CategoryPage() {
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
      const res = await api.get('/categories')
      setData(res.data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const filtered = data.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async () => {
    try {
      await api.delete(`/categories/${confirm.id}`)
      fetchData()
    } catch (err) { console.error(err) }
    finally { setConfirm({ open: false, id: null }) }
  }

  return (
    <Layout title="Kategori">
      <div className="max-w-5xl mx-auto p-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Kategori</h1>
          </div>
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
                <th className="px-6 py-3 font-bold text-gray-700 w-20">No</th>
                <th className="px-6 py-3 font-bold text-gray-700">Kategori</th>
                <th className="px-6 py-3 font-bold text-gray-700 w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="3" className="px-6 py-10 text-center text-gray-400">Memuat data...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="3" className="px-6 py-10 text-center text-gray-400">Tidak ada kategori</td></tr>
              ) : (
                filtered.map((row, idx) => (
                  <tr key={getID(row)} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-600">{idx + 1}</td>
                    <td className="px-6 py-4 text-gray-800">{row.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-4">
                        {can('categories', 'edit') && (
                          <button onClick={() => navigate(`/categories/${getID(row)}/edit`)} className="text-gray-600 hover:text-blue-500 transition">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {can('categories', 'delete') && (
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

        {/* FAB */}
        {can('categories', 'create') && (
          <button 
            onClick={() => navigate('/categories/add')}
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