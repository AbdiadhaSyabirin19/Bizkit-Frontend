import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import Table from '../../components/Table'
import ConfirmDialog from '../../components/ConfirmDialog'
import api from '../../api/axios'
import { usePermission } from '../../hooks/usePermission'

const getID = (row) => row.ID || row.id

export default function ProductPage() {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const { can } = usePermission()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [prodRes, promoRes] = await Promise.all([
        api.get('/products'),
        api.get('/promos'),
      ])
      setData(prodRes.data.data || [])
      setPromos(promoRes.data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const filtered = data.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.code?.toLowerCase().includes(search.toLowerCase())
  )

  const getProductPromos = (product) => {
    const pid = getID(product)
    return promos.filter(promo => {
      if (promo.status !== 'active') return false
      if (promo.applies_to === 'all') return true
      if (promo.applies_to === 'product') return promo.items?.some(i => i.ref_id === pid)
      if (promo.applies_to === 'category') return promo.items?.some(i => i.ref_id === product.category_id)
      if (promo.applies_to === 'brand') return promo.items?.some(i => i.ref_id === product.brand_id)
      return false
    })
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/products/${confirm.id}`)
      fetchData()
    } catch (err) { console.error(err) }
    finally { setConfirm({ open: false, id: null }) }
  }

  const columns = [
    { key: 'no', label: 'No', render: (row) => filtered.indexOf(row) + 1 },
    {
      key: 'product', label: 'Produk',
      render: (row) => {
        const productPromos = getProductPromos(row)
        return (
          <div className="flex items-center gap-3">
            <div className="relative">
              {row.image ? (
                <img src={row.image} alt={row.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-400 dark:text-gray-500 text-xs">📦</span>
                </div>
              )}
              {productPromos.length > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold" style={{ fontSize: '9px' }}>{productPromos.length}</span>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{row.name}</p>
                {productPromos.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-500/10 text-red-500 rounded text-xs font-bold">🔥 Promo</span>
                )}
              </div>
              {row.code && <p className="text-gray-400 dark:text-gray-500 text-xs font-medium">{row.code}</p>}
            </div>
          </div>
        )
      }
    },
    { key: 'category', label: 'Kategori', render: (row) => row.category?.name || '-' },
    {
      key: 'price', label: 'Harga',
      render: (row) => <p className="text-sm font-medium">Rp {Number(row.price).toLocaleString('id-ID')}</p>
    },
    {
      key: 'variants', label: 'Varian',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.variants?.length > 0
            ? row.variants.slice(0, 2).map((v, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">{v.name}</span>
              ))
            : <span className="text-gray-400 text-xs">-</span>
          }
          {row.variants?.length > 2 && <span className="text-xs text-gray-400">+{row.variants.length - 2}</span>}
        </div>
      )
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
          {/* Detail selalu tampil kalau bisa view */}
          <button onClick={() => navigate(`/products/${getID(row)}`)}
            className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-xs transition">
            Detail
          </button>
          {can('products', 'edit') && (
            <button onClick={() => navigate(`/products/${getID(row)}/edit`)}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs transition">
              Edit
            </button>
          )}
          {can('products', 'delete') && (
            <button onClick={() => setConfirm({ open: true, id: getID(row) })}
              className="px-3 py-1.5 bg-red-500/10 dark:bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-xs font-bold transition-all">
              Hapus
            </button>
          )}
        </div>
      )
    },
  ]

  return (
    <Layout title="Produk">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">Produk</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Kelola data produk Anda.</p>
          </div>
          {/* Tombol Tambah hanya muncul kalau punya akses create */}
          {can('products', 'create') && (
            <button
              onClick={() => navigate('/products/add')}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah
            </button>
          )}
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Cari produk atau kode..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-sm px-5 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder-gray-400 dark:placeholder-gray-600 font-medium"
          />
        </div>

        <Table columns={columns} data={filtered} loading={loading} />
        <ConfirmDialog isOpen={confirm.open} onClose={() => setConfirm({ open: false })} onConfirm={handleDelete} />
      </div>
    </Layout>
  )
}