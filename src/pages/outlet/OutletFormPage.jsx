import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'

export default function OutletFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    status: 'active',
  })

  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nama outlet wajib diisi'
    if (form.phone && !/^[0-9+\-\s]+$/.test(form.phone)) e.phone = 'Format nomor telepon tidak valid'
    if (!form.address.trim()) e.address = 'Alamat outlet wajib diisi'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  useEffect(() => {
    if (isEdit) fetchOutlet()
  }, [id])

  const fetchOutlet = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/outlets/${id}`)
      const item = res.data.data
      setForm({
        name: item.name || '',
        address: item.address || '',
        phone: item.phone || '',
        status: item.status || 'active',
      })
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/outlets/${id}`, form)
      } else {
        await api.post('/outlets', form)
      }
      navigate('/outlets')
    } catch (err) {
      console.error('Error:', err.response?.data || err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <Layout title={isEdit ? 'Edit Outlet' : 'Tambah Outlet'}>
      <div className="flex items-center justify-center py-20 text-gray-400">Memuat data...</div>
    </Layout>
  )

  return (
    <Layout title={isEdit ? 'Edit Outlet' : 'Tambah Outlet'}>
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/outlets')} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{isEdit ? 'Edit Outlet' : 'Tambah Outlet'}</h1>
            <p className="text-gray-500 text-sm">{isEdit ? 'Perbarui data outlet' : 'Tambah outlet baru'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Outlet <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={e => {
                  setForm(f => ({ ...f, name: e.target.value }))
                  if (errors.name) setErrors(er => ({ ...er, name: '' }))
                }}
                placeholder="Contoh: Outlet Pusat, Cabang Selatan"
                className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                autoFocus
              />
              {errors.name && <p className="text-xs text-red-400 mt-1">⚠ {errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
              <textarea
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Alamat lengkap outlet"
                rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                />
                {errors.address && <p className="text-xs text-red-400 mt-1">⚠ {errors.address}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => {
                    setForm(f => ({ ...f, phone: e.target.value }))
                    if (errors.phone) setErrors(er => ({ ...er, phone: '' }))
                  }}
                  placeholder="08xxxxxxxxxx"
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 ${errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                />
                {errors.phone && <p className="text-xs text-red-400 mt-1">⚠ {errors.phone}</p>}
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

          {/* Tombol */}
          <div className="flex gap-3 pb-6">
            <button onClick={() => navigate('/outlets')} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium transition">Batal</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-sm font-medium transition">
              {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Outlet'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}