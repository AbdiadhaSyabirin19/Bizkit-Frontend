import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

export default function KasirLoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const navigate = useNavigate()
  const { login, logout } = useAuth()

  const handleLogin = async () => {
    if (!form.username.trim() || !form.password.trim()) {
      setError('Username dan password wajib diisi')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', {
        username: form.username,
        password: form.password,
      })
      const token    = res.data.token || res.data.data?.token
      const userData = res.data.user  || res.data.data?.user || res.data.data
      login(token, userData)
      const cleanUser = userData?.user || userData
      const canAccessCenter = cleanUser?.can_access_center || cleanUser?.CanAccessCenter
      const roleName = (cleanUser?.role?.name || cleanUser?.Role?.Name || '').toLowerCase()
      if (canAccessCenter || roleName === 'admin' || roleName === 'superadmin' || roleName === 'owner') {
        setError('Akun ini adalah akun admin. Silakan login melalui halaman admin.')
        logout()
        return
      }
      navigate('/kasir')
    } catch (err) {
      setError(err.response?.data?.message || 'Username atau password salah')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative inline-flex mb-4">
            <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-200">
              <span className="text-white text-3xl font-black">B</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-teal-400 rounded-lg flex items-center justify-center shadow">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">BizKit Kasir</h1>
          <p className="text-gray-400 text-sm mt-1">Selamat datang, silakan masuk</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-7">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
              <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-red-600 text-xs leading-relaxed">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Username</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input type="text" value={form.username}
                  onChange={e => { setForm(f => ({ ...f, username: e.target.value })); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="Masukkan username"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                  autoComplete="username" autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="Masukkan password"
                  className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                  {showPass
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
            </div>

            {/* Submit */}
            <button onClick={handleLogin} disabled={loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:bg-emerald-300 text-white rounded-2xl text-sm font-bold transition-all duration-150 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-emerald-100">
              {loading ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" /><span>Memproses...</span></>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg><span>Masuk ke Kasir</span></>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          Login sebagai admin?{' '}
          <a href="/login" className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">Klik di sini</a>
        </p>
      </div>
    </div>
  )
}