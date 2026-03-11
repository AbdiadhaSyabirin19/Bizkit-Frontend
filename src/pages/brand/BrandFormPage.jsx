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
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/brands')} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{isEdit ? 'Edit Merek' : 'Tambah Merek'}</h1>
            <p className="text-gray-500 text-sm">{isEdit ? 'Perbarui data merek' : 'Tambah merek baru'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">

            {/* Upload Gambar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo / Gambar Merek</label>
              <div className="flex items-center gap-4">
                <div
                  onClick={() => fileRef.current.click()}
                  className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 overflow-hidden flex-shrink-0 transition"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-2">
                      <p className="text-3xl mb-1">🏷️</p>
                      <p className="text-xs text-gray-400">Upload</p>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 font-medium mb-1">Klik untuk upload logo merek</p>
                  <p className="text-xs text-gray-400 mb-2">Format: JPG, PNG. Maks 2MB</p>
                  <div className="flex gap-2">
                    <button onClick={() => fileRef.current.click()} className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-xs font-medium transition">Pilih File</button>
                    {imagePreview && (
                      <button onClick={() => { setImagePreview(null); setForm(f => ({ ...f, image: '' })); fileRef.current.value = '' }} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-xs font-medium transition">Hapus</button>
                    )}
                  </div>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </div>

            {/* Nama */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Merek <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={e => {
                  setForm(f => ({ ...f, name: e.target.value }))
                  if (errors.name) setErrors({})
                }}
                placeholder="Masukkan nama merek"
                className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                autoFocus
              />
              {errors.name && <p className="text-xs text-red-400 mt-1">⚠ {errors.name}</p>}
            </div>
          </div>

          {/* Tombol */}
          <div className="flex gap-3 pb-6">
            <button onClick={() => navigate('/brands')} className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium transition">Batal</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-sm font-medium transition">
              {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Merek'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}