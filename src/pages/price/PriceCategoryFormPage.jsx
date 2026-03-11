import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'

const getID = (row) => row.ID || row.id

export default function PriceCategoryFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [products, setProducts] = useState([])
  const [priceMap, setPriceMap] = useState({})
  const [enabledMap, setEnabledMap] = useState({})
  const [search, setSearch] = useState('')
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!name.trim()) e.name = 'Nama kategori harga wajib diisi'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  useEffect(() => { fetchData() }, [id])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (isEdit) {
        const [prodRes, catRes, existingRes] = await Promise.all([
          api.get('/products'),
          api.get(`/price-categories/${id}`),
          api.get(`/price-categories/${id}/products`),
        ])

        setProducts(prodRes.data.data || [])
        setName(catRes.data.data?.name || '')

        const pm = {}
        const em = {}
        ;(existingRes.data.data || []).forEach(pp => {
          pm[pp.product_id] = pp.price
          em[pp.product_id] = true
        })
        setPriceMap(pm)
        setEnabledMap(em)

      } else {
        const prodRes = await api.get('/products')
        setProducts(prodRes.data.data || [])
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const toggleProduct = (pid) => {
    const willEnable = !enabledMap[pid]
    setEnabledMap(m => ({ ...m, [pid]: willEnable }))
    if (willEnable && !priceMap[pid]) {
      const product = products.find(p => getID(p) === pid)
      setPriceMap(m => ({ ...m, [pid]: product?.price || 0 }))
    }
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      let categoryID

      if (isEdit) {
        await api.put(`/price-categories/${id}`, { name })
        categoryID = Number(id)
      } else {
        const res = await api.post('/price-categories', { name })
        categoryID = getID(res.data.data)
      }

      await Promise.all(products.map(p => {
        const pid = getID(p)
        if (enabledMap[pid] && Number(priceMap[pid]) > 0) {
          return api.post(`/price-categories/${categoryID}/products`, {
            product_id: pid,
            price: Number(priceMap[pid])
          })
        } else {
          return api.delete(`/price-categories/${categoryID}/products/${pid}`).catch(() => {})
        }
      }))

      navigate('/multi-harga')
    } catch (err) {
      console.error('Error:', err.response?.data || err.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  )

  const enabledCount = Object.values(enabledMap).filter(Boolean).length

  if (loading) return (
    <Layout title={isEdit ? 'Edit Kategori Harga' : 'Tambah Kategori Harga'}>
      <div className="flex items-center justify-center py-20 text-gray-400">Memuat data...</div>
    </Layout>
  )

  return (
    <Layout title={isEdit ? 'Edit Kategori Harga' : 'Tambah Kategori Harga'}>
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/multi-harga')} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">{isEdit ? 'Edit Kategori Harga' : 'Tambah Kategori Harga'}</h1>
            <p className="text-gray-500 text-sm">{isEdit ? 'Perbarui nama & harga produk' : 'Buat kategori harga baru'}</p>
          </div>
          {enabledCount > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-600">{enabledCount}</p>
              <p className="text-xs text-gray-400">produk aktif</p>
            </div>
          )}
        </div>

        <div className="space-y-4">

          {/* Nama Kategori */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Kategori Harga <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => {
                setName(e.target.value)
                if (errors.name) setErrors({})
              }}
              placeholder="Contoh: Gojek, Grab, Bazaar, Member"
              className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
              autoFocus
            />
            {errors.name && <p className="text-xs text-red-400 mt-1">⚠ {errors.name}</p>}
            <p className="text-xs text-gray-400 mt-1">Nama untuk membedakan harga jual di berbagai platform atau kondisi</p>
          </div>

          {/* Harga Produk */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-800">Atur Harga Produk</h3>
                <p className="text-xs text-gray-400 mt-0.5">Centang produk yang ingin diberi harga khusus</p>
              </div>
              <input
                type="text"
                placeholder="Cari produk..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-44 px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* Header kolom */}
            <div className="grid grid-cols-12 gap-3 px-4 py-2 bg-gray-50 border-b border-gray-100">
              <div className="col-span-1" />
              <div className="col-span-5"><span className="text-xs font-medium text-gray-500">Produk</span></div>
              <div className="col-span-3"><span className="text-xs font-medium text-gray-500">Harga Default</span></div>
              <div className="col-span-3"><span className="text-xs font-medium text-gray-500">Harga Khusus</span></div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p className="text-3xl mb-2">📦</p>
                <p className="text-sm">Tidak ada produk ditemukan</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                {filteredProducts.map(p => {
                  const pid = getID(p)
                  const isEnabled = !!enabledMap[pid]
                  return (
                    <div
                      key={pid}
                      className={`grid grid-cols-12 gap-3 px-4 py-3 items-center transition ${isEnabled ? 'bg-emerald-50/50' : 'hover:bg-gray-50'}`}
                    >
                      {/* Checkbox */}
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={() => toggleProduct(pid)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${isEnabled ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-emerald-400'}`}
                        >
                          {isEnabled && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      </div>

                      {/* Nama produk */}
                      <div className="col-span-5">
                        <div className="flex items-center gap-2">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-xs">📦</span>
                            </div>
                          )}
                          <div>
                            <p className={`text-sm font-medium ${isEnabled ? 'text-gray-800' : 'text-gray-500'}`}>{p.name}</p>
                            {p.category?.name && <p className="text-xs text-gray-400">{p.category.name}</p>}
                          </div>
                        </div>
                      </div>

                      {/* Harga default */}
                      <div className="col-span-3">
                        <p className="text-sm text-gray-500">Rp {Number(p.price).toLocaleString('id-ID')}</p>
                      </div>

                      {/* Input harga custom */}
                      <div className="col-span-3">
                        {isEnabled ? (
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Rp</span>
                            <input
                              type="number"
                              value={priceMap[pid] || ''}
                              onChange={e => setPriceMap(m => ({ ...m, [pid]: e.target.value }))}
                              placeholder={String(p.price)}
                              className="w-full pl-8 pr-2 py-1.5 border border-emerald-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                            />
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">-</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Tombol */}
          <div className="flex gap-3 pb-6">
            <button
              onClick={() => navigate('/multi-harga')}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium transition"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-sm font-medium transition"
            >
              {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Kategori'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}