import { useState, useEffect, useRef } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'

export default function SettingPage() {
  const [form, setForm] = useState({ logo: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(null)
  const fileRef = useRef()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const res = await api.get('/settings')
      const d = res.data.data
      setForm({
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

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/settings', form)
      // Reload page or sidebar to see changes
      window.location.reload()
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  return (
    <Layout title="BizKit">
      <div className="max-w-7xl mx-auto px-4 py-12">

        <div className="bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100 p-12">
          <div className="flex items-center gap-12 mb-10">
            <label className="text-sm font-semibold text-gray-700 w-32">Logo</label>
            <div className="flex-1 flex items-center gap-4">
               <input
                type="file"
                ref={fileRef}
                onChange={handleLogoChange}
                className="hidden"
                accept="image/*"
              />
              <button 
                onClick={() => fileRef.current?.click()}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium transition-all shadow-sm"
              >
                Choose File
              </button>
              <span className="text-sm text-gray-400 font-medium italic">
                {preview ? 'Logo chosen' : 'No file chosen'}
              </span>
              
              {preview && (
                <div className="w-16 h-16 rounded-xl border border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center p-2">
                  <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="w-full py-4 bg-[#21B5D0] hover:bg-[#1CA0B8] disabled:bg-cyan-200 text-white rounded-2xl font-bold text-lg shadow-lg shadow-cyan-100 transition-all active:scale-[0.98]"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </Layout>
  )
}