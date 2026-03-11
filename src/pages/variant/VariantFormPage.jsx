import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'

const getID = (row) => row.ID || row.id

export default function VariantFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    min_select: 1,
    max_select: 1,
    status: 'active',
    options: [{ name: '', additional_price: 0 }]
  })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nama varian wajib diisi'
    if (Number(form.max_select) < Number(form.min_select)) e.max_select = 'Maks pilihan tidak boleh kurang dari min pilihan'
    if (form.options.filter(o => o.name.trim()).length === 0) e.options = 'Minimal 1 opsi wajib diisi'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  useEffect(() => {
    if (isEdit) fetchVariant()
  }, [id])

  const fetchVariant = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/variants/${id}`)
      const item = res.data.data
      setForm({
        name: item.name || '',
        description: item.description || '',
        min_select: item.min_select ?? 1,
        max_select: item.max_select ?? 1,
        status: item.status || 'active',
        options: item.options?.length > 0
          ? item.options.map(o => ({ name: o.name, additional_price: o.additional_price ?? 0 }))
          : [{ name: '', additional_price: 0 }]
      })
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const addOption = () => setForm(f => ({ ...f, options: [...f.options, { name: '', additional_price: 0 }] }))
  const removeOption = (idx) => setForm(f => ({ ...f, options: f.options.filter((_, i) => i !== idx) }))
  const updateOption = (idx, key, val) => setForm(f => ({
    ...f,
    options: f.options.map((o, i) => i === idx ? { ...o, [key]: val } : o)
  }))

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        description: form.description,
        min_select: Number(form.min_select),
        max_select: Number(form.max_select),
        status: form.status,
        options: form.options
          .filter(o => o.name.trim())
          .map(o => ({ name: o.name.trim(), additional_price: Number(o.additional_price) || 0 }))
      }
      if (isEdit) {
        await api.put(`/variants/${id}`, payload)
      } else {
        await api.post('/variants', payload)
      }
      navigate('/variants')
    } catch (err) {
      console.error('Error:', err.response?.data || err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <Layout title={isEdit ? 'Edit Varian' : 'Tambah Varian'}>
      <div className="flex items-center justify-center py-20 text-gray-400">Memuat data...</div>
    </Layout>
  )

  return (
    <Layout title={isEdit ? 'Edit Varian' : 'Tambah Varian'}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/variants')} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{isEdit ? 'Edit Varian' : 'Tambah Varian'}</h1>
            <p className="text-gray-500 text-sm">{isEdit ? 'Perbarui data varian' : 'Tambah varian baru'}</p>
          </div>
        </div>

        <div className="space-y-4">

          {/* Info Dasar */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
            <h3 className="font-semibold text-gray-800">Informasi Varian</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Varian <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={e => {
                  setForm(f => ({ ...f, name: e.target.value }))
                  if (errors.name) setErrors(er => ({ ...er, name: '' }))
                }}
                placeholder="Contoh: Level Pedas, Topping, Ukuran"
                className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                autoFocus
              />
              {errors.name && <p className="text-xs text-red-400 mt-1">⚠ {errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Deskripsi varian (opsional)"
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Pilihan</label>
                <input
                  type="number"
                  min="0"
                  value={form.min_select}
                  onChange={e => setForm(f => ({ ...f, min_select: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maks Pilihan</label>
                <input
                  type="number"
                  min="1"
                  value={form.max_select}
                  onChange={e => {
                    setForm(f => ({ ...f, max_select: e.target.value }))
                    if (errors.max_select) setErrors(er => ({ ...er, max_select: '' }))
                  }}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 ${errors.max_select ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                />
                {errors.max_select && <p className="text-xs text-red-400 mt-1">⚠ {errors.max_select}</p>}
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

          {/* Opsi Varian */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">Opsi Varian</h3>
                <p className="text-xs text-gray-400">Isi harga tambahan jika ada biaya ekstra</p>
              </div>
              <button
                onClick={addOption}
                className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-xs font-medium bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Opsi
              </button>
            </div>
            {errors.options && <p className="text-xs text-red-400 mb-2">⚠ {errors.options}</p>}

            {/* Header kolom */}
            <div className="grid grid-cols-12 gap-2 mb-1 px-1">
              <div className="col-span-6"><span className="text-xs text-gray-400 font-medium">Nama Opsi</span></div>
              <div className="col-span-5"><span className="text-xs text-gray-400 font-medium">Harga Tambahan</span></div>
            </div>

            <div className="space-y-2">
              {form.options.map((opt, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-xl p-2">
                  <div className="col-span-6">
                    <input
                      type="text"
                      value={opt.name}
                      onChange={e => updateOption(idx, 'name', e.target.value)}
                      placeholder="Contoh: Level 1, Keju, Panas"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                    />
                  </div>
                  <div className="col-span-5 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Rp</span>
                    <input
                      type="number"
                      value={opt.additional_price}
                      onChange={e => updateOption(idx, 'additional_price', e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {form.options.length > 1 ? (
                      <button
                        onClick={() => removeOption(idx)}
                        className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    ) : <div className="w-7 h-7" />}
                  </div>
                </div>
              ))}
            </div>

            {/* Preview */}
            {form.options.some(o => o.name.trim()) && (
              <div className="mt-3 p-3 bg-emerald-50 rounded-xl">
                <p className="text-xs font-medium text-emerald-700 mb-2">Preview Opsi:</p>
                <div className="flex flex-wrap gap-2">
                  {form.options.filter(o => o.name.trim()).map((o, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-white border border-emerald-200 rounded-lg px-2.5 py-1">
                      <span className="text-sm text-gray-700">{o.name}</span>
                      {Number(o.additional_price) > 0 ? (
                        <span className="text-xs text-orange-500 font-medium">+Rp {Number(o.additional_price).toLocaleString('id-ID')}</span>
                      ) : (
                        <span className="text-xs text-gray-400">Gratis</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tombol */}
          <div className="flex gap-3 pb-6">
            <button onClick={() => navigate('/variants')} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium transition">Batal</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-sm font-medium transition">
              {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Varian'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}