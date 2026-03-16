import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/axios'

const formatRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')

export default function SalesFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [products, setProducts] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  
  const [formData, setFormData] = useState({
    customer_name: 'Umum',
    payment_method_id: '',
    items: [{ product_id: '', quantity: 1, price: 0, subtotal: 0 }]
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [pRes, pmRes] = await Promise.all([
        api.get('/products'),
        api.get('/payment-methods')
      ])
      setProducts(pRes.data?.data || [])
      setPaymentMethods(pmRes.data?.data || [])
      
      if (isEdit) {
        const sRes = await api.get(`/sales/${id}`)
        const s = sRes.data?.data
        setFormData({
          customer_name: s.customer_name || s.CustomerName,
          payment_method_id: s.payment_method_id || s.PaymentMethodID,
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
      items: [...prev.items, { product_id: '', quantity: 1, price: 0, subtotal: 0 }]
    }))
  }

  const handleRemoveItem = (idx) => {
    if (formData.items.length === 1) return
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }))
  }

  const handleItemChange = (idx, field, value) => {
    const newItems = [...formData.items]
    const item = { ...newItems[idx], [field]: value }
    
    if (field === 'product_id') {
      const prod = products.find(p => String(p.ID || p.id) === String(value))
      item.price = prod?.price || 0
    }
    
    item.subtotal = item.price * item.quantity
    newItems[idx] = item
    setFormData(prev => ({ ...prev, items: newItems }))
  }

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.subtotal, 0)
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
        ...formData,
        payment_method_id: Number(formData.payment_method_id),
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
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-800">{isEdit ? 'Edit Penjualan' : 'Input Penjualan'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Pelanggan</label>
            <input 
              type="text" 
              value={formData.customer_name}
              onChange={e => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
              placeholder="Nama pelanggan..."
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Metode Pembayaran</label>
            <select 
              value={formData.payment_method_id}
              onChange={e => setFormData(prev => ({ ...prev, payment_method_id: e.target.value }))}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            >
              <option value="">Pilih Metode...</option>
              {paymentMethods.map(m => (
                <option key={m.ID || m.id} value={m.ID || m.id}>{m.Name || m.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
            <h2 className="font-bold text-gray-700">Detail Produk</h2>
            <button 
              type="button" 
              onClick={handleAddItem}
              className="text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg text-sm font-bold transition flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Tambah Produk
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Produk</th>
                  <th className="px-6 py-4 w-28">Qty</th>
                  <th className="px-6 py-4">Harga</th>
                  <th className="px-6 py-4">Subtotal</th>
                  <th className="px-6 py-4 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {formData.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4">
                      <select 
                        value={item.product_id}
                        onChange={e => handleItemChange(idx, 'product_id', e.target.value)}
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      >
                        <option value="">Pilih Produk...</option>
                        {products.map(p => (
                          <option key={p.ID || p.id} value={p.ID || p.id}>{p.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        type="number" 
                        min="1"
                        value={item.quantity}
                        onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition font-medium"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 font-medium">{formatRp(item.price)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-800 font-bold">{formatRp(item.subtotal)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                         type="button" 
                         onClick={() => handleRemoveItem(idx)}
                         className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-gray-50/50 flex justify-end">
            <div className="text-right">
              <p className="text-sm text-gray-500 font-medium">Grand Total</p>
              <p className="text-2xl font-black text-emerald-600">{formatRp(calculateTotal())}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button 
            type="button" 
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
          >
            Batal
          </button>
          <button 
            type="submit" 
            disabled={saving}
            className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
          >
            {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : null}
            {isEdit ? 'Update Penjualan' : 'Simpan Penjualan'}
          </button>
        </div>
      </form>
    </div>
  )
}
