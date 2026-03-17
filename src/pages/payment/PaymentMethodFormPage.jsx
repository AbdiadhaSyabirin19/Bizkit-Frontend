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
      <div className="max-w-3xl mx-auto px-4">
        {/* Header Section */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/payment-methods')} className="p-2 hover:bg-white rounded-xl shadow-sm border border-gray-100 transition group">
            <svg className="w-5 h-5 text-gray-500 group-hover:text-emerald-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{isEdit ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}</h1>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 space-y-8">
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Metode Pembayaran</label>
              <input 
                type="text" 
                value={form.name}
                onChange={e => { setForm(f => ({ ...f, name: e.target.value })); if (errors.name) setErrors(er => ({ ...er, name: '' })) }}
                placeholder="Contoh: Tunai, QRIS, GoPay" 
                className={inputClass('name')} 
              />
              {errors.name && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium italic"><span>⚠</span> {errors.name}</p>}
            </div>

            {/* Outlet Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Outlet <span className="text-xs font-normal text-gray-400">(Biarkan kosong untuk semua outlet)</span></label>
              <div className="relative">
                <select 
                  value={form.outlet_id} 
                  onChange={e => setForm(f => ({ ...f, outlet_id: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 appearance-none bg-white hover:border-emerald-300 transition-all font-medium text-gray-700"
                >
                  <option value="">Semua Outlet</option>
                  {outlets.map(o => <option key={o.ID} value={o.ID}>{o.name || o.Name}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Visibility Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-5 bg-gray-50/50 rounded-2xl border border-gray-100 group transition hover:border-emerald-200 hover:bg-emerald-50/20">
                <div>
                  <p className="text-sm font-bold text-gray-800">Tampil di Penjualan</p>
                  <p className="text-[10px] text-gray-400 font-medium">Aktifkan saat transaksi penjualan</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setForm(f => ({ ...f, show_in_sale: !f.show_in_sale }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none ${form.show_in_sale ? 'bg-[#00A389]' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${form.show_in_sale ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-5 bg-gray-50/50 rounded-2xl border border-gray-100 group transition hover:border-emerald-200 hover:bg-emerald-50/20">
                <div>
                  <p className="text-sm font-bold text-gray-800">Tampil di Pembelian</p>
                  <p className="text-[10px] text-gray-400 font-medium">Aktifkan saat transaksi pembelian</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setForm(f => ({ ...f, show_in_purchase: !f.show_in_purchase }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none ${form.show_in_purchase ? 'bg-[#00A389]' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${form.show_in_purchase ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 bg-[#00A389] hover:bg-[#008F78] disabled:bg-emerald-300 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-[0.98]"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
