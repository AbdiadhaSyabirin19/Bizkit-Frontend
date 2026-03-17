import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'

export default function UserFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [roles, setRoles] = useState([])
  const [outlets, setOutlets] = useState([])
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role_id: '',
    outlet_id: '',
    can_access_center: false
  })

  useEffect(() => {
    fetchMasterData()
    if (isEdit) fetchUser()
  }, [id])

  const fetchMasterData = async () => {
    try {
      const [roleRes, outletRes] = await Promise.all([
        api.get('/roles'),
        api.get('/outlets')
      ])
      setRoles(roleRes.data.data || [])
      setOutlets(outletRes.data.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const fetchUser = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/users/${id}`)
      const item = res.data.data
      setForm({
        name: item.name || '',
        username: item.username || '',
        email: item.email || '',
        password: '',
        role_id: item.role_id || '',
        outlet_id: item.outlet_id || '',
        can_access_center: item.can_access_center || false
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nama lengkap wajib diisi'
    if (!form.username.trim()) e.username = 'Username wajib diisi'
    if (!isEdit && !form.password.trim()) e.password = 'Password wajib diisi'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Format email tidak valid'
    setErrors(e)
    return Object.keys(e).length === 0
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
      if (isEdit) {
        await api.put(`/users/${id}`, payload)
      } else {
        await api.post('/users', payload)
      }
      navigate('/users')
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <Layout title={isEdit ? 'Edit User' : 'Tambah User'}>
      <div className="flex items-center justify-center py-20 text-gray-400 font-medium">Memuat data...</div>
    </Layout>
  )

  const inputClass = (field) =>
    `w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all ${errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-emerald-300'}`

  return (
    <Layout title={isEdit ? 'Edit User' : 'Tambah User'}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Header Breadcrumb equivalent */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/users')} className="p-2 hover:bg-white rounded-xl shadow-sm border border-gray-100 transition group">
            <svg className="w-5 h-5 text-gray-500 group-hover:text-emerald-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{isEdit ? 'Edit User' : 'Tambah User'}</h1>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100/50 space-y-8">
          {/* Form Fields */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Lengkap Pengguna</label>
              <input 
                type="text" 
                value={form.name}
                onChange={e => { setForm(f => ({ ...f, name: e.target.value })); if (errors.name) setErrors(er => ({ ...er, name: '' })) }}
                placeholder="Masukkan nama lengkap" 
                className={inputClass('name')} 
              />
              {errors.name && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium italic"><span>⚠</span> {errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Pengguna</label>
              <input 
                type="email" 
                value={form.email}
                onChange={e => { setForm(f => ({ ...f, email: e.target.value })); if (errors.email) setErrors(er => ({ ...er, email: '' })) }}
                placeholder="Masukkan email" 
                className={inputClass('email')} 
              />
              {errors.email && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium italic"><span>⚠</span> {errors.email}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username Pengguna</label>
                <input 
                  type="text" 
                  value={form.username}
                  onChange={e => { setForm(f => ({ ...f, username: e.target.value })); if (errors.username) setErrors(er => ({ ...er, username: '' })) }}
                  placeholder="Masukkan username" 
                  className={inputClass('username')} 
                  disabled={isEdit && form.username === 'owner'}
                />
                {errors.username && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium italic"><span>⚠</span> {errors.username}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Atur password pengguna <span className="text-xs font-normal text-gray-400">(biarkan kosong apabila tidak apa perubahan)</span>
                </label>
                <input 
                  type="password" 
                  value={form.password}
                  onChange={e => { setForm(f => ({ ...f, password: e.target.value })); if (errors.password) setErrors(er => ({ ...er, password: '' })) }}
                  placeholder="········" 
                  className={inputClass('password')} 
                />
                {errors.password && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium italic"><span>⚠</span> {errors.password}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Apakah Pengguna bisa mengakses Pusat?</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="radio" 
                      name="access_center" 
                      checked={form.can_access_center === true}
                      onChange={() => setForm(f => ({ ...f, can_access_center: true }))}
                      className="peer appearance-none w-5 h-5 rounded-full border-2 border-gray-300 checked:border-emerald-500 transition-all cursor-pointer" 
                    />
                    <div className="absolute w-2.5 h-2.5 rounded-full bg-emerald-500 scale-0 peer-checked:scale-100 transition-transform" />
                  </div>
                  <span className="text-sm font-medium text-gray-600 group-hover:text-emerald-600 transition">ya</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="radio" 
                      name="access_center" 
                      checked={form.can_access_center === false}
                      onChange={() => setForm(f => ({ ...f, can_access_center: false }))}
                      className="peer appearance-none w-5 h-5 rounded-full border-2 border-gray-300 checked:border-emerald-500 transition-all cursor-pointer" 
                    />
                    <div className="absolute w-2.5 h-2.5 rounded-full bg-emerald-500 scale-0 peer-checked:scale-100 transition-transform" />
                  </div>
                  <span className="text-sm font-medium text-gray-600 group-hover:text-emerald-600 transition">tidak</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Peran</label>
              <div className="relative">
                <select 
                  value={form.role_id} 
                  onChange={e => setForm(f => ({ ...f, role_id: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 appearance-none bg-white hover:border-emerald-300 transition-all"
                >
                  <option value="">[Peran]</option>
                  {roles.map(r => <option key={r.ID} value={r.ID}>{r.name || r.Name}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Pilih Outlet</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {outlets.map(o => (
                  <label key={o.ID} className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={form.outlet_id === o.ID}
                        onChange={() => setForm(f => ({ ...f, outlet_id: f.outlet_id === o.ID ? '' : o.ID }))}
                        className="peer appearance-none w-5 h-5 rounded-md border-2 border-gray-300 checked:bg-emerald-500 checked:border-emerald-500 transition-all cursor-pointer" 
                      />
                      <svg className="absolute w-3.5 h-3.5 text-white scale-0 peer-checked:scale-100 transition-transform pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-emerald-700 transition">{o.name || o.Name}</span>
                  </label>
                ))}
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
