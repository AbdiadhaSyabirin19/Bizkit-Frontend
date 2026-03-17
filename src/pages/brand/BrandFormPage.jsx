import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'

export default function BrandFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const fileRef = useRef()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [form, setForm] = useState({ name: '', image: '' })

  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nama merek wajib diisi'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  useEffect(() => {
    if (isEdit) fetchBrand()
  }, [id])

  const fetchBrand = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/brands/${id}`)
      const item = res.data.data
      setForm({ name: item.name || '', image: item.image || '' })
      setImagePreview(item.image || null)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
      setForm(f => ({ ...f, image: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/brands/${id}`, form)
      } else {
        await api.post('/brands', form)
      }
      navigate('/brands')
    } catch (err) {
      console.error('Error:', err.response?.data || err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <Layout title={isEdit ? 'Edit Merek' : 'Tambah Merek'}>
      <div className="flex items-center justify-center py-20 text-gray-400">Memuat data...</div>
    </Layout>
  )

  return (
    <Layout title={isEdit ? 'Edit Merek' : 'Tambah Merek'}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6 space-y-6">
            {/* Nama Produk Branding */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Produk Brand Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => {
                  setForm(f => ({ ...f, name: e.target.value }))
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

            {/* Upload Logo Branding */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Upload Brand Logo</label>
              <div className="flex items-center gap-4">
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                <button 
                  onClick={() => fileRef.current.click()}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition"
                >
                  Choose File
                </button>
                <span className="text-xs text-gray-500 truncate max-w-[200px]">
                  {imagePreview ? 'Logo selected' : 'No file chosen'}
                </span>
                {imagePreview && (
                  <div className="relative group">
                    <img src={imagePreview} alt="preview" className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                    <button 
                      onClick={() => { setImagePreview(null); setForm(f => ({ ...f, image: '' })); fileRef.current.value = '' }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
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