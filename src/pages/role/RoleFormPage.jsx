import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'

const MODULE_LIST = [
  { key: 'dashboard',          label: 'Dashboard',                  actions: ['view'] },
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
  { key: 'kasir_dashboard',    label: 'Dashboard Kasir',            actions: ['view'] },
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
  const [form, setForm] = useState({ name: '', permissions: emptyPermissions() })
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
      setForm({ name: item.name || item.Name || '', permissions: { ...emptyPermissions(), ...perms } })
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

  const isAllChecked = MODULE_LIST.every(m =>
    m.actions.every(a => (form.permissions[m.key] || []).includes(a))
  )

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
      const payload = { name: form.name, permissions: form.permissions }
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
    <Layout title={isEdit ? 'Edit Role' : 'Tambah Role'}>
      <div className="max-w-5xl mx-auto px-4">
        {/* Header Section */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/roles')} className="p-2 hover:bg-white rounded-xl shadow-sm border border-gray-100 transition group">
            <svg className="w-5 h-5 text-gray-500 group-hover:text-emerald-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 space-y-8">
          {/* Role Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Role</label>
            <input 
              type="text" 
              value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); if (errors.name) setErrors(er => ({ ...er, name: '' })) }}
              placeholder="Contoh: Admin, Kasir, Owner" 
              className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-emerald-300'}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium italic"><span>⚠</span> {errors.name}</p>}
          </div>

          {/* Permissions Table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <button 
                type="button"
                onClick={() => toggleAll(!isAllChecked)}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition px-3 py-1.5 bg-emerald-50 rounded-lg"
              >
                {isAllChecked ? 'Hapus Semua' : 'Pilih Semua'}
              </button>
            </div>

            <div className="border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
              <div className="grid grid-cols-7 bg-gray-50/50 px-6 py-4 border-b border-gray-100">
                <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Modul</div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Semua</div>
                <div className="text-xs font-bold text-blue-500 uppercase tracking-wider text-center">Lihat</div>
                <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider text-center">Tambah</div>
                <div className="text-xs font-bold text-yellow-500 uppercase tracking-wider text-center">Edit</div>
                <div className="text-xs font-bold text-red-500 uppercase tracking-wider text-center">Hapus</div>
              </div>

              <div className="divide-y divide-gray-50">
                {MODULE_LIST.map((mod) => {
                  const checked = form.permissions[mod.key] || []
                  const allChecked = mod.actions.every(a => checked.includes(a))
                  return (
                    <div key={mod.key} className="grid grid-cols-7 items-center px-6 py-4 hover:bg-gray-50/50 transition">
                      <div className="col-span-2 text-sm font-semibold text-gray-700">{mod.label}</div>
                      
                      <div className="flex justify-center">
                        <label className="relative flex items-center justify-center cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={allChecked}
                            onChange={() => toggleModule(mod.key, mod.actions)}
                            className="peer appearance-none w-5 h-5 rounded-md border-2 border-gray-300 checked:bg-emerald-500 checked:border-emerald-500 transition-all" 
                          />
                          <svg className="absolute w-3.5 h-3.5 text-white scale-0 peer-checked:scale-100 transition-transform pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                          </svg>
                        </label>
                      </div>

                      {['view', 'create', 'edit', 'delete'].map(action => (
                        <div key={action} className="flex justify-center">
                          {mod.actions.includes(action) ? (
                            <label className="relative flex items-center justify-center cursor-pointer group">
                              <input 
                                type="checkbox" 
                                checked={checked.includes(action)}
                                onChange={() => toggleAction(mod.key, action)}
                                className="peer appearance-none w-4.5 h-4.5 rounded border-2 border-gray-300 checked:bg-emerald-500 checked:border-emerald-500 transition-all" 
                              />
                              <svg className="absolute w-3 h-3 text-white scale-0 peer-checked:scale-100 transition-transform pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                              </svg>
                            </label>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 bg-[#00A389] hover:bg-[#008F78] disabled:bg-emerald-300 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-[0.98]"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
