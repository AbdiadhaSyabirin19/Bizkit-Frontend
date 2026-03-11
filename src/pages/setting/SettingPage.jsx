import { useState, useEffect, useRef } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'

export default function SettingPage() {
  const [form, setForm] = useState({ store_name: '', logo: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [preview, setPreview] = useState(null)
  const fileRef = useRef()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const res = await api.get('/settings')
      const d = res.data.data
      setForm({
        store_name: d.StoreName || d.store_name || '',
        logo: d.Logo || d.logo || '',
      })
      if (d.Logo || d.logo) setPreview(d.Logo || d.logo)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result)
      setForm(f => ({ ...f, logo: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setPreview(null)
    setForm(f => ({ ...f, logo: '' }))
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)
    try {
      await api.put('/settings', form)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  return (
    <Layout title="Pengaturan Umum">
      <div className="max-w-2xl mx-auto">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-800">Pengaturan Umum</h1>
          <p className="text-gray-500 text-sm">Konfigurasi sistem</p>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-green-700 text-sm font-medium">Pengaturan berhasil disimpan!</p>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">

            {/* Nama Toko */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Toko <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.store_name}
                onChange={e => setForm(f => ({ ...f, store_name: e.target.value }))}
                placeholder="Masukkan nama toko"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo Toko</label>
              <p className="text-xs text-gray-400 mb-3">Format: JPG, PNG, SVG. Maksimal 2MB.</p>

              {preview ? (
                /* Preview logo */
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-2xl border-2 border-gray-200 overflow-hidden flex items-center justify-center bg-gray-50">
                    <img
                      src={preview}
                      alt="Logo"
                      className="w-full h-full object-contain p-2"
                      onError={() => setPreview(null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm text-gray-600 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Ganti Logo
                    </button>
                    <button
                      onClick={handleRemoveLogo}
                      className="flex items-center gap-2 px-4 py-2 border border-red-200 hover:bg-red-50 rounded-xl text-sm text-red-500 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Hapus Logo
                    </button>
                  </div>
                </div>
              ) : (
                /* Upload area */
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 hover:border-emerald-400 rounded-2xl p-8 text-center cursor-pointer transition group"
                >
                  <div className="w-12 h-12 bg-gray-100 group-hover:bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3 transition">
                    <svg className="w-6 h-6 text-gray-400 group-hover:text-emerald-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 group-hover:text-emerald-600 font-medium transition">Klik untuk upload logo</p>
                  <p className="text-xs text-gray-400 mt-1">atau drag & drop file ke sini</p>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
            </div>

            {/* Tombol Simpan */}
            <button
              onClick={handleSave}
              disabled={saving || !form.store_name.trim()}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Simpan Pengaturan
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}