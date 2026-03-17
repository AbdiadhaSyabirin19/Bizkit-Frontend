import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'

export default function PaymentMethodFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [outlets, setOutlets] = useState([])
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    name: '',
    outlet_id: '',
    show_in_sale: true,
    show_in_purchase: false
  })

  useEffect(() => {
    fetchOutlets()
    if (isEdit) fetchPaymentMethod()
  }, [id])

  const fetchOutlets = async () => {
    try {
      const res = await api.get('/outlets')
      setOutlets(res.data.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const fetchPaymentMethod = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/payment-methods/${id}`)
      const item = res.data.data
      setForm({
        name: item.name || '',
        outlet_id: item.outlet_id || '',
        show_in_sale: item.show_in_sale ?? true,
        show_in_purchase: item.show_in_purchase ?? false
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nama metode pembayaran wajib diisi'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        outlet_id: form.outlet_id ? Number(form.outlet_id) : null,
        show_in_sale: form.show_in_sale,
        show_in_purchase: form.show_in_purchase
      }
      if (isEdit) {
        await api.put(`/payment-methods/${id}`, payload)
      } else {
        await api.post('/payment-methods', payload)
      }
      navigate('/payment-methods')
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <Layout title={isEdit ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}>
      <div className="flex items-center justify-center py-20 text-gray-400 font-medium">Memuat data...</div>
    </Layout>
  )

  const inputClass = (field) =>
    `w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all ${errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-emerald-300'}`

  return (
    <Layout title={isEdit ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}>
      <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
        <div className="space-y-6">
          {/* Main Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 space-y-6">
              
              {/* Name */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Nama Metode Bayar</label>
                <input 
                  type="text" 
                  value={form.name}
                  onChange={e => { 
                    setForm(f => ({ ...f, name: e.target.value })); 
                    if (errors.name) setErrors(er => ({ ...er, name: '' })) 
                  }}
                  placeholder="Enter Name" 
                  className={`w-full px-4 py-3 bg-white border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-emerald-500'}`} 
                  autoFocus
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-2 flex items-center gap-1 font-medium">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Tampil di pembelian? */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Tampil di pembelian?</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="showPurchase"
                    checked={form.show_in_purchase}
                    onChange={e => setForm(f => ({ ...f, show_in_purchase: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-[#00A389] focus:ring-[#00A389]"
                  />
                  <label htmlFor="showPurchase" className="text-sm font-medium text-gray-800 cursor-pointer">Ya</label>
                </div>
              </div>

              {/* Tampil di penjualan? */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Tampil di penjualan?</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="showSale"
                    checked={form.show_in_sale}
                    onChange={e => setForm(f => ({ ...f, show_in_sale: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-[#00A389] focus:ring-[#00A389]"
                  />
                  <label htmlFor="showSale" className="text-sm font-medium text-gray-800 cursor-pointer">Ya</label>
                </div>
              </div>

              {/* Outlet List */}
              <div className="pt-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Outlet</label>
                <div className="space-y-3">
                  {outlets.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">Tidak ada outlet tersedia</p>
                  ) : (
                    outlets.map(o => (
                      <div key={o.ID} className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id={`outlet-${o.ID}`}
                          checked={form.outlet_id == o.ID}
                          onChange={() => setForm(f => ({ ...f, outlet_id: f.outlet_id == o.ID ? '' : o.ID }))}
                          className="w-4 h-4 rounded border-gray-300 text-[#00A389] focus:ring-[#00A389]"
                        />
                        <label htmlFor={`outlet-${o.ID}`} className="text-sm font-medium text-gray-800 cursor-pointer">
                          {o.name || o.Name}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Global Action Footer */}
        <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 p-6 z-10">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-[#374151] hover:bg-[#1f2937] text-white rounded-xl font-bold text-sm shadow-lg transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </Layout>
  )
}
