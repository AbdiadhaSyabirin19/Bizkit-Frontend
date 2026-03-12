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
      // Simpan endpoint ini jika backend sudah siap, atau gunakan /me atau /users/:id
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
    <Layout title="Ganti Kata Sandi">
      <div className="max-w-md mx-auto mt-10">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Ganti Kata Sandi</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Amankan akun Anda dengan password baru</p>
          </div>

          {message.text && (
            <div className={`mb-6 p-4 rounded-xl text-sm font-medium border ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' 
                : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Kata Sandi Lama</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                value={form.oldPassword}
                onChange={e => setForm({ ...form, oldPassword: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2 border-t border-gray-50 dark:border-gray-700">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Kata Sandi Baru</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                value={form.newPassword}
                onChange={e => setForm({ ...form, newPassword: e.target.value })}
                placeholder="minimal 6 karakter"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Konfirmasi Kata Sandi Baru</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="ulangi password baru"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Memproses...' : 'Simpan Perubahan'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
