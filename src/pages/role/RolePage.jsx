import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import Table from '../../components/Table'
import ConfirmDialog from '../../components/ConfirmDialog'
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
  { key: 'sales',              label: 'Penjualan',                  actions: ['view', 'create'] },
  { key: 'reports_attendance', label: 'Laporan Absensi',            actions: ['view'] },
  { key: 'reports_shift',      label: 'Laporan Pergantian Shift',   actions: ['view'] },
  { key: 'reports_daily',      label: 'Laporan Penjualan Harian',   actions: ['view'] },
  { key: 'reports_sales',      label: 'Laporan Rekap Penjualan',    actions: ['view'] },
  { key: 'reports_trend',      label: 'Trend Penjualan',            actions: ['view'] },
  { key: 'users',              label: 'User',                       actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'roles',              label: 'Hak Akses',                  actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'payment_methods',    label: 'Metode Pembayaran',          actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'settings',           label: 'Pengaturan Umum',            actions: ['view', 'edit'] },
]

const ACTION_LABELS = {
  view:   { label: 'Lihat',  color: 'text-blue-500' },
  create: { label: 'Tambah', color: 'text-emerald-500' },
  edit:   { label: 'Edit',   color: 'text-yellow-500' },
  delete: { label: 'Hapus',  color: 'text-red-500' },
}

const emptyPermissions = () =>
  Object.fromEntries(MODULE_LIST.map(m => [m.key, []]))

export default function RolePage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const [saving, setSaving] = useState(false)
  const [panel, setPanel] = useState({ open: false, mode: 'add', item: null })
  const [form, setForm] = useState({ name: '', permissions: emptyPermissions() })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/roles')
      setData(res.data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const filtered = data.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.Name?.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => {
    setForm({ name: '', permissions: emptyPermissions() })
    setPanel({ open: true, mode: 'add', item: null })
  }

  const openEdit = (row) => {
    const perms = row.permissions || row.Permissions || {}
    setForm({ name: row.name || row.Name || '', permissions: { ...emptyPermissions(), ...perms } })
    setPanel({ open: true, mode: 'edit', item: row })
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

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const payload = { name: form.name, permissions: form.permissions }
      if (panel.mode === 'add') await api.post('/roles', payload)
      else await api.put(`/roles/${panel.item.ID}`, payload)
      fetchData()
      setPanel({ open: false })
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/roles/${confirm.id}`)
      fetchData()
    } catch (err) { console.error(err) }
    finally { setConfirm({ open: false, id: null }) }
  }

  const columns = [
    { key: 'no', label: 'No', render: (row) => filtered.indexOf(row) + 1 },
    {
      key: 'name', label: 'Role',
      render: (row) => <span className="font-medium text-gray-800 dark:text-gray-100">{row.name || row.Name}</span>
    },
    {
      key: 'permissions', label: 'Akses Modul',
      render: (row) => {
        const perms = row.permissions || row.Permissions || {}
        const count = Object.values(perms).filter(v => v?.length > 0).length
        return (
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
            {count} modul
          </span>
        )
      }
    },
    {
      key: 'aksi', label: 'Aksi',
      render: (row) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(row)}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs transition">Edit</button>
          <button onClick={() => setConfirm({ open: true, id: row.ID })}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs transition">Hapus</button>
        </div>
      )
    },
  ]

  return (
    <Layout title="Hak Akses">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Hak Akses</h1>
            <p className="text-gray-500 dark:text-zinc-400 text-sm">Kelola role & permission pengguna</p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Role
          </button>
        </div>

        <div className="mb-4">
          <input type="text" placeholder="Cari role..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-xs px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors" />
        </div>

        <Table columns={columns} data={filtered} loading={loading} />
      </div>

      <>
        {panel.open && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-40"
            onClick={() => setPanel({ open: false })} />
        )}

        <div className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${panel.open ? 'translate-x-0' : 'translate-x-full'}`}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-800">
                {panel.mode === 'add' ? 'Tambah Role' : 'Edit Role'}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Atur nama dan hak akses per modul</p>
            </div>
            <button onClick={() => setPanel({ open: false })}
              className="p-2 hover:bg-gray-100 rounded-xl transition">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* Nama Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Role <span className="text-red-400">*</span>
              </label>
              <input type="text" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Contoh: Admin, Kasir, Owner"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>

            {/* Permission Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">Hak Akses per Modul</label>
                <button onClick={() => toggleAll(!isAllChecked)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                  {isAllChecked ? 'Hapus Semua' : 'Pilih Semua'}
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Header — 7 kolom */}
                <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200 px-4 py-2">
                  <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase">Modul</div>
                  <div className="text-xs font-semibold text-gray-500 uppercase text-center">Semua</div>
                  <div className="text-xs font-semibold text-blue-500 uppercase text-center">Lihat</div>
                  <div className="text-xs font-semibold text-emerald-500 uppercase text-center">Tambah</div>
                  <div className="text-xs font-semibold text-yellow-500 uppercase text-center">Edit</div>
                  <div className="text-xs font-semibold text-red-500 uppercase text-center">Hapus</div>
                </div>

                {/* Rows — 7 kolom */}
                {MODULE_LIST.map((mod, idx) => {
                  const checked = form.permissions[mod.key] || []
                  const allChecked = mod.actions.every(a => checked.includes(a))
                  return (
                    <div key={mod.key}
                      className={`grid grid-cols-7 items-center px-4 py-2.5 border-b border-gray-100 last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <div className="col-span-2 text-xs text-gray-700 font-medium leading-tight">{mod.label}</div>

                      {/* Toggle All */}
                      <div className="flex justify-center">
                        <input type="checkbox" checked={allChecked}
                          onChange={() => toggleModule(mod.key, mod.actions)}
                          className="w-4 h-4 accent-emerald-500 cursor-pointer" />
                      </div>

                      {/* Per aksi: view, create, edit, delete */}
                      {['view', 'create', 'edit', 'delete'].map(action => (
                        <div key={action} className="flex justify-center">
                          {mod.actions.includes(action) ? (
                            <input type="checkbox"
                              checked={checked.includes(action)}
                              onChange={() => toggleAction(mod.key, action)}
                              className="w-4 h-4 accent-emerald-500 cursor-pointer" />
                          ) : (
                            <span className="text-gray-200 text-xs">—</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-2 px-1">
                {Object.entries(ACTION_LABELS).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-1">
                    <span className={`text-xs font-medium ${val.color}`}>●</span>
                    <span className="text-xs text-gray-400">{val.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-6 py-4 flex gap-3">
            <button onClick={() => setPanel({ open: false })}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium transition">
              Batal
            </button>
            <button onClick={handleSave} disabled={saving || !form.name.trim()}
              className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-sm font-medium transition flex items-center justify-center gap-2">
              {saving
                ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Menyimpan...</>
                : panel.mode === 'add' ? 'Simpan Role' : 'Simpan Perubahan'
              }
            </button>
          </div>
        </div>
      </>

      <ConfirmDialog isOpen={confirm.open} onClose={() => setConfirm({ open: false })} onConfirm={handleDelete} />
    </Layout>
  )
}