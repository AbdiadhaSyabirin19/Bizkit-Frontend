import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'



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
      <div className="flex items-center justify-center py-20 text-gray-400 dark:text-zinc-500">Memuat data...</div>
    </Layout>
  )

  return (
    <Layout title={isEdit ? 'Edit Varian' : 'Tambah Varian'}>
      <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
        <div className="space-y-6">
          {/* Main Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Nama Kategori Varian</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => {
                    setForm(f => ({ ...f, name: e.target.value }))
                    if (errors.name) setErrors(er => ({ ...er, name: '' }))
                  }}
                  placeholder="Enter Name"
                  className={`w-full px-4 py-3 bg-white border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                    errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-emerald-500'
                  }`}
                  autoFocus
                />
                {errors.name && <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {errors.name}
                </p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Deskripsi Kategori Varian</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Enter Description"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Dipilih Minimal</label>
                  <input
                    type="number"
                    min="0"
                    value={form.min_select}
                    onChange={e => setForm(f => ({ ...f, min_select: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Dipilih Maksimal</label>
                  <input
                    type="number"
                    min="1"
                    value={form.max_select}
                    onChange={e => {
                      setForm(f => ({ ...f, max_select: e.target.value }))
                      if (errors.max_select) setErrors(er => ({ ...er, max_select: '' }))
                    }}
                    className={`w-full px-4 py-3 bg-white border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                      errors.max_select ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-emerald-500'
                    }`}
                  />
                  {errors.max_select && <p className="text-xs text-red-500 mt-2">{errors.max_select}</p>}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="statusAktif"
                  checked={form.status === 'active'}
                  onChange={e => setForm(f => ({ ...f, status: e.target.checked ? 'active' : 'inactive' }))}
                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="statusAktif" className="text-sm text-gray-800 font-medium">Aktif</label>
              </div>
            </div>
          </div>

          {/* Variants Section */}
          <div className="bg-[#EDF2FF] rounded-xl border border-indigo-100 overflow-hidden min-h-[200px] relative">
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-indigo-900 mb-6">Varian</h2>
              
              <div className="space-y-4">
                {form.options.map((opt, idx) => (
                  <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 relative group animate-in fade-in slide-in-from-top-2 duration-300">
                    <button 
                      onClick={() => removeOption(idx)}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition active:scale-95 opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Varian #{idx + 1}</label>
                        <input
                          type="text"
                          value={opt.name}
                          onChange={e => updateOption(idx, 'name', e.target.value)}
                          placeholder="Nama Varian"
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:bg-white focus:border-emerald-500 transition-all font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Harga Varian</label>
                        <div className="flex items-center bg-gray-50 border border-gray-100 rounded-lg overflow-hidden focus-within:bg-white focus-within:border-emerald-500 transition-all">
                          <span className="px-3 text-[10px] text-gray-400 font-bold border-r border-gray-100">Rp</span>
                          <input
                            type="number"
                            value={opt.additional_price}
                            onChange={e => updateOption(idx, 'additional_price', e.target.value)}
                            className="w-full px-4 py-2.5 bg-transparent text-sm focus:outline-none font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                      <input 
                        type="checkbox" 
                        id={`optAktif-${idx}`}
                        defaultChecked={true}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor={`optAktif-${idx}`} className="text-sm text-gray-800 font-medium tracking-tight">Aktif</label>
                    </div>
                  </div>
                ))}
              </div>

              {/* Float Add Button */}
              <div className="flex justify-end mt-6">
                <button 
                  onClick={addOption}
                  className="w-10 h-10 bg-[#0c4a6e] hover:bg-[#075985] text-white rounded-lg flex items-center justify-center shadow-lg transition active:scale-95"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v12m6-6H6" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Save Button */}
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