import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'

const MODULE_LIST = [
  { key: 'products',           label: 'Produk',                     actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'categories',         label: 'Kategori',                   actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'brands',             label: 'Merek',                      actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'units',              label: 'Satuan',                     actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'variants',           label: 'Varian',                     actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'multi_harga',        label: 'Multi Harga',                actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'promos',             label: 'Promo & Voucher',            actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'outlets',            label: 'Outlet',                     actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'sales',              label: 'Penjualan',                  actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'reports_attendance', label: 'Laporan Absensi',            actions: ['view'] },
  { key: 'reports_shift',      label: 'Laporan Pergantian Shift',   actions: ['view'] },
  { key: 'reports_daily',      label: 'Laporan Penjualan Harian',   actions: ['view'] },
  { key: 'reports_sales',      label: 'Laporan Rekap Penjualan',    actions: ['view'] },
  { key: 'reports_trend',      label: 'Trend Penjualan',            actions: ['view'] },
  { key: 'users',              label: 'User',                       actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'roles',              label: 'Hak Akses',                  actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'payment_methods',    label: 'Metode Pembayaran',          actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'settings',           label: 'Pengaturan Umum',            actions: ['view', 'edit'] },
  { key: 'kasir_pos',          label: 'POS Kasir',                  actions: ['view'] },
  { key: 'kasir_riwayat',      label: 'Riwayat Kasir',              actions: ['view'] },
  { key: 'kasir_shift',        label: 'Shift Kasir',                actions: ['view'] },
]

const emptyPermissions = () =>
  Object.fromEntries(MODULE_LIST.map(m => [m.key, []]))

export default function RoleFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', permissions: emptyPermissions() })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEdit) fetchRole()
  }, [id])

  const fetchRole = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/roles/${id}`)
      const item = res.data.data
      const perms = item.permissions || item.Permissions || {}
      setForm({ 
        name: item.name || item.Name || '', 
        description: item.description || item.Description || '',
        permissions: { ...emptyPermissions(), ...perms } 
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleAction = (moduleKey, action) => {
    setForm(f => {
      const current = f.permissions[moduleKey] || []
      const updated = current.includes(action) ? current.filter(a => a !== action) : [...current, action]
      return { ...f, permissions: { ...f.permissions, [moduleKey]: updated } }
    })
  }

  const toggleModule = (moduleKey, actions) => {
    setForm(f => {
      const current = f.permissions[moduleKey] || []
      const allChecked = actions.every(a => current.includes(a))
      return { ...f, permissions: { ...f.permissions, [moduleKey]: allChecked ? [] : [...actions] } }
    })
  }

  const toggleAll = (checked) => {
    setForm(f => ({
      ...f,
      permissions: Object.fromEntries(MODULE_LIST.map(m => [m.key, checked ? [...m.actions] : []]))
    }))
  }



  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nama role wajib diisi'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = { 
        name: form.name, 
        description: form.description,
        permissions: form.permissions 
      }
      if (isEdit) {
        await api.put(`/roles/${id}`, payload)
      } else {
        await api.post('/roles', payload)
      }
      navigate('/roles')
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <Layout title={isEdit ? 'Edit Role' : 'Tambah Role'}>
      <div className="flex items-center justify-center py-20 text-gray-400 font-medium">Memuat data...</div>
    </Layout>
  )

  return (
    <Layout title={isEdit ? 'Edit Hak Akses' : 'Tambah Hak Akses'}>
      <div className="max-w-44xl mx-auto px-4 py-8 pb-32">
        <div className="space-y-6">
          {/* Header Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Nama Role</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => { 
                    setForm(f => ({ ...f, name: e.target.value })); 
                    if (errors.name) setErrors(er => ({ ...er, name: '' })) 
                  }}
                  placeholder="Enter Name"
                  className={`w-full px-4 py-3 bg-white border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                    errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-emerald-500'
                  }`}
                  autoFocus
                />
                {errors.name && <p className="text-xs text-red-500 mt-2 flex items-center gap-1 font-medium italic"><span>⚠</span> {errors.name}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Role Deskripsi</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Enter Description"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button 
                  onClick={() => toggleAll(true)}
                  className="px-4 py-2 bg-[#00A389] hover:bg-[#008F78] text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                >
                  Select All
                </button>
                <button 
                  onClick={() => toggleAll(false)}
                  className="px-4 py-2 bg-[#00A389] hover:bg-[#008F78] text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                >
                  Unselect All
                </button>
              </div>
            </div>
          </div>

          {/* Privilege Groups */}
          <div className="space-y-8">
            {MODULE_LIST.map((mod) => {
              const checked = form.permissions[mod.key] || []
              const allChecked = mod.actions.every(a => checked.includes(a))
              
              return (
                <div key={mod.key} className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 tracking-tight">Privilege Group : {mod.label.toUpperCase()}</h3>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex flex-wrap items-center gap-6">
                      {/* Select All in Group */}
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={allChecked}
                          onChange={() => toggleModule(mod.key, mod.actions)}
                          className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 transition-all" 
                        />
                        <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">Select All</span>
                      </label>

                      {/* Individual Actions */}
                      <div className="flex flex-wrap gap-x-8 gap-y-3">
                        {mod.actions.map(action => (
                          <label key={action} className="flex items-center gap-3 cursor-pointer group">
                            <input 
                              type="checkbox" 
                              checked={checked.includes(action)}
                              onChange={() => toggleAction(mod.key, action)}
                              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 transition-all" 
                            />
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-gray-800 transition-colors">
                              {action}_{mod.key.toUpperCase()}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Global Action Footer */}
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
