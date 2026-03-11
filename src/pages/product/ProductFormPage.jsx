import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'

const getID = (row) => row.ID || row.id

export default function ProductFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const fileRef = useRef()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)

  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [units, setUnits] = useState([])
  const [variants, setVariants] = useState([])
  const [outlets, setOutlets] = useState([])
  const [priceCategories, setPriceCategories] = useState([])

  const [form, setForm] = useState({
    code: '', name: '', description: '',
    category_id: '', brand_id: '', unit_id: '',
    price: '', image: '', status: 'active',
    variant_ids: [], outlet_ids: [],
    custom_prices: {}
  })

  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nama produk wajib diisi'
    if (!form.category_id) e.category_id = 'Kategori wajib dipilih'
    if (!form.price || Number(form.price) <= 0) e.price = 'Harga jual wajib diisi dan lebih dari 0'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  useEffect(() => {
    fetchMasterData()
    if (isEdit) fetchProduct()
  }, [id])

  const fetchMasterData = async () => {
    try {
      const [catRes, brandRes, unitRes, variantRes, outletRes, priceRes] = await Promise.all([
        api.get('/categories'),
        api.get('/brands'),
        api.get('/units'),
        api.get('/variants'),
        api.get('/outlets'),
        api.get('/price-categories'),
      ])
      setCategories(catRes.data.data || [])
      setBrands(brandRes.data.data || [])
      setUnits(unitRes.data.data || [])
      setVariants(variantRes.data.data || [])
      setOutlets(outletRes.data.data || [])
      setPriceCategories(priceRes.data.data || [])
    } catch (err) { console.error(err) }
  }

  const fetchProduct = async () => {
    setLoading(true)
    try {
      const [prodRes, priceRes] = await Promise.all([
        api.get(`/products/${id}`),
        api.get(`/products/${id}/prices`),
      ])
      const item = prodRes.data.data
      const priceMap = {}
      ;(priceRes.data.data || []).forEach(p => { priceMap[p.price_category_id] = p.price })

      setForm({
        code: item.code || '',
        name: item.name || '',
        description: item.description || '',
        category_id: item.category_id || '',
        brand_id: item.brand_id || '',
        unit_id: item.unit_id || '',
        price: item.price || '',
        image: item.image || '',
        status: item.status || 'active',
        variant_ids: item.variants?.map(v => getID(v)) || [],
        outlet_ids: item.outlets?.map(o => getID(o)) || [],
        custom_prices: priceMap
      })
      setImagePreview(item.image || null)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
      setForm(f => ({ ...f, image: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const toggleVariant = (vid) => {
    setForm(f => ({
      ...f,
      variant_ids: f.variant_ids.includes(vid)
        ? f.variant_ids.filter(v => v !== vid)
        : [...f.variant_ids, vid]
    }))
  }

  const toggleOutlet = (oid) => {
    setForm(f => ({
      ...f,
      outlet_ids: f.outlet_ids.includes(oid)
        ? f.outlet_ids.filter(o => o !== oid)
        : [...f.outlet_ids, oid]
    }))
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        code: form.code,
        name: form.name,
        description: form.description,
        category_id: form.category_id ? Number(form.category_id) : null,
        brand_id: form.brand_id ? Number(form.brand_id) : null,
        unit_id: form.unit_id ? Number(form.unit_id) : null,
        price: Number(form.price),
        image: form.image,
        status: form.status || 'active',
        variant_ids: form.variant_ids || [],
        outlet_ids: form.outlet_ids || []
      }

      let productID
      if (isEdit) {
        productID = Number(id)
        await api.put(`/products/${id}`, payload)
      } else {
        const res = await api.post('/products', payload)
        productID = getID(res.data.data)
      }

      await Promise.all(
        priceCategories.map(pc => {
          const pcID = getID(pc)
          const price = form.custom_prices[pcID]
          if (price !== undefined && price !== '' && Number(price) > 0) {
            return api.post(`/price-categories/${pcID}/products`, {
              product_id: productID,
              price: Number(price)
            })
          }
          return Promise.resolve()
        })
      )

      navigate('/products')
    } catch (err) {
      console.error('Error:', err.response?.data || err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <Layout title={isEdit ? 'Edit Produk' : 'Tambah Produk'}>
      <div className="flex items-center justify-center py-20 text-gray-400">Memuat data...</div>
    </Layout>
  )

  return (
    <Layout title={isEdit ? 'Edit Produk' : 'Tambah Produk'}>
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/products')} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{isEdit ? 'Edit Produk' : 'Tambah Produk'}</h1>
            <p className="text-gray-500 text-sm">{isEdit ? 'Perbarui data produk' : 'Tambah produk baru'}</p>
          </div>
        </div>

        <div className="space-y-5">

          {/* Gambar */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Gambar Produk</h3>
            <div className="flex items-center gap-5">
              <div
                onClick={() => fileRef.current.click()}
                className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 overflow-hidden flex-shrink-0 transition"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-2">
                    <p className="text-3xl mb-1">📷</p>
                    <p className="text-xs text-gray-400">Upload</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Foto produk</p>
                <p className="text-xs text-gray-400 mb-3">Format JPG, PNG. Maks 2MB</p>
                <div className="flex gap-2">
                  <button onClick={() => fileRef.current.click()} className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-xs font-medium transition">Pilih Foto</button>
                  {imagePreview && (
                    <button onClick={() => { setImagePreview(null); setForm(f => ({ ...f, image: '' })); fileRef.current.value = '' }} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-xs font-medium transition">Hapus</button>
                  )}
                </div>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </div>

          {/* Info Dasar */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Informasi Produk</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kode Produk</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                    placeholder="PRD-001"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => {
                      setForm(f => ({ ...f, name: e.target.value }))
                      if (errors.name) setErrors(er => ({ ...er, name: '' }))
                    }}
                    placeholder="Nama produk"
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  />
                  {errors.name && <p className="text-xs text-red-400 mt-1">⚠ {errors.name}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Deskripsi produk (opsional)"
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori <span className="text-red-400">*</span></label>
                  <select
                    value={form.category_id}
                    onChange={e => {
                      setForm(f => ({ ...f, category_id: e.target.value }))
                      if (errors.category_id) setErrors(er => ({ ...er, category_id: '' }))
                    }}
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 ${errors.category_id ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map(c => <option key={getID(c)} value={getID(c)}>{c.name}</option>)}
                  </select>
                  {errors.category_id && <p className="text-xs text-red-400 mt-1">⚠ {errors.category_id}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Merek</label>
                  <select
                    value={form.brand_id}
                    onChange={e => setForm(f => ({ ...f, brand_id: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="">Pilih Merek</option>
                    {brands.map(b => <option key={getID(b)} value={getID(b)}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Satuan</label>
                  <select
                    value={form.unit_id}
                    onChange={e => setForm(f => ({ ...f, unit_id: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="">Pilih Satuan</option>
                    {units.map(u => <option key={getID(u)} value={getID(u)}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Harga */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Harga</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual (Default) <span className="text-red-400">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => {
                      setForm(f => ({ ...f, price: e.target.value }))
                      if (errors.price) setErrors(er => ({ ...er, price: '' }))
                    }}
                    placeholder="0"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 ${errors.price ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  />
                </div>
                {errors.price && <p className="text-xs text-red-400 mt-1">⚠ {errors.price}</p>}
              </div>

              {priceCategories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Harga per Kategori
                    <span className="ml-2 text-xs text-gray-400 font-normal bg-gray-100 px-2 py-0.5 rounded-full">Multi Harga</span>
                  </label>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    {priceCategories.map((pc, idx) => {
                      const pcID = getID(pc)
                      return (
                        <div key={pcID} className={`flex items-center gap-3 px-4 py-2.5 ${idx !== priceCategories.length - 1 ? 'border-b border-gray-100' : ''}`}>
                          <span className="text-sm text-gray-600 flex-1">{pc.name}</span>
                          <div className="relative w-40">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Rp</span>
                            <input
                              type="number"
                              value={form.custom_prices[pcID] || ''}
                              onChange={e => setForm(f => ({ ...f, custom_prices: { ...f.custom_prices, [pcID]: e.target.value } }))}
                              placeholder={form.price || '0'}
                              className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Kosongkan jika sama dengan harga default</p>
                </div>
              )}
            </div>
          </div>

          {/* Varian */}
          {variants.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-1">Varian Produk</h3>
              <p className="text-xs text-gray-400 mb-3">Opsional — pilih varian yang tersedia untuk produk ini</p>
              <div className="space-y-2">
                {variants.map(v => {
                  const vid = getID(v)
                  const isSelected = form.variant_ids.includes(vid)
                  return (
                    <div key={vid} onClick={() => toggleVariant(vid)} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition ${isSelected ? 'bg-emerald-50 border-emerald-300' : 'hover:bg-gray-50 border-gray-100'}`}>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{v.name}</p>
                        <p className="text-xs text-gray-400">{v.options?.map(o => o.name).join(', ') || '-'}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                        {isSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Outlet */}
          {outlets.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-1">Outlet</h3>
              <p className="text-xs text-gray-400 mb-3">Opsional — pilih outlet yang menjual produk ini</p>
              <div className="space-y-2">
                {outlets.map(o => {
                  const oid = getID(o)
                  const isSelected = form.outlet_ids.includes(oid)
                  return (
                    <div key={oid} onClick={() => toggleOutlet(oid)} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition ${isSelected ? 'bg-emerald-50 border-emerald-300' : 'hover:bg-gray-50 border-gray-100'}`}>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{o.name}</p>
                        {o.address && <p className="text-xs text-gray-400">{o.address}</p>}
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                        {isSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Tombol */}
          <div className="flex gap-3 pb-6">
            <button onClick={() => navigate('/products')} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium transition">Batal</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-sm font-medium transition">
              {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}