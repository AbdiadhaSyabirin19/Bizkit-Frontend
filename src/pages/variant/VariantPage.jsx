import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import Table from '../../components/Table'
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

  const columns = [
    { key: 'no', label: 'No', render: (row) => filtered.indexOf(row) + 1 },
    {
      key: 'name', label: 'Nama Varian',
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-800 text-sm">{row.name}</p>
          {row.description && (
            <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{row.description}</p>
          )}
        </div>
      )
    },
    {
      key: 'select', label: 'Pilihan',
      render: (row) => (
        <div className="flex items-center gap-1">
          <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">
            {row.min_select}–{row.max_select} pilihan
          </span>
        </div>
      )
    },
    {
      key: 'options', label: 'Opsi & Harga',
      render: (row) => {
        const opts = row.options || []
        if (opts.length === 0) return <span className="text-gray-300 text-xs italic">Belum ada opsi</span>

        const shown = opts.slice(0, 3)
        const rest = opts.length - 3

        return (
          <div className="flex flex-col gap-1">
            {shown.map((o, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-medium">
                  {o.name}
                </span>
                {o.additional_price > 0 ? (
                  <span className="text-xs text-orange-500 font-medium">
                    +Rp {Number(o.additional_price).toLocaleString('id-ID')}
                  </span>
                ) : (
                  <span className="text-xs text-gray-300">gratis</span>
                )}
              </div>
            ))}
            {rest > 0 && (
              <span className="text-xs text-gray-400 italic">+{rest} opsi lainnya</span>
            )}
          </div>
        )
      }
    },
    {
      key: 'status', label: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'active'
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {row.status === 'active' ? '● Aktif' : '● Nonaktif'}
        </span>
      )
    },
    {
      key: 'aksi', label: 'Aksi',
      render: (row) => (
        <div className="flex gap-1.5">
          <button onClick={() => navigate(`/variants/${getID(row)}`)}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition">
            Detail
          </button>
          {can('variants', 'edit') && (
            <button onClick={() => navigate(`/variants/${getID(row)}/edit`)}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition">
              Edit
            </button>
          )}
          {can('variants', 'delete') && (
            <button onClick={() => setConfirm({ open: true, id: getID(row) })}
              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition">
              Hapus
            </button>
          )}
        </div>
      )
    },
  ]

  return (
    <Layout title="Varian">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Varian</h1>
            <p className="text-gray-500 text-sm">Kelola kategori varian produk</p>
          </div>
          {can('variants', 'create') && (
            <button onClick={() => navigate('/variants/add')}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah
            </button>
          )}
        </div>

        <div className="mb-4">
          <input type="text" placeholder="Cari varian..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-xs px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>

        <Table columns={columns} data={filtered} loading={loading} />
        <ConfirmDialog isOpen={confirm.open} onClose={() => setConfirm({ open: false })} onConfirm={handleDelete} />
      </div>
    </Layout>
  )
}