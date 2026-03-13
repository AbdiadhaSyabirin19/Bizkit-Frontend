import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import Table from '../../components/Table'
import ConfirmDialog from '../../components/ConfirmDialog'
import api from '../../api/axios'
import { usePermission } from '../../hooks/usePermission'

const getID = (row) => row.ID || row.id

export default function OutletPage() {
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
      const res = await api.get('/outlets')
      setData(res.data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const filtered = data.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async () => {
    try {
      await api.delete(`/outlets/${confirm.id}`)
      fetchData()
    } catch (err) { console.error(err) }
    finally { setConfirm({ open: false, id: null }) }
  }

  const columns = [
    { key: 'no', label: 'No', render: (row) => filtered.indexOf(row) + 1 },
    {
      key: 'outlet', label: 'Outlet',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-base">🏪</span>
          </div>
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">{row.name}</p>
            {row.address && <p className="text-xs text-gray-400 dark:text-gray-500">{row.address}</p>}
          </div>
        </div>
      )
    },
    {
      key: 'phone', label: 'Telepon',
      render: (row) => <span className="text-sm text-gray-600 dark:text-gray-400">{row.phone || '-'}</span>
    },
    {
      key: 'status', label: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {row.status === 'active' ? 'Aktif' : 'Nonaktif'}
        </span>
      )
    },
    {
      key: 'aksi', label: 'Aksi',
      render: (row) => (
        <div className="flex gap-2">
          <button onClick={() => navigate(`/outlets/${getID(row)}`)}
            className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-xs transition">
            Detail
          </button>
          {can('outlets', 'edit') && (
            <button onClick={() => navigate(`/outlets/${getID(row)}/edit`)}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs transition">
              Edit
            </button>
          )}
          {can('outlets', 'delete') && (
            <button onClick={() => setConfirm({ open: true, id: getID(row) })}
              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs transition">
              Hapus
            </button>
          )}
        </div>
      )
    },
  ]

  return (
    <Layout title="Outlet">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Outlet</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Kelola data outlet</p>
          </div>
          {can('outlets', 'create') && (
            <button
              onClick={() => navigate('/outlets/add')}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah
            </button>
          )}
        </div>
        <div className="mb-4">
          <input type="text" placeholder="Cari outlet..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full max-w-xs px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors" />
        </div>
        <Table columns={columns} data={filtered} loading={loading} />
        <ConfirmDialog isOpen={confirm.open} onClose={() => setConfirm({ open: false })} onConfirm={handleDelete} />
      </div>
    </Layout>
  )
}