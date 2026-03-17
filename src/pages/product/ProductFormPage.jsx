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

  // UI Toggles
  const [showDescription, setShowDescription] = useState(false)
  const [showVariants, setShowVariants] = useState(false)
  const [showAdditionalPrice, setShowAdditionalPrice] = useState(false)
  const [showOutlets, setShowOutlets] = useState(false) // For "Semua Outlet" logic

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
      setShowDescription(!!item.description)
      setShowVariants(!!(item.variants && item.variants.length > 0))
      setShowOutlets(!!(item.outlets && item.outlets.length > 0))
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
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        
        {/* Card 1: Upload Gambar Produk */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Upload Gambar Produk</h3>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => fileRef.current.click()}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
            >
              Choose File
            </button>
            <span className="text-sm text-gray-400">
              {imagePreview ? 'Gambar dipilih' : 'No file chosen'}
            </span>
          </div>
          {imagePreview && (
            <div className="mt-4 relative w-32 h-32 rounded-xl overflow-hidden border border-gray-100 group">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <button 
                onClick={() => { setImagePreview(null); setForm(f => ({ ...f, image: '' })); fileRef.current.value = '' }}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
        </div>

        {/* Card 2: Informasi Produk */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Kode Produk</label>
            <input
              type="text"
              value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
              placeholder="Kode Produk"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 placeholder-gray-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Nama Produk</label>
            <input
              type="text"
              value={form.name}
              onChange={e => {
                setForm(f => ({ ...f, name: e.target.value }))
                if (errors.name) setErrors(er => ({ ...er, name: '' }))
              }}
              placeholder="Nama Produk"
              className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 placeholder-gray-300 ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              id="showDescription"
              checked={showDescription}
              onChange={e => setShowDescription(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="showDescription" className="text-sm font-bold text-gray-800 cursor-pointer">Deskripsi</label>
          </div>

          {showDescription && (
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Masukkan deskripsi produk..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Merek</label>
            <select
              value={form.brand_id}
              onChange={e => setForm(f => ({ ...f, brand_id: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white"
            >
              <option value="">[Merek]</option>
              {brands.map(b => <option key={getID(b)} value={getID(b)}>{b.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Kategori</label>
            <select
              value={form.category_id}
              onChange={e => {
                setForm(f => ({ ...f, category_id: e.target.value }))
                if (errors.category_id) setErrors(er => ({ ...er, category_id: '' }))
              }}
              className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white ${errors.category_id ? 'border-red-400' : 'border-gray-200'}`}
            >
              <option value="">[Kategori]</option>
              {categories.map(c => <option key={getID(c)} value={getID(c)}>{c.name}</option>)}
            </select>
            {errors.category_id && <p className="text-xs text-red-500 mt-1">{errors.category_id}</p>}
          </div>
        </div>

        {/* Card 3: Satuan Utama */}
        <div className="bg-[#EDF2FF] rounded-xl border border-gray-100 p-8">
          <label className="block text-xs font-bold text-gray-700 uppercase mb-3">Satuan utama</label>
          <select
            value={form.unit_id}
            onChange={e => setForm(f => ({ ...f, unit_id: e.target.value }))}
            className="w-1/3 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white"
          >
            <option value="">[Satuan]</option>
            {units.map(u => <option key={getID(u)} value={getID(u)}>{u.name}</option>)}
          </select>
        </div>

        {/* Card 4: Varian */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-4">
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              id="showVariants"
              checked={showVariants}
              onChange={e => setShowVariants(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="showVariants" className="text-sm font-bold text-gray-800 cursor-pointer">Varian</label>
          </div>

          {showVariants && variants.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              {variants.map(v => {
                const vid = getID(v)
                const isSelected = form.variant_ids.includes(vid)
                return (
                  <div 
                    key={vid} 
                    onClick={() => toggleVariant(vid)}
                    className={`flex items-center justify-between p-4 rounded-xl cursor-pointer border transition ${isSelected ? 'bg-emerald-50 border-emerald-500' : 'border-gray-100 hover:bg-gray-50'}`}
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-800">{v.name}</p>
                      <p className="text-xs text-gray-400">{v.options?.map(o => o.name).join(', ')}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                      {isSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Card 5: Outlet & Pricing */}
        <div className="bg-[#EDF2FF] rounded-xl border border-gray-100 p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="showOutlets"
                checked={showOutlets}
                onChange={e => {
                  setShowOutlets(e.target.checked)
                  if (!e.target.checked) setForm(f => ({ ...f, outlet_ids: [] }))
                  else if (outlets.length > 0) setForm(f => ({ ...f, outlet_ids: outlets.map(o => getID(o)) }))
                }}
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="showOutlets" className="text-sm text-gray-800 font-medium">Semua Outlet</label>
            </div>
          </div>

          <div className="bg-[#C7D2FE] rounded-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-2 bg-[#C7D2FE] text-[10px] font-bold text-indigo-900 uppercase">Satuan Terkecil</div>
            <div className="bg-[#EDF2FF] p-6 space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-800">Harga Jual</label>
                <div className="flex items-center gap-6">
                  <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-emerald-400">
                    <span className="px-3 text-xs text-gray-400 font-medium border-r border-gray-100 uppercase tracking-tighter">Rp</span>
                    <input
                      type="number"
                      value={form.price}
                      onChange={e => {
                        setForm(f => ({ ...f, price: e.target.value }))
                        if (errors.price) setErrors(er => ({ ...er, price: '' }))
                      }}
                      className="flex-1 px-4 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="hargaTambahan"
                      checked={showAdditionalPrice}
                      onChange={e => setShowAdditionalPrice(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="hargaTambahan" className="text-xs font-bold text-gray-800 cursor-pointer">Harga Tambahan</label>
                  </div>
                </div>
                {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
              </div>

              {showAdditionalPrice && priceCategories.length > 0 && (
                <div className="space-y-3 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Harga Per Kategori</p>
                  <div className="grid grid-cols-2 gap-3">
                    {priceCategories.map(pc => {
                      const pcID = getID(pc)
                      return (
                        <div key={pcID} className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-gray-600 italic pl-1">{pc.name}</label>
                          <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-emerald-400">
                             <span className="px-2.5 text-[10px] text-gray-400 font-medium border-r border-gray-100 uppercase tracking-tighter">Rp</span>
                             <input
                              type="number"
                              value={form.custom_prices[pcID] || ''}
                              onChange={e => setForm(f => ({ ...f, custom_prices: { ...f.custom_prices, [pcID]: e.target.value } }))}
                              placeholder={form.price || '0'}
                              className="flex-1 px-3 py-1.5 text-xs focus:outline-none"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-8 flex gap-4">
            <button 
              onClick={() => navigate('/products')}
              className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold transition min-w-[140px]"
            >
              Batal
            </button>
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="flex-1 py-3 bg-[#0369a1] hover:bg-[#075985] text-white rounded-xl font-bold text-sm shadow-md transition active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
        </div>

      </div>
    </Layout>
  )
}