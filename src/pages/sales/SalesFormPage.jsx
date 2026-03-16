import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import { usePermission } from '../../hooks/usePermission'

const formatRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')

export default function SalesFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [products, setProducts] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [promos, setPromos] = useState([])
  const [priceCategories, setPriceCategories] = useState([])
  
  const [formData, setFormData] = useState({
    note_type: 'Kontan',
    date: new Date().toISOString().slice(0, 16).replace('T', ' '),
    customer_name: 'Umum',
    payment_method_id: '',
    price_category_id: '',
    promo_id: '',
    voucher_code: '',
    items: [{ product_id: '', quantity: 1, price: 0, subtotal: 0, discount: false }]
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [pRes, pmRes, promoRes, pcRes] = await Promise.all([
        api.get('/products'),
        api.get('/payment-methods'),
        api.get('/promos'),
        api.get('/price-categories')
      ])
      setProducts(pRes.data?.data || [])
      setPaymentMethods(pmRes.data?.data || [])
      setPromos((promoRes.data?.data || []).filter(p => p.status === 'active'))
      setPriceCategories(pcRes.data?.data || [])
      
      if (isEdit) {
        const sRes = await api.get(`/sales/${id}`)
        const s = sRes.data?.data
        setFormData({
          customer_name: s.customer_name || s.CustomerName,
          payment_method_id: s.payment_method_id || s.PaymentMethodID,
          price_category_id: s.price_category_id || s.PriceCategoryID || '',
          promo_id: s.promo_id || s.PromoID || '',
          items: (s.items || s.Items).map(item => ({
            product_id: item.product_id || item.ProductID,
            quantity: item.quantity || item.Quantity,
            price: item.base_price || item.BasePrice,
            subtotal: item.subtotal || item.Subtotal
          }))
        })
      } else if (pmRes.data?.data?.length > 0) {
        setFormData(prev => ({ ...prev, payment_method_id: pmRes.data.data[0].ID || pmRes.data.data[0].id }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: '', quantity: 1, price: 0, subtotal: 0, discount: false }]
    }))
  }

  const handleRemoveItem = (idx) => {
    if (formData.items.length === 1) return
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }))
  }

  const handleItemChange = async (idx, field, value) => {
    const newItems = [...formData.items]
    const item = { ...newItems[idx], [field]: value }
    
    if (field === 'product_id') {
      const prod = products.find(p => String(p.ID || p.id) === String(value))
      item.unit_name = prod?.unit?.name || 'Item'
      
      let price = 0
      if (!formData.price_category_id) {
        price = prod?.price || 0
      } else {
        try {
          const res = await api.get(`/products/${value}/prices`)
          const custom = res.data?.data?.find(p => String(p.price_category_id || p.PriceCategoryID) === String(formData.price_category_id))
          price = (custom && custom.price > 0) ? custom.price : (prod?.price || 0)
        } catch {
          price = prod?.price || 0
        }
      }
      item.price = price
    }
    
    item.subtotal = item.price * item.quantity
    newItems[idx] = item
    setFormData(prev => ({ ...prev, items: newItems }))
  }

  const handlePriceCategoryChange = async (catId) => {
    setFormData(prev => ({ ...prev, price_category_id: catId }))
    
    // Update all item prices
    const newItems = await Promise.all(formData.items.map(async item => {
      if (!item.product_id) return item
      
      let price = 0
      if (!catId) {
        // Balik ke harga default
        const prod = products.find(p => String(p.ID || p.id) === String(item.product_id))
        price = prod?.price || 0
      } else {
        try {
          // Cek harga khusus dari API
          const res = await api.get(`/products/${item.product_id}/prices`)
          const custom = res.data?.data?.find(p => String(p.price_category_id || p.PriceCategoryID) === String(catId))
          if (custom && custom.price > 0) {
            price = custom.price
          } else {
            const prod = products.find(p => String(p.ID || p.id) === String(item.product_id))
            price = prod?.price || 0
          }
        } catch {
          const prod = products.find(p => String(p.ID || p.id) === String(item.product_id))
          price = prod?.price || 0
        }
      }
      
      return { ...item, price, subtotal: price * item.quantity }
    }))
    
    setFormData(prev => ({ ...prev, items: newItems }))
  }

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + item.subtotal, 0)
  }

  const calculateDiscount = () => {
    if (!formData.promo_id) return 0
    const promo = promos.find(p => String(p.ID || p.id) === String(formData.promo_id))
    if (!promo) return 0

    // Cek syarat minimum
    const subtotal = calculateSubtotal()
    const totalQty = formData.items.reduce((s, i) => s + Number(i.quantity), 0)
    
    const minTotal = promo.min_total || promo.MinTotal || 0
    const minQty = promo.min_qty || promo.MinQty || 0
    
    if (minTotal > 0 && subtotal < minTotal) return 0
    if (minQty > 0 && totalQty < minQty) return 0

    // Cek cakupan produk (applies_to)
    const appliesTo = promo.applies_to || promo.AppliesTo || 'all'
    let applicableSubtotal = 0

    if (appliesTo === 'all') {
      applicableSubtotal = subtotal
    } else {
      const promoItems = promo.items || promo.Items || []
      formData.items.forEach(item => {
        const prod = products.find(p => String(p.ID || p.id) === String(item.product_id))
        if (!prod) return

        const isMatch = promoItems.some(pi => {
          if (pi.ref_type === 'product' || pi.RefType === 'product') {
            return String(pi.ref_id || pi.RefID) === String(item.product_id)
          }
          if (pi.ref_type === 'category' || pi.RefType === 'category') {
            return String(pi.ref_id || pi.RefID) === String(prod.category_id || prod.CategoryID)
          }
          if (pi.ref_type === 'brand' || pi.RefType === 'brand') {
            return String(pi.ref_id || pi.RefID) === String(prod.brand_id || prod.BrandID)
          }
          return false
        })

        if (isMatch) {
          applicableSubtotal += item.subtotal
        }
      })
    }

    if (applicableSubtotal <= 0) return 0

    let discount = 0
    const type = promo.promo_type || promo.PromoType
    if (type === 'discount') {
      const pct = promo.discount_pct || promo.DiscountPct || 0
      discount = applicableSubtotal * (pct / 100)
      const max = promo.max_discount || promo.MaxDiscount || 0
      if (max > 0 && discount > max) discount = max
    } else if (type === 'cut_price') {
      discount = promo.cut_price || promo.CutPrice || 0
      if (discount > applicableSubtotal) discount = applicableSubtotal
    }

    return discount
  }

  const calculateGrandTotal = () => {
    return calculateSubtotal() - calculateDiscount()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.payment_method_id || formData.items.some(i => !i.product_id)) {
      alert('Mohon lengkapi data transaksi')
      return
    }

    setSaving(true)
    try {
      const payload = {
        customer_name: formData.customer_name,
        source: 'dashboard',
        payment_method_id: Number(formData.payment_method_id),
        price_category_id: formData.price_category_id ? Number(formData.price_category_id) : null,
        promo_id: formData.promo_id ? Number(formData.promo_id) : null,
        items: formData.items.map(i => ({
          product_id: Number(i.product_id),
          quantity: Number(i.quantity)
        }))
      }
      
      if (isEdit) {
        await api.put(`/sales/${id}`, payload)
      } else {
        await api.post('/sales', payload)
      }
      navigate('/sales')
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan transaksi')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
    </div>
  )

  return (
    <Layout title={isEdit ? 'Edit Penjualan' : 'Input Penjualan'}>
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-4">
        {/* Top Header Card */}
        <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Jenis Nota</label>
              <select 
                value={formData.note_type}
                onChange={e => setFormData(p => ({ ...p, note_type: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              >
                <option value="Kontan">Kontan</option>
                <option value="Kredit">Kredit</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Penjualan</label>
              <input 
                type="text"
                value={formData.date}
                onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Pelanggan</label>
            <select 
              value={formData.customer_name}
              onChange={e => setFormData(p => ({ ...p, customer_name: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="Umum">Umum</option>
              {/* Other customers could be fetched here */}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Bayar ke</label>
            <select 
              value={formData.payment_method_id}
              onChange={e => setFormData(p => ({ ...p, payment_method_id: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="">Pilih...</option>
              {paymentMethods.map(m => (
                <option key={m.ID || m.id} value={m.ID || m.id}>{m.Name || m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Detail Section */}
        <div className="bg-[#eef2ff] p-6 rounded-lg border border-indigo-100 space-y-4">
          <h2 className="text-sm font-bold text-gray-700">Detail</h2>
          {formData.items.map((item, idx) => (
            <div key={idx} className="bg-white p-4 rounded-lg relative shadow-sm border border-gray-100">
              <button 
                type="button"
                onClick={() => handleRemoveItem(idx)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg transform transition active:scale-95 z-10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <p className="text-[10px] font-bold text-gray-800 mb-2 uppercase tracking-tight">Produk #{idx + 1}</p>
              
              <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                  <select 
                    value={item.product_id}
                    onChange={e => handleItemChange(idx, 'product_id', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-blue-400"
                  >
                    <option value="">| Nama Produk...</option>
                    {products.map(p => (
                      <option key={p.ID || p.id} value={p.ID || p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <button type="button" className="p-2 bg-[#2d3748] text-white rounded hover:bg-gray-700">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                </button>
              </div>

              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-3">
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Qty</label>
                  <input 
                    type="number"
                    value={item.quantity}
                    onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-right text-sm"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Satuan</label>
                  <select className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-gray-50">
                    <option>{item.unit_name || 'Satuan'}</option>
                  </select>
                </div>
                <div className="col-span-6">
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Harga</label>
                  <div className="flex items-center">
                    <span className="px-2 py-1.5 bg-gray-100 border border-r-0 border-gray-300 rounded-l text-[10px] text-gray-500">Rp</span>
                    <input 
                      type="text"
                      readOnly
                      value={item.price.toLocaleString('id-ID')}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-r text-right text-sm font-medium bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={item.discount}
                    onChange={e => handleItemChange(idx, 'discount', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-[10px] font-bold text-gray-600 group-hover:text-gray-800 transition">Diskon</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-600">Subtotal</span>
                  <div className="flex items-center">
                    <span className="px-2 py-1 bg-gray-100 border border-r-0 border-gray-300 rounded-l text-[10px] text-gray-400 italic">Rp</span>
                    <input 
                      type="text"
                      readOnly
                      value={item.subtotal.toLocaleString('id-ID')}
                      className="px-3 py-1 border border-gray-300 rounded-r text-right text-xs font-bold bg-white w-24"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex justify-end">
            <button 
              type="button"
              onClick={handleAddItem}
              className="p-2 bg-[#004e7c] text-white rounded-md shadow hover:bg-opacity-90 active:scale-95 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            </button>
          </div>
        </div>

        {/* Totals Section */}
        <div className="bg-[#eef2ff] overflow-hidden rounded-lg">
          <div className="divide-y divide-gray-200">
            <div className="px-6 py-3 flex justify-between items-center text-xs">
              <span className="font-bold text-gray-700">Subtotal</span>
              <span className="font-bold text-gray-800">{formatRp(calculateSubtotal())}</span>
            </div>

            <div className="px-6 py-3 flex justify-between items-center gap-4">
              <span className="text-xs font-bold text-gray-700">Voucher</span>
              <div className="flex-1 flex justify-end gap-2">
                <input 
                  type="text"
                  placeholder=""
                  value={formData.voucher_code}
                  onChange={e => setFormData(p => ({ ...p, voucher_code: e.target.value }))}
                  className="max-w-[200px] w-full px-3 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-400"
                />
                <button type="button" className="px-3 py-1 bg-[#004e7c] text-white rounded text-[10px] font-bold hover:bg-opacity-90">Apply</button>
              </div>
            </div>

            <div className="px-6 py-4 bg-[#c7d2fe]/50">
              <p className="text-[10px] font-bold text-gray-800 mb-1 uppercase">Promo Tersedia</p>
              <p className="text-[10px] text-gray-500 italic">Tidak ada promo tersedia</p>
            </div>

            <div className="px-6 py-3 flex justify-between items-center text-xs">
              <span className="font-bold text-gray-700">Promo Total</span>
              <span className="font-bold text-gray-800">{formatRp(calculateDiscount())}</span>
            </div>

            <div className="px-6 py-3 flex justify-between items-center text-xs">
              <span className="font-bold text-gray-700">Variant Total</span>
              <span className="font-bold text-gray-800">Rp 0</span>
            </div>

            <div className="px-6 py-3 flex justify-between items-center text-xs">
              <label className="flex items-center gap-2 font-bold text-gray-700">
                <input type="checkbox" className="w-3.5 h-3.5" /> Diskon
              </label>
              <span className="font-bold text-gray-800">Rp 0</span>
            </div>

            <div className="px-6 py-3 flex justify-between items-center text-xs">
              <label className="flex items-center gap-2 font-bold text-gray-700">
                <input type="checkbox" className="w-3.5 h-3.5" /> Biaya Lain
              </label>
              <span className="font-bold text-gray-800">Rp 0</span>
            </div>

            <div className="px-6 py-5 bg-[#c7d2fe] flex justify-between items-center">
              <span className="text-sm font-bold text-[#1e293b]">Grand Total</span>
              <span className="text-sm font-black text-[#1e293b]">{formatRp(calculateGrandTotal())}</span>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={saving}
          className="w-full py-3.5 bg-[#005c94] hover:bg-[#004e7c] text-white font-bold rounded-lg shadow-lg active:scale-[0.99] transition-all disabled:opacity-50"
        >
          {saving ? 'Menyimpan...' : 'Perbarui'}
        </button>
      </form>
    </Layout>
  )
}
