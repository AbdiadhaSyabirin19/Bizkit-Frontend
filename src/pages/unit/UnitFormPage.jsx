import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'

export default function UnitFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '' })

  useEffect(() => {
    if (isEdit) fetchUnit()
  }, [id])

  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nama satuan wajib diisi'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const fetchUnit = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/units/${id}`)
      setForm({ name: res.data.data?.name || '' })
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/units/${id}`, form)
      } else {
        await api.post('/units', form)
      }
      navigate('/units')
    } catch (err) {
      console.error('Error:', err.response?.data || err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <Layout title={isEdit ? 'Edit Satuan' : 'Tambah Satuan'}>
      <div className="flex items-center justify-center py-20 text-gray-400">Memuat data...</div>
    </Layout>
  )

  return (
    <Layout title={isEdit ? 'Edit Satuan' : 'Tambah Satuan'}>
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/units')} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{isEdit ? 'Edit Satuan' : 'Tambah Satuan'}</h1>
            <p className="text-gray-500 text-sm">{isEdit ? 'Perbarui data satuan' : 'Tambah satuan baru'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Satuan <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => {
                setForm({ name: e.target.value })
                if (errors.name) setErrors({})
              }}
              placeholder="Contoh: Pcs, Kg, Liter, Lusin"
              className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            {errors.name && <p className="text-xs text-red-400 mt-1">⚠ {errors.name}</p>}
          </div>

          <div className="flex gap-3 pb-6">
            <button onClick={() => navigate('/units')} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium transition">Batal</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-sm font-medium transition">
              {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Satuan'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}