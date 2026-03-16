import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
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

  return (
    <Layout title="User">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">User</h1>
          </div>
          <div className="relative w-full max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Cari..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#E9ECEF] border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-bold text-gray-700 w-16">No</th>
                <th className="px-6 py-3 font-bold text-gray-700">Nama</th>
                <th className="px-6 py-3 font-bold text-gray-700">Outlet</th>
                <th className="px-6 py-3 font-bold text-gray-700">Peran</th>
                <th className="px-6 py-3 font-bold text-gray-700 w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-400">Memuat data...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-400">Tidak ada data user</td></tr>
              ) : (
                filtered.map((row, idx) => (
                  <tr key={row.ID} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 font-medium">{idx + 1}</td>
                    <td className="px-6 py-4 text-gray-700 font-medium">{row.username || row.name}</td>
                    <td className="px-6 py-4 text-gray-600">{row.outlet?.Name || row.outlet?.name || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{row.role?.name || row.role?.Name || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-4">
                        <button className="text-gray-400 hover:text-blue-500 transition" title="Login sebagai user ini">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                        </button>
                        {can('users', 'edit') && (
                          <button onClick={() => openEdit(row)} className="text-gray-600 hover:text-blue-500 transition">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {can('users', 'delete') && (
                          <button onClick={() => setConfirm({ open: true, id: row.ID })} className="text-gray-400 hover:text-red-500 transition">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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

        {/* FAB */}
        {can('users', 'create') && (
          <button 
            onClick={openAdd}
            className="fixed bottom-10 right-10 w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-emerald-700 transition-all hover:scale-110 z-30"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}

        <ConfirmDialog isOpen={confirm.open} onClose={() => setConfirm({ open: false })} onConfirm={handleDelete} />
      </div>
    </Layout>
  )
}