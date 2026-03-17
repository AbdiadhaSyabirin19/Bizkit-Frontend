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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Nama Kategori Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Nama Kategori Harga Tambahan</label>
              <input
                type="text"
                value={name}
                onChange={e => {
                  setName(e.target.value)
                  if (errors.name) setErrors({})
                }}
                placeholder="Harga Grab, Harga A, Harga B"
                className={`w-full px-4 py-3 bg-white border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                  errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-emerald-500'
                }`}
                autoFocus
              />
              {errors.name && <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                {errors.name}
              </p>}
            </div>
          </div>

          {/* Harga Produk List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Atur Harga Produk</h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari produk..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-48 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Pilih</span></th>
                    <th className="px-6 py-3 text-left"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Produk</span></th>
                    <th className="px-6 py-3 text-left"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Harga Default</span></th>
                    <th className="px-6 py-3 text-left"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Harga Khusus</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic text-sm">
                        Tidak ada produk ditemukan
                      </td>
                    </tr>
                  ) : filteredProducts.map(p => {
                    const pid = getID(p)
                    const isEnabled = !!enabledMap[pid]
                    return (
                      <tr key={pid} className={`transition-colors ${isEnabled ? 'bg-emerald-50/30' : 'hover:bg-gray-50/50'}`}>
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            checked={isEnabled}
                            onChange={() => toggleProduct(pid)}
                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-700">{p.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">Rp {Number(p.price).toLocaleString('id-ID')}</td>
                        <td className="px-6 py-4">
                          {isEnabled ? (
                            <div className="flex items-center bg-white border border-emerald-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all max-w-[140px]">
                              <span className="px-2 py-1 bg-emerald-50 text-[10px] text-emerald-600 font-bold border-r border-emerald-100">Rp</span>
                              <input
                                type="number"
                                value={priceMap[pid] || ''}
                                onChange={e => setPriceMap(m => ({ ...m, [pid]: e.target.value }))}
                                placeholder={String(p.price)}
                                className="w-full px-2 py-1.5 text-xs focus:outline-none"
                              />
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Button */}
          <div className="bg-[#f8fafc] p-4 rounded-xl border border-gray-100">
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full py-3.5 bg-[#374151] hover:bg-[#1f2937] text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}