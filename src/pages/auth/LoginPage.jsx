import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', form)
      login(res.data.token, res.data.user)
      navigate('/reports/daily')
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal, coba lagi')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    // Ping server saat halaman login dibuka
    api.get('/ping').catch(() => { }) // silent, tidak perlu handle error
  }, [])

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-[#10b981] tracking-tight">BizKit POS</h1>
            <p className="text-gray-400 text-xs mt-1 font-medium">Silakan login ke akun Anda</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
              <p className="text-red-500 text-xs font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Username */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Masukkan username"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition text-sm text-gray-700 placeholder-gray-300 shadow-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Masukkan password"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] transition text-sm text-gray-700 placeholder-gray-300 shadow-sm"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#10b981] hover:bg-[#059669] disabled:bg-[#10b981]/50 text-white font-bold py-3 rounded-lg transition-all duration-200 text-xs uppercase tracking-widest shadow-sm active:scale-[0.98]"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>

          </form>
        </div>

        <p className="text-center text-gray-300 text-[10px] mt-8 font-medium">© 2026 BizKit POS. ALL RIGHTS RESERVED.</p>
      </div>
    </div>
  )
}