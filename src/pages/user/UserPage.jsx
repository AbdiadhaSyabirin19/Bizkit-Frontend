import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import api from '../../api/axios'
import { usePermission } from '../../hooks/usePermission'

export default function UserPage() {
  const [data, setData] = useState([])
  const [roles, setRoles] = useState([])
  const [outlets, setOutlets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState({ open: false, mode: 'add', item: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    name: '', username: '', email: '', password: '',
    role_id: '', outlet_id: '', can_access_center: false
  })
  const { can } = usePermission()

  useEffect(() => { fetchData(); fetchRoles(); fetchOutlets() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/users')
      setData(res.data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const fetchRoles = async () => {
    try {
      const res = await api.get('/roles')
      setRoles(res.data.data || [])
    } catch (err) { console.error(err) }
  }

  const fetchOutlets = async () => {
    try {
      const res = await api.get('/outlets')
      setOutlets(res.data.data || [])
    } catch (err) { console.error(err) }
  }

  const filtered = data.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.username?.toLowerCase().includes(search.toLowerCase()) ||
    d.email?.toLowerCase().includes(search.toLowerCase())
  )

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nama wajib diisi'
    if (!form.username.trim()) e.username = 'Username wajib diisi'
    if (modal.mode === 'add' && !form.password.trim()) e.password = 'Password wajib diisi'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Format email tidak valid'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const openAdd = () => {
    setErrors({})
    setForm({ name: '', username: '', email: '', password: '', role_id: '', outlet_id: '', can_access_center: false })
    setModal({ open: true, mode: 'add', item: null })
  }

  const openEdit = (item) => {
    setErrors({})
    setForm({
      name: item.name || '',
      username: item.username || '',
      email: item.email || '',
      password: '',
      role_id: item.role_id || '',
      outlet_id: item.outlet_id || '',
      can_access_center: item.can_access_center || false,
    })
    setModal({ open: true, mode: 'edit', item })
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        username: form.username,
        email: form.email,
        role_id: form.role_id ? Number(form.role_id) : null,
        outlet_id: form.outlet_id ? Number(form.outlet_id) : null,
        can_access_center: form.can_access_center,
        ...(form.password && { password: form.password })
      }
      if (modal.mode === 'add') await api.post('/users', { ...payload, password: form.password })
      else await api.put(`/users/${modal.item.ID}`, payload)
      fetchData()
      setModal({ open: false })
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/users/${confirm.id}`)
      fetchData()
    } catch (err) { console.error(err) }
    finally { setConfirm({ open: false, id: null }) }
  }

  const inputClass = (field) =>
    `w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 ${errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`

  const columns = [
    { key: 'no', label: 'No', render: (row) => filtered.indexOf(row) + 1 },
    {
      key: 'name', label: 'Nama',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-100">{row.name}</p>
          {row.email && <p className="text-xs text-gray-400 dark:text-zinc-500">{row.email}</p>}
        </div>
      )
    },
    { key: 'username', label: 'Username', render: (row) => (
      <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">{row.username}</span>
    )},
    { key: 'role', label: 'Role', render: (row) => (
      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
        {row.role?.name || row.role?.Name || '-'}
      </span>
    )},
    { key: 'outlet', label: 'Outlet', render: (row) => (
      row.outlet?.Name || row.outlet?.name
        ? <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">{row.outlet?.Name || row.outlet?.name}</span>
        : <span className="text-gray-300 text-xs">-</span>
    )},
    { key: 'can_access_center', label: 'Akses Pusat', render: (row) => (
      row.can_access_center
        ? <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">✓ Ya</span>
        : <span className="px-2 py-1 bg-gray-100 text-gray-400 rounded-full text-xs">Tidak</span>
    )},
    {
      key: 'aksi', label: 'Aksi',
      render: (row) => (
        <div className="flex gap-2">
          {can('users', 'edit') && (
            <button onClick={() => openEdit(row)}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs transition">
              Edit
            </button>
          )}
          {can('users', 'delete') && (
            <button onClick={() => setConfirm({ open: true, id: row.ID })}
              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs transition">
              Hapus
            </button>
          )}
        </div>
      )
    },
  ]

  return (
    <Layout title="User">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">User</h1>
            <p className="text-gray-500 dark:text-zinc-400 text-sm">Kelola data pengguna sistem</p>
          </div>
          {can('users', 'create') && (
            <button onClick={openAdd}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah
            </button>
          )}
        </div>

        <div className="mb-4">
          <input type="text" placeholder="Cari user..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-xs px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors" />
        </div>

        <Table columns={columns} data={filtered} loading={loading} />

        <Modal isOpen={modal.open} onClose={() => setModal({ open: false })}
          title={modal.mode === 'add' ? 'Tambah User' : 'Edit User'}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap <span className="text-red-400">*</span></label>
              <input type="text" value={form.name}
                onChange={e => { setForm(f => ({ ...f, name: e.target.value })); if (errors.name) setErrors(er => ({ ...er, name: '' })) }}
                placeholder="Masukkan nama lengkap" className={inputClass('name')} />
              {errors.name && <p className="text-xs text-red-400 mt-1">⚠ {errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username <span className="text-red-400">*</span></label>
              <input type="text" value={form.username}
                onChange={e => { setForm(f => ({ ...f, username: e.target.value })); if (errors.username) setErrors(er => ({ ...er, username: '' })) }}
                placeholder="Masukkan username" className={inputClass('username')} />
              {errors.username && <p className="text-xs text-red-400 mt-1">⚠ {errors.username}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 font-normal text-xs">(opsional)</span></label>
              <input type="email" value={form.email}
                onChange={e => { setForm(f => ({ ...f, email: e.target.value })); if (errors.email) setErrors(er => ({ ...er, email: '' })) }}
                placeholder="contoh@email.com" className={inputClass('email')} />
              {errors.email && <p className="text-xs text-red-400 mt-1">⚠ {errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {modal.mode === 'add' ? <span className="text-red-400">*</span> : <span className="text-gray-400 font-normal text-xs">(kosongkan jika tidak diubah)</span>}
              </label>
              <input type="password" value={form.password}
                onChange={e => { setForm(f => ({ ...f, password: e.target.value })); if (errors.password) setErrors(er => ({ ...er, password: '' })) }}
                placeholder="Masukkan password" className={inputClass('password')} />
              {errors.password && <p className="text-xs text-red-400 mt-1">⚠ {errors.password}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select value={form.role_id} onChange={e => setForm(f => ({ ...f, role_id: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                <option value="">Pilih Role</option>
                {roles.map(r => <option key={r.ID} value={r.ID}>{r.Name || r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outlet</label>
              <select value={form.outlet_id} onChange={e => setForm(f => ({ ...f, outlet_id: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                <option value="">Pilih Outlet</option>
                {outlets.map(o => <option key={o.ID} value={o.ID}>{o.Name || o.name}</option>)}
              </select>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-700">Akses Pusat</p>
                <p className="text-xs text-gray-400 mt-0.5">Pengguna dapat mengakses dashboard pusat</p>
              </div>
              <button type="button"
                onClick={() => setForm(f => ({ ...f, can_access_center: !f.can_access_center }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.can_access_center ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.can_access_center ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal({ open: false })}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium transition">
                Batal
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-sm font-medium transition">
                {saving ? 'Menyimpan...' : modal.mode === 'add' ? 'Simpan User' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </Modal>

        <ConfirmDialog isOpen={confirm.open} onClose={() => setConfirm({ open: false })} onConfirm={handleDelete} />
      </div>
    </Layout>
  )
}