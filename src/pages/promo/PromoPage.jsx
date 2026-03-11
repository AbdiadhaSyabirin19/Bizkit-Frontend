import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import ConfirmDialog from '../../components/ConfirmDialog'
import api from '../../api/axios'
import { useNavigate } from 'react-router-dom'
import { usePermission } from '../../hooks/usePermission'

const getID = (row) => row.ID || row.id

const DAYS = [
  { id: '1', label: 'Sen' }, { id: '2', label: 'Sel' }, { id: '3', label: 'Rab' },
  { id: '4', label: 'Kam' }, { id: '5', label: 'Jum' }, { id: '6', label: 'Sab' }, { id: '7', label: 'Min' },
]

const defaultForm = {
  name: '', promo_type: 'discount', applies_to: 'all', condition: 'qty',
  min_qty: 1, min_total: 0, discount_pct: 0, max_discount: 0, cut_price: 0,
  active_days: '1,2,3,4,5,6,7', start_time: '00:00', end_time: '23:59',
  start_date: '', end_date: '', voucher_type: 'none', voucher_code: '',
  max_usage: 0, status: 'active', items: [], special_prices: [],
}

const STATUS_FILTERS = [
  { key: 'all',      label: 'Semua' },
  { key: 'active',   label: 'Aktif' },
  { key: 'inactive', label: 'Nonaktif' },
  { key: 'upcoming', label: 'Akan Datang' },
  { key: 'ended',    label: 'Sudah Selesai' },
]

// Prioritas: tanggal dulu, baru field status
const getPromoStatus = (promo) => {
  const today = new Date().toISOString().split('T')[0]
  const start = promo.start_date?.split('T')[0]
  const end = promo.end_date?.split('T')[0]
  if (end && end < today) return 'ended'
  if (start && start > today) return 'upcoming'
  if (promo.status !== 'active') return 'inactive'
  return 'active'
}

export default function PromoPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [errors, setErrors] = useState({})
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const navigate = useNavigate()
  const { can } = usePermission()

  useEffect(() => { fetchData(); fetchMaster() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/promos')
      setData(res.data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const fetchMaster = async () => {
    try {
      const [pRes, cRes, bRes] = await Promise.all([api.get('/products'), api.get('/categories'), api.get('/brands')])
      setProducts(pRes.data.data || [])
      setCategories(cRes.data.data || [])
      setBrands(bRes.data.data || [])
    } catch (err) { console.error(err) }
  }

  const filtered = data.filter(d => {
    const matchSearch = d.name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || getPromoStatus(d) === filterStatus
    return matchSearch && matchStatus
  })

  const counts = STATUS_FILTERS.reduce((acc, f) => {
    acc[f.key] = f.key === 'all' ? data.length : data.filter(d => getPromoStatus(d) === f.key).length
    return acc
  }, {})

  const openAdd = () => { setForm(defaultForm); setErrors({}); setEditItem(null); setShowForm(true) }

  const openEdit = (item) => {
    setErrors({})
    setForm({
      name: item.name || '', promo_type: item.promo_type || 'discount',
      applies_to: item.applies_to || 'all', condition: item.condition || 'qty',
      min_qty: item.min_qty || 1, min_total: item.min_total || 0,
      discount_pct: item.discount_pct || 0, max_discount: item.max_discount || 0,
      cut_price: item.cut_price || 0, active_days: item.active_days || '1,2,3,4,5,6,7',
      start_time: item.start_time || '00:00', end_time: item.end_time || '23:59',
      start_date: item.start_date?.split('T')[0] || '', end_date: item.end_date?.split('T')[0] || '',
      voucher_type: item.voucher_type || 'none', voucher_code: item.voucher_code || '',
      max_usage: item.max_usage || 0, status: item.status || 'active',
      items: item.items?.map(i => ({ ref_type: i.ref_type, ref_id: i.ref_id, ref_name: i.ref_name })) || [],
      special_prices: item.special_prices?.map(s => ({ product_id: s.product_id, buy_price: s.buy_price })) || [],
    })
    setEditItem(item); setShowForm(true)
  }

  const validatePromo = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nama promo wajib diisi'
    if (form.promo_type === 'discount' && (!form.discount_pct || Number(form.discount_pct) <= 0)) e.discount_pct = 'Persentase diskon wajib diisi dan lebih dari 0'
    if (form.promo_type === 'discount' && Number(form.discount_pct) > 100) e.discount_pct = 'Persentase diskon tidak boleh lebih dari 100%'
    if (form.promo_type === 'cut_price' && (!form.cut_price || Number(form.cut_price) <= 0)) e.cut_price = 'Potongan harga wajib diisi dan lebih dari 0'
    if (form.promo_type === 'special_price' && form.special_prices.length === 0) e.special_prices = 'Minimal 1 produk harga spesial wajib ditambahkan'
    if (!form.start_date) e.start_date = 'Tanggal mulai wajib diisi'
    if (!form.end_date) e.end_date = 'Tanggal berakhir wajib diisi'
    if (form.start_date && form.end_date && form.start_date > form.end_date) e.end_date = 'Tanggal berakhir tidak boleh sebelum tanggal mulai'
    if (form.voucher_type === 'custom' && !form.voucher_code.trim()) e.voucher_code = 'Kode voucher wajib diisi'
    if (form.voucher_type === 'generate' && (!form.max_usage || Number(form.max_usage) <= 0)) e.max_usage = 'Jumlah voucher yang digenerate wajib diisi dan lebih dari 0'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validatePromo()) return
    setSaving(true)
    try {
      if (editItem) await api.put(`/promos/${getID(editItem)}`, form)
      else await api.post('/promos', form)
      fetchData(); setShowForm(false)
    } catch (err) { console.error('Error:', err.response?.data || err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/promos/${confirm.id}`)
      fetchData()
    } catch (err) { console.error(err) }
    finally { setConfirm({ open: false, id: null }) }
  }

  const toggleDay = (dayId) => {
    const days = form.active_days ? form.active_days.split(',').filter(Boolean) : []
    const newDays = days.includes(dayId) ? days.filter(d => d !== dayId) : [...days, dayId].sort()
    setForm(f => ({ ...f, active_days: newDays.join(',') }))
  }

  const toggleItem = (refType, refId, refName) => {
    const exists = form.items.find(i => i.ref_type === refType && i.ref_id === refId)
    if (exists) setForm(f => ({ ...f, items: f.items.filter(i => !(i.ref_type === refType && i.ref_id === refId)) }))
    else setForm(f => ({ ...f, items: [...f.items, { ref_type: refType, ref_id: refId, ref_name: refName }] }))
  }

  const addSpecialPrice = (productId, productName) => {
    if (!form.special_prices.find(s => s.product_id === productId)) {
      setForm(f => ({ ...f, special_prices: [...f.special_prices, { product_id: productId, buy_price: 0, name: productName }] }))
      if (errors.special_prices) setErrors(er => ({ ...er, special_prices: '' }))
    }
  }

  const updateSpecialPrice = (idx, val) => setForm(f => ({ ...f, special_prices: f.special_prices.map((s, i) => i === idx ? { ...s, buy_price: val } : s) }))
  const removeSpecialPrice = (idx) => setForm(f => ({ ...f, special_prices: f.special_prices.filter((_, i) => i !== idx) }))

  const activeDays = form.active_days ? form.active_days.split(',').filter(Boolean) : []
  const promoTypeLabel = (t) => ({ special_price: 'Harga Spesial', discount: 'Diskon', cut_price: 'Potongan' }[t] || t)
  const appliesToLabel = (t) => ({ all: 'Semua', category: 'Kategori', brand: 'Merek', product: 'Produk' }[t] || t)

  const promoValueLabel = (promo) => {
    if (promo.promo_type === 'discount') return `${promo.discount_pct}%`
    if (promo.promo_type === 'cut_price') return `Rp ${Number(promo.cut_price).toLocaleString('id-ID')}`
    if (promo.promo_type === 'special_price') return 'Spesial'
    return '-'
  }

  const statusBadge = (promo) => {
    const s = getPromoStatus(promo)
    const cfg = {
      active:   { cls: 'bg-green-100 text-green-700',  label: '● Aktif' },
      inactive: { cls: 'bg-gray-100 text-gray-500',    label: '● Nonaktif' },
      upcoming: { cls: 'bg-blue-100 text-blue-600',    label: '⏳ Akan Datang' },
      ended:    { cls: 'bg-red-100 text-red-500',      label: '✓ Selesai' },
    }
    const { cls, label } = cfg[s] || cfg.inactive
    return <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${cls}`}>{label}</span>
  }

  // ===================== FORM VIEW =====================
  if (showForm) {
    return (
      <Layout title="Promo & Voucher">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{editItem ? 'Edit Promo' : 'Tambah Promo'}</h1>
              <p className="text-gray-500 text-sm">Isi detail promo & voucher</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">Informasi Dasar</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Promo <span className="text-red-400">*</span></label>
                  <input type="text" value={form.name}
                    onChange={e => { setForm(f => ({ ...f, name: e.target.value })); if (errors.name) setErrors(er => ({ ...er, name: '' })) }}
                    placeholder="Contoh: Promo Gojek 20%"
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} />
                  {errors.name && <p className="text-xs text-red-400 mt-1">⚠ {errors.name}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                      <option value="active">Aktif</option>
                      <option value="inactive">Nonaktif</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Berlaku Pada</label>
                    <select value={form.applies_to} onChange={e => setForm(f => ({ ...f, applies_to: e.target.value, items: [] }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                      <option value="all">Semua Produk</option>
                      <option value="category">Kategori</option>
                      <option value="brand">Merek</option>
                      <option value="product">Produk Tertentu</option>
                    </select>
                  </div>
                </div>
                {form.applies_to !== 'all' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pilih {appliesToLabel(form.applies_to)}</label>
                    <div className="border border-gray-200 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1">
                      {(form.applies_to === 'category' ? categories : form.applies_to === 'brand' ? brands : products).map(item => {
                        const itemId = getID(item)
                        const selected = form.items.some(i => i.ref_id === itemId && i.ref_type === form.applies_to)
                        return (
                          <div key={itemId} onClick={() => toggleItem(form.applies_to, itemId, item.name)}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${selected ? 'bg-emerald-50 border border-emerald-300' : 'hover:bg-gray-50 border border-transparent'}`}>
                            <span className="text-sm text-gray-700">{item.name}</span>
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                              {selected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">Jenis Promo</h3>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[{ value: 'special_price', label: 'Harga Spesial', icon: '🏷️' }, { value: 'discount', label: 'Diskon %', icon: '💸' }, { value: 'cut_price', label: 'Potongan Harga', icon: '✂️' }].map(t => (
                  <button key={t.value} onClick={() => { setForm(f => ({ ...f, promo_type: t.value, special_prices: [] })); setErrors(er => ({ ...er, discount_pct: '', cut_price: '', special_prices: '' })) }}
                    className={`p-3 rounded-xl border-2 text-center transition ${form.promo_type === t.value ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <p className="text-xl mb-1">{t.icon}</p>
                    <p className="text-xs font-medium text-gray-700">{t.label}</p>
                  </button>
                ))}
              </div>

              {form.promo_type === 'special_price' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Produk & Harga Spesial
                    {form.applies_to !== 'all' && form.items.length === 0 && <span className="ml-2 text-xs text-orange-400 font-normal">⚠ Pilih {appliesToLabel(form.applies_to)} dulu di atas</span>}
                  </label>
                  {errors.special_prices && <p className="text-xs text-red-400 mb-2">⚠ {errors.special_prices}</p>}
                  <div className={`border rounded-xl p-3 max-h-40 overflow-y-auto mb-2 space-y-1 ${errors.special_prices ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
                    {(() => {
                      let fp = products
                      if (form.applies_to === 'category' && form.items.length > 0) { const ids = form.items.map(i => i.ref_id); fp = products.filter(p => ids.includes(p.category_id)) }
                      else if (form.applies_to === 'brand' && form.items.length > 0) { const ids = form.items.map(i => i.ref_id); fp = products.filter(p => ids.includes(p.brand_id)) }
                      else if (form.applies_to === 'product' && form.items.length > 0) { const ids = form.items.map(i => i.ref_id); fp = products.filter(p => ids.includes(getID(p))) }
                      if (fp.length === 0) return <p className="text-center text-gray-400 text-sm py-4">{form.applies_to !== 'all' && form.items.length === 0 ? `Pilih ${appliesToLabel(form.applies_to)} terlebih dahulu` : 'Tidak ada produk tersedia'}</p>
                      return fp.map(p => {
                        const pid = getID(p); const added = form.special_prices.find(s => s.product_id === pid)
                        return (
                          <div key={pid} onClick={() => !added && addSpecialPrice(pid, p.name)}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${added ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-gray-50 border border-transparent'}`}>
                            <div>
                              <span className="text-sm text-gray-700">{p.name}</span>
                              {form.applies_to === 'all' && p.category?.name && <span className="ml-2 text-xs text-gray-400">{p.category.name}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">Rp {Number(p.price).toLocaleString('id-ID')}</span>
                              {!added ? <span className="text-xs text-emerald-600">+ Tambah</span> : <span className="text-xs text-emerald-600">✓ Ditambahkan</span>}
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                  {form.special_prices.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400">{form.special_prices.length} produk dipilih:</p>
                      {form.special_prices.map((sp, idx) => {
                        const prod = products.find(p => getID(p) === sp.product_id)
                        return (
                          <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2">
                            <span className="flex-1 text-sm text-gray-700">{prod?.name || sp.name}</span>
                            <span className="text-xs text-gray-400">Normal: Rp {Number(prod?.price || 0).toLocaleString('id-ID')}</span>
                            <div className="relative w-36">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Rp</span>
                              <input type="number" value={sp.buy_price} onChange={e => updateSpecialPrice(idx, Number(e.target.value))} className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="0" />
                            </div>
                            <button onClick={() => removeSpecialPrice(idx)} className="text-red-400 hover:text-red-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {form.promo_type === 'discount' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Diskon (%) <span className="text-red-400">*</span></label>
                    <input type="number" value={form.discount_pct}
                      onChange={e => { setForm(f => ({ ...f, discount_pct: Number(e.target.value) })); if (errors.discount_pct) setErrors(er => ({ ...er, discount_pct: '' })) }}
                      placeholder="0" min="0" max="100"
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 ${errors.discount_pct ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} />
                    {errors.discount_pct && <p className="text-xs text-red-400 mt-1">⚠ {errors.discount_pct}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maksimal Diskon (Rp)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                      <input type="number" value={form.max_discount} onChange={e => setForm(f => ({ ...f, max_discount: Number(e.target.value) }))} placeholder="0" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Kosongkan jika tidak ada batas maksimal</p>
                  </div>
                </div>
              )}

              {form.promo_type === 'cut_price' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Potongan Harga (Rp) <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                    <input type="number" value={form.cut_price}
                      onChange={e => { setForm(f => ({ ...f, cut_price: Number(e.target.value) })); if (errors.cut_price) setErrors(er => ({ ...er, cut_price: '' })) }}
                      placeholder="0"
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 ${errors.cut_price ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} />
                  </div>
                  {errors.cut_price && <p className="text-xs text-red-400 mt-1">⚠ {errors.cut_price}</p>}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">Syarat Promo</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ketentuan</label>
                  <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                    <option value="qty">Min Qty Pembelian</option>
                    <option value="total">Min Total Pembelian</option>
                    <option value="qty_or_total">Min Qty atau Total Pembelian</option>
                    <option value="qty_and_total">Min Qty dan Total Pembelian</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(form.condition === 'qty' || form.condition === 'qty_or_total' || form.condition === 'qty_and_total') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Qty</label>
                      <input type="number" value={form.min_qty} onChange={e => setForm(f => ({ ...f, min_qty: Number(e.target.value) }))} min="1" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    </div>
                  )}
                  {(form.condition === 'total' || form.condition === 'qty_or_total' || form.condition === 'qty_and_total') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Total (Rp)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                        <input type="number" value={form.min_total} onChange={e => setForm(f => ({ ...f, min_total: Number(e.target.value) }))} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">Waktu Aktif</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hari Aktif</label>
                  <div className="flex gap-2">
                    {DAYS.map(d => (
                      <button key={d.id} onClick={() => toggleDay(d.id)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition ${activeDays.includes(d.id) ? 'bg-emerald-500 text-white border-emerald-500' : 'border-gray-200 text-gray-600 hover:border-emerald-300'}`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Mulai</label>
                    <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Berakhir</label>
                    <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai <span className="text-red-400">*</span></label>
                    <input type="date" value={form.start_date}
                      onChange={e => { setForm(f => ({ ...f, start_date: e.target.value })); if (errors.start_date) setErrors(er => ({ ...er, start_date: '' })) }}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 ${errors.start_date ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} />
                    {errors.start_date && <p className="text-xs text-red-400 mt-1">⚠ {errors.start_date}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Berakhir <span className="text-red-400">*</span></label>
                    <input type="date" value={form.end_date}
                      onChange={e => { setForm(f => ({ ...f, end_date: e.target.value })); if (errors.end_date) setErrors(er => ({ ...er, end_date: '' })) }}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 ${errors.end_date ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} />
                    {errors.end_date && <p className="text-xs text-red-400 mt-1">⚠ {errors.end_date}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">Pengaturan Voucher</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Voucher</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ value: 'none', label: 'Tanpa Voucher', icon: '🚫' }, { value: 'custom', label: 'Kode Custom', icon: '🎟️' }, { value: 'generate', label: 'Generate Otomatis', icon: '⚡' }].map(v => (
                      <button key={v.value} onClick={() => { setForm(f => ({ ...f, voucher_type: v.value })); setErrors(er => ({ ...er, voucher_code: '', max_usage: '' })) }}
                        className={`p-3 rounded-xl border-2 text-center transition ${form.voucher_type === v.value ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <p className="text-xl mb-1">{v.icon}</p>
                        <p className="text-xs font-medium text-gray-700">{v.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
                {form.voucher_type === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kode Voucher <span className="text-red-400">*</span></label>
                    <input type="text" value={form.voucher_code}
                      onChange={e => { setForm(f => ({ ...f, voucher_code: e.target.value.toUpperCase() })); if (errors.voucher_code) setErrors(er => ({ ...er, voucher_code: '' })) }}
                      placeholder="Contoh: DISKON20"
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-mono ${errors.voucher_code ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} />
                    {errors.voucher_code && <p className="text-xs text-red-400 mt-1">⚠ {errors.voucher_code}</p>}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {form.voucher_type === 'generate' ? <>Jumlah Voucher <span className="text-red-400">*</span></> : 'Maks Penggunaan Promo'}
                  </label>
                  <input type="number" value={form.max_usage}
                    onChange={e => { setForm(f => ({ ...f, max_usage: Number(e.target.value) })); if (errors.max_usage) setErrors(er => ({ ...er, max_usage: '' })) }}
                    placeholder={form.voucher_type === 'generate' ? 'Jumlah voucher' : '0 = tidak terbatas'} min="0"
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 ${errors.max_usage ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} />
                  {errors.max_usage && <p className="text-xs text-red-400 mt-1">⚠ {errors.max_usage}</p>}
                  {form.voucher_type !== 'generate' && <p className="text-xs text-gray-400 mt-1">Isi 0 jika tidak ada batas penggunaan</p>}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pb-6">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium transition">Batal</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-sm font-medium transition">
                {saving ? 'Menyimpan...' : editItem ? 'Simpan Perubahan' : 'Simpan Promo'}
              </button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // ===================== LIST VIEW =====================
  return (
    <Layout title="Promo & Voucher">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Promo & Voucher</h1>
            <p className="text-gray-500 text-sm">Kelola promo dan voucher</p>
          </div>
          {can('promos', 'create') && (
            <button onClick={openAdd} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Promo
            </button>
          )}
        </div>

        {/* Search + Filter */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-5 space-y-3">
          <input
            type="text" placeholder="🔍 Cari nama promo..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map(f => {
              const colorMap = {
                all:      filterStatus === f.key ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400',
                active:   filterStatus === f.key ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:border-green-400',
                inactive: filterStatus === f.key ? 'bg-gray-500 text-white border-gray-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400',
                upcoming: filterStatus === f.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400',
                ended:    filterStatus === f.key ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-200 hover:border-red-300',
              }
              const badgeMap = {
                all:      filterStatus === f.key ? 'bg-white text-gray-800' : 'bg-gray-100 text-gray-500',
                active:   filterStatus === f.key ? 'bg-white text-green-700' : 'bg-gray-100 text-gray-500',
                inactive: filterStatus === f.key ? 'bg-white text-gray-600' : 'bg-gray-100 text-gray-500',
                upcoming: filterStatus === f.key ? 'bg-white text-blue-700' : 'bg-gray-100 text-gray-500',
                ended:    filterStatus === f.key ? 'bg-white text-red-600' : 'bg-gray-100 text-gray-500',
              }
              return (
                <button key={f.key} onClick={() => setFilterStatus(f.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 ${colorMap[f.key]}`}>
                  {f.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${badgeMap[f.key]}`}>
                    {counts[f.key]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">🎉</p>
            <p className="font-medium">Tidak ada promo ditemukan</p>
            <p className="text-sm mt-1">Coba ubah filter atau kata kunci pencarian</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['No', 'Nama Promo', 'Jenis & Nilai', 'Berlaku Pada', 'Voucher', 'Periode', 'Status', 'Aksi'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((promo, idx) => (
                    <tr key={getID(promo)} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>

                      {/* Nama */}
                      <td className="px-4 py-3 min-w-[140px]">
                        <p className="font-semibold text-gray-800 text-sm">{promo.name}</p>
                        {promo.max_usage > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">Terpakai: {promo.used_count || 0}/{promo.max_usage}</p>
                        )}
                      </td>

                      {/* Jenis & Nilai */}
                      <td className="px-4 py-3 min-w-[120px]">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium block w-fit mb-1">
                          {promoTypeLabel(promo.promo_type)}
                        </span>
                        <span className="font-semibold text-gray-800 text-sm">{promoValueLabel(promo)}</span>
                        {promo.promo_type === 'discount' && promo.max_discount > 0 && (
                          <p className="text-xs text-gray-400">maks Rp {Number(promo.max_discount).toLocaleString('id-ID')}</p>
                        )}
                      </td>

                      {/* Berlaku Pada */}
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-medium">
                          {appliesToLabel(promo.applies_to)}
                        </span>
                      </td>

                      {/* Voucher */}
                      <td className="px-4 py-3 min-w-[100px]">
                        {promo.voucher_type === 'none'
                          ? <span className="text-gray-300 text-xs">-</span>
                          : promo.voucher_type === 'custom'
                            ? <span className="font-mono text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded">{promo.voucher_code}</span>
                            : <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded">Auto</span>
                        }
                      </td>

                      {/* Periode */}
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap min-w-[160px]">
                        <span>{promo.start_date?.split('T')[0]}</span>
                        <span className="text-gray-300 mx-1">–</span>
                        <span>{promo.end_date?.split('T')[0]}</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">{statusBadge(promo)}</td>

                      {/* Aksi */}
                      <td className="px-4 py-3 min-w-[120px]">
                        <div className="flex gap-1.5">
                          <button onClick={() => navigate(`/promos/${getID(promo)}`)}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition whitespace-nowrap">
                            Detail
                          </button>
                          {can('promos', 'edit') && (
                            <button onClick={() => openEdit(promo)}
                              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition">
                              Edit
                            </button>
                          )}
                          {can('promos', 'delete') && (
                            <button onClick={() => setConfirm({ open: true, id: getID(promo) })}
                              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition">
                              Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <ConfirmDialog isOpen={confirm.open} onClose={() => setConfirm({ open: false })} onConfirm={handleDelete} />
      </div>
    </Layout>
  )
}