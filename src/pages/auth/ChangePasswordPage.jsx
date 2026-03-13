import { useState } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) {
      return setMessage({ type: 'error', text: 'Konfirmasi password tidak cocok' })
    }

    setLoading(true)
    setMessage({ type: '', text: '' })
    try {
      await api.put('/auth/change-password', form)
      setMessage({ type: 'success', text: 'Password berhasil diperbarui!' })
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Gagal memperbarui password' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="Account Security">
      <div className="max-w-xl mx-auto mt-10">
        <div className="bg-white dark:bg-zinc-800 rounded-[35px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] p-10 border border-gray-100 dark:border-zinc-700/50 relative overflow-hidden group">
          
          {/* Decorative background for the card */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>

          <div className="relative mb-10">
            <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">Ganti Kata Sandi</h1>
            <p className="text-gray-500 dark:text-zinc-400 font-medium mt-1">Perbarui keamanan akun Anda secara berkala.</p>
          </div>

          {message.text && (
            <div className={`mb-8 p-5 rounded-2xl text-sm font-bold border animate-in zoom-in-95 duration-300 ${
              message.type === 'success' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' 
                : 'bg-red-50 border-red-100 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-lg">{message.type === 'success' ? '✅' : '❌'}</span>
                {message.text}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 relative">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1">Kata Sandi Lama</label>
              <input
                type="password"
                required
                className="w-full px-5 py-4 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-700 text-gray-800 dark:text-white rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all duration-300 placeholder-gray-300 dark:placeholder-zinc-600 font-medium"
                value={form.oldPassword}
                onChange={e => setForm({ ...form, oldPassword: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2 border-t border-gray-50 dark:border-zinc-700/50 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1">Kata Sandi Baru</label>
                <input
                  type="password"
                  required
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-700 text-gray-800 dark:text-white rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all duration-300 placeholder-gray-300 dark:placeholder-zinc-600 font-medium"
                  value={form.newPassword}
                  onChange={e => setForm({ ...form, newPassword: e.target.value })}
                  placeholder="Minimal 6 karakter"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1">Konfirmasi Kata Sandi Baru</label>
                <input
                  type="password"
                  required
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-700 text-gray-800 dark:text-white rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all duration-300 placeholder-gray-300 dark:placeholder-zinc-600 font-medium"
                  value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="Ulangi kata sandi baru"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black shadow-xl shadow-emerald-500/20 transition-all duration-300 disabled:opacity-50 active:scale-[0.98] mt-4 uppercase tracking-widest text-sm"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                   <span>Memproses...</span>
                </div>
              ) : 'Update Kata Sandi'}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-gray-50 dark:border-zinc-700/50 flex items-center justify-center gap-2">
             <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
             </svg>
             <span className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">End-to-End Encryption Secured</span>
          </div>
        </div>
      </div>
    </Layout>
  )
}
