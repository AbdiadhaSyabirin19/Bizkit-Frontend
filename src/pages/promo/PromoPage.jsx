import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import ConfirmDialog from '../../components/ConfirmDialog'
import api from '../../api/axios'
import { useNavigate } from 'react-router-dom'
import { usePermission } from '../../hooks/usePermission'

const getID = (row) => row.ID || row.id

const DAYS = [
  { id: '7', label: 'Minggu' }, { id: '1', label: 'Senin' }, { id: '2', label: 'Selasa' },
  { id: '3', label: 'Rabu' }, { id: '4', label: 'Kamis' }, { id: '5', label: 'Jumat' }, { id: '6', label: 'Sabtu' },
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
  const [search, setSearch] = useState({
    active: '',
    upcoming: '',
    inactive: '',
    ended: ''
  })
  const [showForm, setShowForm] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [detailItem, setDetailItem] = useState(null)
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

  const getFilteredData = (status) => {
    return data.filter(d => {
      const matchStatus = getPromoStatus(d) === status
      const matchSearch = d.name?.toLowerCase().includes((search[status] || '').toLowerCase())
      return matchStatus && matchSearch
    })
  }

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
  const openDetail = (item) => { setDetailItem(item); setShowDetail(true) }

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
      active:   { cls: 'bg-emerald-100 text-emerald-700',  label: 'Aktif' },
      inactive: { cls: 'bg-gray-100 text-gray-500',    label: 'Tidak Aktif' },
      upcoming: { cls: 'bg-blue-100 text-blue-600',    label: 'Akan Datang' },
      ended:    { cls: 'bg-red-100 text-red-500',      label: 'Sudah Selesai' },
    }
    const { cls, label } = cfg[s] || cfg.inactive
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${cls}`}>{label}</span>
  }

  // ===================== FORM VIEW =====================
  if (showForm) {
    return (
      <Layout title="Promo & Voucher">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-10">
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-x-10 gap-y-6">
              {/* Row 1: Nama & Jenis */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-2 uppercase tracking-tight">Nama Promo</label>
                <input type="text" value={form.name}
                  onChange={e => { setForm(f => ({ ...f, name: e.target.value })); if (errors.name) setErrors(er => ({ ...er, name: '' })) }}
                  className={`w-full px-4 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} />
                {errors.name && <p className="text-[10px] text-red-400 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-2 uppercase tracking-tight">Jenis Promo</label>
                <select value={form.promo_type} 
                  onChange={e => { setForm(f => ({ ...f, promo_type: e.target.value, special_prices: [] })); setErrors(er => ({ ...er, discount_pct: '', cut_price: '', special_prices: '' })) }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  <option value="discount">Diskon (%)</option>
                  <option value="cut_price">Potongan Harga (Rp)</option>
                  <option value="special_price">Harga Spesial</option>
                </select>
              </div>

              {/* Detail Promo based on type */}
              {form.promo_type === 'discount' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-2 uppercase tracking-tight">Diskon (%)</label>
                    <input type="number" value={form.discount_pct}
                      onChange={e => setForm(f => ({ ...f, discount_pct: Number(e.target.value) }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-xs" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-2 uppercase tracking-tight">Maksimal Diskon (Rp)</label>
                    <input type="number" value={form.max_discount}
                      onChange={e => setForm(f => ({ ...f, max_discount: Number(e.target.value) }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-xs" 
                    />
                  </div>
                </>
              )}
              {form.promo_type === 'cut_price' && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-2 uppercase tracking-tight">Potongan Harga (Rp)</label>
                  <input type="number" value={form.cut_price}
                    onChange={e => setForm(f => ({ ...f, cut_price: Number(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-xs" 
                  />
                </div>
              )}

              {/* Row 2: Berlaku Pada */}
              <div className="col-span-1">
                <label className="block text-[10px] font-bold text-gray-700 mb-2 uppercase tracking-tight">Promo Berlaku Pada</label>
                <select value={form.applies_to} onChange={e => setForm(f => ({ ...f, applies_to: e.target.value, items: [] }))} 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400">
                  <option value="all">Semua Produk</option>
                  <option value="category">Kategori</option>
                  <option value="brand">Merek</option>
                  <option value="product">Produk Tertentu</option>
                </select>
              </div>

              {form.applies_to !== 'all' && (
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-gray-700 mb-2 uppercase tracking-tight">Pilih {appliesToLabel(form.applies_to)}</label>
                  <div className="grid grid-cols-4 gap-2 border border-gray-100 rounded-xl p-3 max-h-40 overflow-y-auto">
                    {(form.applies_to === 'category' ? categories : form.applies_to === 'brand' ? brands : products).map(item => {
                      const itemId = getID(item)
                      const selected = form.items.some(i => i.ref_id === itemId && i.ref_type === form.applies_to)
                      return (
                        <div key={itemId} onClick={() => toggleItem(form.applies_to, itemId, item.name)}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition ${selected ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50 text-gray-600'}`}>
                          <div className={`w-3 h-3 rounded border flex items-center justify-center ${selected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                            {selected && <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <span className="text-[10px] truncate">{item.name}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Row 3: Syarat & Min Qty */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-2 uppercase tracking-tight">Syarat Promo</label>
                <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400">
                  <option value="qty">Qty Pembelian</option>
                  <option value="total">Total Pembelian</option>
                  <option value="qty_or_total">Qty atau Total Pembelian</option>
                  <option value="qty_and_total">Qty dan Total Pembelian</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-2 uppercase tracking-tight">
                  {form.condition.includes('total') ? 'Min Total Pembelian' : 'Min Qty Produk'}
                </label>
                <input type="number" 
                  value={form.condition.includes('total') ? form.min_total : form.min_qty} 
                  onChange={e => setForm(f => ({ ...f, [form.condition.includes('total') ? 'min_total' : 'min_qty']: Number(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-xs" />
                <p className="text-[8px] text-gray-400 mt-1 leading-tight">
                  Jumlah yang dihitung adalah satuan utama, berlaku pada ketentuan yang dipilih saja
                </p>
              </div>

              {/* Row 4: Hari Aktif */}
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-gray-700 mb-3 uppercase tracking-tight">Hari Aktif</label>
                <div className="flex gap-6">
                  {DAYS.map(d => (
                    <label key={d.id} className="flex items-center gap-2 cursor-pointer group">
                      <div onClick={() => toggleDay(d.id)} className={`w-4 h-4 rounded border flex items-center justify-center transition ${activeDays.includes(d.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-400'}`}>
                        {activeDays.includes(d.id) && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className="text-[10px] font-bold text-gray-700">{d.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Row 5: Waktu */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-2 uppercase tracking-tight">Waktu Mulai</label>
                <input type="datetime-local" 
                  value={form.start_date ? `${form.start_date.split('T')[0]}T${form.start_time || '00:00'}` : ''} 
                  onChange={e => {
                    const [d, t] = e.target.value.split('T')
                    setForm(f => ({ ...f, start_date: d, start_time: t }))
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-2 uppercase tracking-tight">Waktu Berakhir</label>
                <input type="datetime-local" 
                  value={form.end_date ? `${form.end_date.split('T')[0]}T${form.end_time || '23:59'}` : ''}
                  onChange={e => {
                    const [d, t] = e.target.value.split('T')
                    setForm(f => ({ ...f, end_date: d, end_time: t }))
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-xs" />
              </div>

              {/* Special Price Table if applicable */}
              {form.promo_type === 'special_price' && (
                <div className="col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-gray-700 uppercase">Produk & Harga Spesial</label>
                  </div>
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-[10px]">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-2 font-bold text-gray-600">Nama Produk</th>
                          <th className="px-4 py-2 font-bold text-gray-600">Harga Normal</th>
                          <th className="px-4 py-2 font-bold text-gray-600">Harga Spesial</th>
                          <th className="px-4 py-2 font-bold text-gray-600 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {form.special_prices.map((sp, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 text-gray-700">{sp.name}</td>
                            <td className="px-4 py-2 text-gray-400">Rp {Number(products.find(p => getID(p) === sp.product_id)?.price || 0).toLocaleString('id-ID')}</td>
                            <td className="px-4 py-2">
                              <input type="number" value={sp.buy_price} 
                                onChange={e => updateSpecialPrice(idx, Number(e.target.value))} 
                                className="w-24 px-2 py-1 border border-gray-200 rounded" />
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button onClick={() => removeSpecialPrice(idx)} className="text-red-400 hover:text-red-600 font-bold">Hapus</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex gap-2">
                    <select className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-xs" onChange={e => {
                      const p = products.find(prod => getID(prod) === Number(e.target.value))
                      if (p) addSpecialPrice(getID(p), p.name)
                      e.target.value = ""
                    }}>
                      <option value="">+ Tambah Produk</option>
                      {products.filter(p => !form.special_prices.find(s => s.product_id === getID(p))).map(p => (
                        <option key={getID(p)} value={getID(p)}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Row 6: Tambah Voucher (Header) */}
              <div className="col-span-2 pt-4 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-800">Tambah Voucher</h3>
              </div>

              {/* Row 7: Jenis Voucher & Limit */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-2 uppercase tracking-tight">Jenis Voucher</label>
                <select value={form.voucher_type} onChange={e => setForm(f => ({ ...f, voucher_type: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400">
                  <option value="none">-- Tanpa Voucher --</option>
                  <option value="custom">Kode Custom</option>
                  <option value="generate">Generate Otomatis</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-2 uppercase tracking-tight">Maks Promo Diambil/Qty Voucher</label>
                <input type="number" value={form.max_usage} onChange={e => setForm(f => ({ ...f, max_usage: Number(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-xs" />
                <p className="text-[8px] text-gray-400 mt-1 leading-tight">Biarkan kosong apabila tidak ada limit.</p>
              </div>

              {form.voucher_type === 'custom' && (
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-gray-700 mb-2 uppercase tracking-tight">Kode Voucher</label>
                  <input type="text" value={form.voucher_code} onChange={e => setForm(f => ({ ...f, voucher_code: e.target.value.toUpperCase() }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-xs font-mono" />
                </div>
              )}

              {/* Row 8: Status */}
              <div className="col-span-2 flex justify-end">
                <div className="w-48">
                  <label className="block text-[10px] font-bold text-gray-700 mb-2 uppercase tracking-tight">Promo Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400">
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button 
            disabled={saving}
            onClick={handleSave}
            className="w-full py-4 bg-[#343A40] text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:bg-gray-400"
          >
            {saving ? 'Sedang Menyimpan...' : 'Simpan'}
          </button>
        </div>

        <button 
          onClick={() => setShowForm(false)}
          className="mx-auto block text-[10px] font-bold text-gray-500 hover:text-gray-700 transition-colors mb-20"
        >
          KEMBALI KE DAFTAR
        </button>
      </Layout>
    )
  }

  // ===================== DETAIL VIEW =====================
  if (showDetail && detailItem) {
    const d = detailItem
    const status = getPromoStatus(d)
    return (
      <Layout title="Detail Promo">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-10">
          <div className="bg-[#343A40] p-6 text-white flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">{d.name}</h2>
              <p className="text-gray-400 text-xs">ID: {getID(d)} | {promoTypeLabel(d.promo_type)}</p>
            </div>
            {statusBadge(d)}
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-8">
              {/* Group 1: Informasi Dasar */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b pb-2">Informasi Dasar</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Jenis Promo</p>
                    <p className="text-xs font-medium text-gray-700">{promoTypeLabel(d.promo_type)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Berlaku Pada</p>
                    <p className="text-xs font-medium text-gray-700">{appliesToLabel(d.applies_to)} {d.items?.length > 0 && `(${d.items.length} item)`}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">{promoTypeLabel(d.promo_type)} Value</p>
                    <p className="text-lg font-bold text-emerald-600">{promoValueLabel(d)}</p>
                    {d.promo_type === 'discount' && d.max_discount > 0 && (
                      <p className="text-[10px] text-gray-400">Maks. Rp {Number(d.max_discount).toLocaleString('id-ID')}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Group 2: Syarat & Ketentuan */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b pb-2">Syarat & Ketentuan</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Ketentuan Pembelian</p>
                    <p className="text-xs font-medium text-gray-700 leading-relaxed">
                      {d.condition === 'qty' && `Minimal pembelian quantity sebanyak ${d.min_qty}`}
                      {d.condition === 'total' && `Minimal total belanja senilai Rp ${Number(d.min_total).toLocaleString('id-ID')}`}
                      {d.condition === 'qty_or_total' && `Minimal Qty ${d.min_qty} atau Total Belanja Rp ${Number(d.min_total).toLocaleString('id-ID')}`}
                      {d.condition === 'qty_and_total' && `Minimal Qty ${d.min_qty} dan Total Belanja Rp ${Number(d.min_total).toLocaleString('id-ID')}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Limit Penggunaan</p>
                    <p className="text-xs font-medium text-gray-700">
                      {d.max_usage ? `${d.max_usage} kali (Terpakai: ${d.used_count || 0})` : 'Tidak terbatas'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Group 3: Waktu Aktif */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b pb-2">Jadwal Aktif</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Mulai</p>
                      <p className="text-xs font-medium text-gray-700">{d.start_date?.split('T')[0]} {d.start_time}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Berakhir</p>
                      <p className="text-xs font-medium text-gray-700">{d.end_date?.split('T')[0]} {d.end_time}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Hari Aktif</p>
                    <div className="flex flex-wrap gap-1">
                      {d.active_days?.split(',').map(dayId => (
                        <span key={dayId} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-bold">
                          {DAYS.find(day => day.id === dayId)?.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Group 4: Voucher */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b pb-2">Voucher</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Jenis Voucher</p>
                    <p className="text-xs font-medium text-gray-700 capitalize">{d.voucher_type === 'none' ? '-- Tanpa Voucher --' : d.voucher_type}</p>
                  </div>
                  {d.voucher_type !== 'none' && (
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Kode Voucher</p>
                      <p className="text-sm font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                        {d.voucher_code || '(Generated)'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Applies To List */}
            {d.applies_to !== 'all' && d.items?.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b pb-2">
                  Daftar {appliesToLabel(d.applies_to)} Terdaftar
                </h3>
                <div className="flex flex-wrap gap-2">
                  {d.items.map((item, i) => (
                    <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-medium border border-emerald-100">
                      {item.ref_name || item.ref_id}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Special Price Table */}
            {d.promo_type === 'special_price' && d.special_prices?.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b pb-2">Produk Harga Spesial</h3>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[10px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 font-bold text-gray-600">Produk</th>
                        <th className="px-4 py-2 font-bold text-gray-600 text-right">Harga Normal</th>
                        <th className="px-4 py-2 font-bold text-gray-600 text-right">Harga Spesial</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {d.special_prices.map((sp, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-gray-700">{sp.product?.name || sp.name || `ID: ${sp.product_id}`}</td>
                          <td className="px-4 py-2 text-gray-400 text-right italic">Rp {Number(sp.product?.price || 0).toLocaleString('id-ID')}</td>
                          <td className="px-4 py-2 text-right font-bold text-emerald-600">Rp {Number(sp.buy_price).toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="p-8 pt-0 flex gap-3">
            <button 
              onClick={() => { setShowDetail(false); openEdit(d) }}
              className="flex-1 py-3 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition"
            >
              Edit Promo Ini
            </button>
            <button 
              onClick={() => setShowDetail(false)}
              className="flex-1 py-3 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-gray-200 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  // ===================== LIST VIEW =====================
  const renderSection = (title, statusKey) => {
    const list = getFilteredData(statusKey)
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-700">{title}</h2>
          <div className="relative w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">🔍</span>
            <input 
              type="text" 
              placeholder="Cari..." 
              value={search[statusKey]}
              onChange={e => setSearch(prev => ({ ...prev, [statusKey]: e.target.value }))}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto min-h-[100px]">
            <table className="w-full text-[10px] text-left">
              <thead className="bg-[#E9ECEF] border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 font-bold text-gray-600 uppercase tracking-tight whitespace-nowrap">Tanggal Mulai</th>
                  <th className="px-3 py-2 font-bold text-gray-600 uppercase tracking-tight whitespace-nowrap">Tanggal Berakhir</th>
                  <th className="px-3 py-2 font-bold text-gray-600 uppercase tracking-tight whitespace-nowrap">Nama Promo</th>
                  <th className="px-3 py-2 font-bold text-gray-600 uppercase tracking-tight whitespace-nowrap">Jenis Promo</th>
                  <th className="px-3 py-2 font-bold text-gray-600 uppercase tracking-tight whitespace-nowrap">Promo Berlaku Pada</th>
                  <th className="px-3 py-2 font-bold text-gray-600 uppercase tracking-tight whitespace-nowrap">Batas Penukaran Promo</th>
                  <th className="px-3 py-2 font-bold text-gray-600 uppercase tracking-tight whitespace-nowrap">Sisa Promo</th>
                  <th className="px-3 py-2 font-bold text-gray-600 uppercase tracking-tight whitespace-nowrap">Hari Promo</th>
                  <th className="px-3 py-2 font-bold text-gray-600 uppercase tracking-tight whitespace-nowrap">Detail Ketentuan</th>
                  <th className="px-3 py-2 font-bold text-gray-600 uppercase tracking-tight whitespace-nowrap">Detail Promo</th>
                  <th className="px-3 py-2 font-bold text-gray-600 uppercase tracking-tight whitespace-nowrap">Promo Status</th>
                  <th className="px-3 py-2 font-bold text-gray-600 uppercase tracking-tight whitespace-nowrap text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="12" className="px-4 py-8 text-center text-gray-400">Loading...</td>
                  </tr>
                ) : list.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="px-4 py-8 text-center text-gray-400">Tidak ada data</td>
                  </tr>
                ) : list.map(promo => (
                  <tr key={getID(promo)} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{promo.start_date?.split('T')[0]}</td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{promo.end_date?.split('T')[0]}</td>
                    <td className="px-3 py-2.5 font-bold text-gray-700">{promo.name}</td>
                    <td className="px-3 py-2.5 text-gray-600">{promoTypeLabel(promo.promo_type)}</td>
                    <td className="px-3 py-2.5 text-gray-600">{appliesToLabel(promo.applies_to)}</td>
                    <td className="px-3 py-2.5 text-gray-600">{promo.max_usage || '-'}</td>
                    <td className="px-3 py-2.5 text-gray-600">{(promo.max_usage || 0) - (promo.used_count || 0)}</td>
                    <td className="px-3 py-2.5 text-gray-500 max-w-[120px] truncate">
                      {promo.active_days?.split(',').map(d => DAYS.find(day => day.id === d)?.label).join(', ')}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 max-w-[150px] truncate">
                      {promo.condition === 'qty' && `Min Qty ${promo.min_qty}`}
                      {promo.condition === 'total' && `Min Total Rp ${Number(promo.min_total).toLocaleString('id-ID')}`}
                      {promo.condition === 'qty_or_total' && `Min Qty ${promo.min_qty} / Total Rp ${Number(promo.min_total).toLocaleString('id-ID')}`}
                      {promo.condition === 'qty_and_total' && `Min Qty ${promo.min_qty} & Total Rp ${Number(promo.min_total).toLocaleString('id-ID')}`}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-emerald-600">{promoValueLabel(promo)}</td>
                    <td className="px-3 py-2.5">{statusBadge(promo)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-center gap-1">
                        <button 
                          onClick={() => openDetail(promo)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-bold transition shadow-sm"
                        >
                          Detail
                        </button>
                        <button 
                          onClick={() => openEdit(promo)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded text-[10px] font-bold transition shadow-sm"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => setConfirm({ open: true, id: getID(promo) })}
                          className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-[10px] font-bold transition shadow-sm"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Layout title="Promo & Voucher">
      <div className="max-w-[1600px] mx-auto p-4 space-y-10">
        
        {renderSection('Promo & Voucher - Aktif', 'active')}
        {renderSection('Promo & Voucher - Akan Datang', 'upcoming')}
        {renderSection('Promo & Voucher - Tidak Aktif', 'inactive')}
        {renderSection('Promo & Voucher - Sudah Selesai', 'ended')}

        {/* FAB */}
        {can('promos', 'create') && (
          <button 
            onClick={openAdd}
            className="fixed bottom-10 right-10 w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-emerald-700 transition-all hover:scale-110 z-40 group"
          >
            <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}

        <ConfirmDialog isOpen={confirm.open} onClose={() => setConfirm({ open: false })} onConfirm={handleDelete} />
      </div>
    </Layout>
  )
}