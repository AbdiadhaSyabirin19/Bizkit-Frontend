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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Unit Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => {
                  setForm({ name: e.target.value })
                  if (errors.name) setErrors({})
                }}
                placeholder="Enter Name"
                className={`w-full px-4 py-3 bg-white border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                  errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-emerald-500'
                }`}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                autoFocus
              />
              {errors.name && <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                {errors.name}
              </p>}
            </div>
          </div>
        </div>

        <div className="bg-[#f8fafc] p-4 rounded-xl border border-gray-100">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full py-3.5 bg-[#374151] hover:bg-[#1f2937] text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </Layout>
  )
}