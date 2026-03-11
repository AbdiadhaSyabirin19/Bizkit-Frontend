import { useState, useEffect, useRef } from 'react'
import KasirLayout from '../../components/KasirLayout'
import api from '../../api/axios'

const formatRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')
const formatDateTime = (str) => {
  if (!str) return '-'
  return new Date(str).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}
const formatDuration = (start, end) => {
  if (!start) return '-'
  const s = new Date(start)
  const e = end ? new Date(end) : new Date()
  const diff = Math.floor((e - s) / 1000 / 60)
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return `${h}j ${m}m`
}
const isZeroTime = (t) => !t || t.startsWith('0001')

// Base URL backend — ambil dari env atau fallback ke localhost
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080'

// Helper: ubah path relatif server jadi URL lengkap
const getPhotoUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path       // sudah full URL
  if (path.startsWith('data:')) return path      // base64
  return API_BASE + path                         // /uploads/attendance/... → http://localhost:8080/uploads/...
}

// ── Photo Viewer (fullscreen) ───────────────────────────────────────────────
function PhotoViewer({ url, label, onClose }) {
  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/90"
      onClick={onClose}>
      <p className="text-white text-sm font-medium mb-3 opacity-75">{label}</p>
      <img src={url} className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl"
        alt={label} onClick={e => e.stopPropagation()} />
      <button onClick={onClose}
        className="mt-4 px-5 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm transition">
        Tutup
      </button>
    </div>
  )
}

// ── Open Shift Modal ────────────────────────────────────────────────────────
function OpenShiftModal({ onClose, onSuccess }) {
  const [cashIn, setCashIn] = useState('')
  const [notes, setNotes]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const shortcuts = [50000, 100000, 200000, 500000]

  const handleOpen = async () => {
    if (!cashIn || Number(cashIn) < 0) { setError('Modal awal wajib diisi'); return }
    setLoading(true); setError('')
    try {
      const res = await api.post('/shifts/open', { cash_in: Number(cashIn), notes })
      onSuccess(res.data?.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuka shift')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl p-6">
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-800">Buka Shift</h2>
          <p className="text-sm text-gray-400">Masukkan jumlah uang di kasir saat ini</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">{error}</div>}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Modal Awal</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
            <input type="number" value={cashIn} onChange={e => setCashIn(e.target.value)} placeholder="0"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 text-right font-semibold" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {shortcuts.map(v => (
            <button key={v} onClick={() => setCashIn(String(v))}
              className={`py-1.5 rounded-lg text-xs font-medium border transition ${Number(cashIn) === v ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-600 hover:border-emerald-400'}`}>
              {v >= 1000 ? `${v/1000}rb` : v}
            </button>
          ))}
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Keterangan <span className="text-gray-400 font-normal">(opsional)</span></label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Contoh: shift pagi, ada promo hari ini..." rows={2}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Batal</button>
          <button onClick={handleOpen} disabled={loading}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-sm font-semibold transition">
            {loading ? 'Membuka...' : 'Buka Shift'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Close Shift Modal ───────────────────────────────────────────────────────
function CloseShiftModal({ shift, summary, onClose, onSuccess }) {
  const [cashOut, setCashOut] = useState('')
  const [notes, setNotes]     = useState(shift?.notes || shift?.Notes || '')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const expectedCash = (shift?.cash_in || shift?.CashIn || 0) + (summary?.total_sales || 0)
  const selisih = cashOut ? Number(cashOut) - expectedCash : null

  const handleClose = async () => {
    if (!cashOut || Number(cashOut) < 0) { setError('Uang akhir wajib diisi'); return }
    setLoading(true); setError('')
    try {
      const res = await api.post('/shifts/close', { cash_out: Number(cashOut), notes })
      onSuccess(res.data?.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menutup shift')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl p-6">
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M12 8v4l3 3" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-800">Tutup Shift</h2>
          <p className="text-sm text-gray-400">{shift?.User?.Name || shift?.user?.name || 'Kasir'}</p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Modal Awal</span>
            <span className="font-medium">{formatRp(shift?.cash_in || shift?.CashIn)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Penjualan</span>
            <span className="font-medium text-emerald-600">{formatRp(summary?.total_sales)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Transaksi</span>
            <span className="font-medium">{summary?.total_trx || 0}x</span>
          </div>
          <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-2">
            <span className="text-gray-700">Ekspektasi Kas</span>
            <span>{formatRp(expectedCash)}</span>
          </div>
        </div>

        {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">{error}</div>}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Uang di Kasir Sekarang</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
            <input type="number" value={cashOut} onChange={e => setCashOut(e.target.value)} placeholder="0"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 text-right font-semibold" />
          </div>
          {selisih !== null && (
            <p className={`text-xs mt-1.5 font-medium ${selisih >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {selisih >= 0 ? `+${formatRp(selisih)} lebih` : `${formatRp(Math.abs(selisih))} kurang`}
            </p>
          )}
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Keterangan <span className="text-gray-400 font-normal">(opsional)</span></label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Catatan penutupan shift..." rows={2}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Batal</button>
          <button onClick={handleClose} disabled={loading}
            className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-xl text-sm font-semibold transition">
            {loading ? 'Menutup...' : 'Tutup Shift'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Edit Notes Modal ────────────────────────────────────────────────────────
function EditNotesModal({ shift, onClose, onSuccess }) {
  const [notes, setNotes]     = useState(shift?.notes || shift?.Notes || '')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSave = async () => {
    setLoading(true); setError('')
    try {
      const id = shift.ID || shift.id
      await api.patch(`/shifts/${id}/notes`, { notes })
      onSuccess({ ...shift, notes, Notes: notes })
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan keterangan')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl p-6">
        <h2 className="text-base font-bold text-gray-800 mb-1">Edit Keterangan Shift</h2>
        <p className="text-xs text-gray-400 mb-4">
          {shift?.User?.Name || shift?.user?.name || 'Kasir'} · {formatDateTime(shift?.start_time || shift?.StartTime)}
        </p>

        {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">{error}</div>}

        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Tambahkan keterangan shift..." rows={3}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none mb-3" />

        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
          <span className="text-sm">⚠️</span>
          <p className="text-xs text-amber-700">Hanya keterangan yang bisa diedit. Data nominal tidak dapat diubah.</p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Batal</button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-sm font-semibold transition">
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Camera / Photo Modal ────────────────────────────────────────────────────
function AttendancePhotoModal({ type, onClose, onSubmit }) {
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream]     = useState(null)
  const [preview, setPreview]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [camError, setCamError] = useState('')

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      setStream(s)
      if (videoRef.current) videoRef.current.srcObject = s
    } catch {
      setCamError('Kamera tidak dapat diakses. Pastikan izin kamera sudah diberikan.')
    }
  }

  const stopCamera = () => stream?.getTracks().forEach(t => t.stop())

  const capture = () => {
    const video = videoRef.current; const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth; canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    setPreview(canvas.toDataURL('image/jpeg', 0.8))
    stopCamera()
  }

  const retake = () => { setPreview(null); startCamera() }

  const handleSubmit = async () => {
    if (!preview) return
    setLoading(true)
    await onSubmit(preview)
    setLoading(false)
  }

  const isCheckIn = type === 'checkin'

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">

        <div className={`px-5 pt-5 pb-4 flex items-center justify-between ${isCheckIn ? 'bg-emerald-50' : 'bg-orange-50'}`}>
          <div>
            <h2 className="text-base font-bold text-gray-800">
              {isCheckIn ? '📸 Foto Absen Masuk' : '📸 Foto Absen Pulang'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Ambil foto selfie untuk konfirmasi absensi</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative bg-black aspect-[4/3] w-full overflow-hidden">
          {camError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6">
              <span className="text-5xl mb-3">📷</span>
              <p className="text-sm opacity-80">{camError}</p>
            </div>
          ) : preview ? (
            <img src={preview} className="w-full h-full object-cover scale-x-[-1]" alt="preview" />
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
          )}
          {!preview && !camError && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-36 h-44 border-2 border-white/30 rounded-full" />
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />

        <div className="p-5">
          {preview ? (
            <div className="flex gap-3">
              <button onClick={retake}
                className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                📷 Ambil Ulang
              </button>
              <button onClick={handleSubmit} disabled={loading}
                className={`flex-1 py-3 rounded-2xl text-sm font-semibold text-white transition ${
                  isCheckIn ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300' : 'bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300'
                }`}>
                {loading ? 'Menyimpan...' : isCheckIn ? '✅ Konfirmasi Masuk' : '✅ Konfirmasi Pulang'}
              </button>
            </div>
          ) : (
            <button onClick={capture} disabled={!!camError}
              className={`w-full py-4 rounded-2xl text-sm font-semibold text-white transition ${
                isCheckIn ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300' : 'bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300'
              }`}>
              📸 Ambil Foto
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Tab Absensi ─────────────────────────────────────────────────────────────
function TabAbsensi() {
  const [attendance, setAttendance] = useState(null)
  const [history, setHistory]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [showPhoto, setShowPhoto]   = useState(null)  // 'checkin' | 'checkout'
  const [viewPhoto, setViewPhoto]   = useState(null)  // { url, label }
  const [error, setError]           = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [todayRes, histRes] = await Promise.allSettled([
        api.get('/attendances/today'),
        api.get('/attendances/history'),
      ])
      if (todayRes.status === 'fulfilled') setAttendance(todayRes.value.data?.data || null)
      if (histRes.status  === 'fulfilled') setHistory(histRes.value.data?.data || [])
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handlePhotoSubmit = async (dataUrl) => {
    setError('')
    try {
      const blob = await (await fetch(dataUrl)).blob()
      const form = new FormData()
      form.append('photo', blob, 'absensi.jpg')

      if (showPhoto === 'checkin') {
        const res = await api.post('/attendances/checkin', form, { headers: { 'Content-Type': 'multipart/form-data' } })
        setAttendance(res.data?.data)
      } else {
        const id = attendance?.ID || attendance?.id
        const res = await api.post(`/attendances/${id}/checkout`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
        setAttendance(res.data?.data)
      }
      setShowPhoto(null)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan absensi')
      setShowPhoto(null)
    }
  }

  const hasCheckedIn  = attendance && !isZeroTime(attendance.check_in  || attendance.CheckIn)
  const hasCheckedOut = attendance && attendance.check_out != null && !isZeroTime(attendance.check_out)

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
    </div>
  )

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
      )}

      {/* Status Absensi Hari Ini */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <p className="text-sm font-semibold text-gray-700">Absensi Hari Ini</p>
          <p className="text-xs text-gray-400">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Absen Masuk */}
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${hasCheckedIn ? 'bg-emerald-100' : 'bg-gray-100'}`}>
              {hasCheckedIn
                ? <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                : <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
              }
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Absen Masuk</p>
              {hasCheckedIn
                ? <p className="text-xs text-emerald-600 font-medium">{formatDateTime(attendance.check_in || attendance.CheckIn)}</p>
                : <p className="text-xs text-gray-400">Belum absen masuk</p>
              }
            </div>
            {hasCheckedIn
              ? (() => {
                  const url = getPhotoUrl(attendance.photo_in || attendance.PhotoIn)
                  return url
                    ? <button onClick={() => setViewPhoto({ url, label: 'Foto Absen Masuk' })}
                        className="relative group flex-shrink-0">
                        <img src={url} className="w-14 h-14 rounded-xl object-cover border-2 border-emerald-200" alt="foto masuk" />
                        <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </button>
                    : null
                })()
              : <button onClick={() => setShowPhoto('checkin')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition">
                  Absen Masuk
                </button>
            }
          </div>

          {/* Absen Pulang */}
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${hasCheckedOut ? 'bg-orange-100' : 'bg-gray-100'}`}>
              {hasCheckedOut
                ? <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                : <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              }
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Absen Pulang</p>
              {hasCheckedOut
                ? <p className="text-xs text-orange-500 font-medium">{formatDateTime(attendance.check_out || attendance.CheckOut)}</p>
                : <p className="text-xs text-gray-400">{hasCheckedIn ? 'Belum absen pulang' : 'Absen masuk dulu'}</p>
              }
            </div>
            {hasCheckedOut
              ? (() => {
                  const url = getPhotoUrl(attendance.photo_out || attendance.PhotoOut)
                  return url
                    ? <button onClick={() => setViewPhoto({ url, label: 'Foto Absen Pulang' })}
                        className="relative group flex-shrink-0">
                        <img src={url} className="w-14 h-14 rounded-xl object-cover border-2 border-orange-200" alt="foto pulang" />
                        <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </button>
                    : null
                })()
              : hasCheckedIn
                  ? <button onClick={() => setShowPhoto('checkout')}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold transition">
                      Absen Pulang
                    </button>
                  : <span className="text-xs text-gray-300 px-3">—</span>
            }
          </div>
        </div>
      </div>

      {/* Riwayat Absensi */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Riwayat Absensi</h3>
        {history.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-8 text-center">
            <p className="text-sm text-gray-400">Belum ada riwayat absensi</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((a, idx) => {
              const checkIn   = a.check_in  || a.CheckIn
              const checkOut  = a.check_out || a.CheckOut
              const photoIn   = getPhotoUrl(a.photo_in  || a.PhotoIn)
              const photoOut  = getPhotoUrl(a.photo_out || a.PhotoOut)
              const sudahPulang = checkOut && !isZeroTime(checkOut)

              return (
                <div key={a.ID || a.id || idx} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">
                        {new Date(checkIn).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                          <span className="text-xs text-gray-500">
                            Masuk: <span className="font-medium text-gray-700">{new Date(checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          </span>
                        </div>
                        {sudahPulang && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                            <span className="text-xs text-gray-500">
                              Pulang: <span className="font-medium text-gray-700">{new Date(checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                            </span>
                          </div>
                        )}
                      </div>
                      {sudahPulang && (
                        <p className="text-xs text-gray-400 mt-1">Durasi: {formatDuration(checkIn, checkOut)}</p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {photoIn  && (
                        <button onClick={() => setViewPhoto({ url: photoIn, label: 'Foto Masuk' })}
                          className="relative group">
                          <img src={photoIn}  className="w-12 h-12 rounded-xl object-cover border border-emerald-200" alt="masuk" />
                          <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </div>
                        </button>
                      )}
                      {photoOut && (
                        <button onClick={() => setViewPhoto({ url: photoOut, label: 'Foto Pulang' })}
                          className="relative group">
                          <img src={photoOut} className="w-12 h-12 rounded-xl object-cover border border-orange-200" alt="pulang" />
                          <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showPhoto && (
        <AttendancePhotoModal type={showPhoto} onClose={() => setShowPhoto(null)} onSubmit={handlePhotoSubmit} />
      )}
      {viewPhoto && (
        <PhotoViewer url={viewPhoto.url} label={viewPhoto.label} onClose={() => setViewPhoto(null)} />
      )}
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function LaporanShift() {
  const [tab, setTab]             = useState('shift')
  const [activeShift, setActiveShift] = useState(null)
  const [summary, setSummary]     = useState(null)
  const [history, setHistory]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [showOpen, setShowOpen]   = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [editShift, setEditShift] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [activeRes, historyRes] = await Promise.allSettled([
        api.get('/shifts/active'),
        api.get('/shifts/history'),
      ])

      const shift = activeRes.status === 'fulfilled' ? activeRes.value.data?.data || null : null
      setActiveShift(shift)

      if (shift?.ID || shift?.id) {
        try {
          const sumRes = await api.get(`/shifts/${shift.ID || shift.id}/summary`)
          setSummary(sumRes.data?.data || null)
        } catch {}
      }

      const hist = historyRes.status === 'fulfilled' ? historyRes.value.data?.data || [] : []
      setHistory(Array.isArray(hist) ? hist : [])
    } catch (err) {
      console.error(err)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleOpenSuccess  = (shift) => { setShowOpen(false); setActiveShift(shift); fetchData() }
  const handleCloseSuccess = () => { setShowClose(false); setActiveShift(null); setSummary(null); fetchData() }
  const handleEditSuccess  = (updated) => {
    setEditShift(null)
    setHistory(h => h.map(s => (s.ID || s.id) === (updated.ID || updated.id) ? updated : s))
  }

  const isShiftActive = activeShift && (activeShift.ID || activeShift.id) &&
    isZeroTime(activeShift.end_time || activeShift.EndTime)

  return (
    <KasirLayout title="Shift & Absensi">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
          {[{ key: 'shift', label: '🕐 Shift' }, { key: 'absensi', label: '📋 Absensi' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
                tab === t.key ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Shift */}
        {tab === 'shift' && (
          loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
          ) : (
            <>
              {isShiftActive ? (
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        <span className="text-sm font-medium opacity-90">Shift Sedang Berjalan</span>
                      </div>
                      <h2 className="text-xl font-bold">{activeShift.User?.Name || activeShift.user?.name || 'Kasir'}</h2>
                      <p className="text-sm opacity-75 mt-0.5">Mulai: {formatDateTime(activeShift.start_time || activeShift.StartTime)}</p>
                      {(activeShift.notes || activeShift.Notes) && (
                        <p className="text-xs opacity-75 mt-1 italic">📝 {activeShift.notes || activeShift.Notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs opacity-75">Durasi</p>
                      <p className="text-lg font-bold">{formatDuration(activeShift.start_time || activeShift.StartTime, null)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white/20 rounded-xl p-3 text-center">
                      <p className="text-xs opacity-75 mb-0.5">Modal Awal</p>
                      <p className="font-bold text-sm">{formatRp(activeShift.cash_in || activeShift.CashIn)}</p>
                    </div>
                    <div className="bg-white/20 rounded-xl p-3 text-center">
                      <p className="text-xs opacity-75 mb-0.5">Penjualan</p>
                      <p className="font-bold text-sm">{formatRp(summary?.total_sales)}</p>
                    </div>
                    <div className="bg-white/20 rounded-xl p-3 text-center">
                      <p className="text-xs opacity-75 mb-0.5">Transaksi</p>
                      <p className="font-bold text-sm">{summary?.total_trx || 0}x</p>
                    </div>
                  </div>

                  <button onClick={() => setShowClose(true)}
                    className="w-full py-3 bg-white text-emerald-600 rounded-xl text-sm font-bold hover:bg-emerald-50 transition">
                    Tutup Shift Sekarang
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-700 mb-1">Belum Ada Shift Aktif</h3>
                  <p className="text-sm text-gray-400 mb-4">Buka shift untuk mulai menerima transaksi</p>
                  <button onClick={() => setShowOpen(true)}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition">
                    Buka Shift Sekarang
                  </button>
                </div>
              )}

              {/* Riwayat Shift */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Riwayat Shift</h3>
                {history.filter(s => !isZeroTime(s.end_time || s.EndTime)).length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 py-8 text-center">
                    <p className="text-sm text-gray-400">Belum ada riwayat shift</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {history
                      .filter(s => !isZeroTime(s.end_time || s.EndTime))
                      .map((s, idx) => {
                        const diff = s.Difference || s.difference || 0
                        return (
                          <div key={s.ID || s.id || idx}
                            className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-emerald-200 transition">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800">{s.User?.Name || s.user?.name || 'Kasir'}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {formatDateTime(s.start_time || s.StartTime)} → {formatDateTime(s.end_time || s.EndTime)}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  Durasi: {formatDuration(s.start_time || s.StartTime, s.end_time || s.EndTime)}
                                </p>
                                {(s.notes || s.Notes) && (
                                  <p className="text-xs text-gray-500 mt-1 italic">📝 "{s.notes || s.Notes}"</p>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-bold text-gray-800">{formatRp(s.cash_out || s.CashOut)}</p>
                                <span className={`text-xs font-medium ${diff >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {diff >= 0 ? `+${formatRp(diff)}` : `-${formatRp(Math.abs(diff))}`}
                                </span>
                                <button onClick={() => setEditShift(s)}
                                  className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-600 transition ml-auto">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit keterangan
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            </>
          )
        )}

        {/* Tab: Absensi */}
        {tab === 'absensi' && <TabAbsensi />}
      </div>

      {showOpen && <OpenShiftModal onClose={() => setShowOpen(false)} onSuccess={handleOpenSuccess} />}
      {showClose && isShiftActive && (
        <CloseShiftModal shift={activeShift} summary={summary} onClose={() => setShowClose(false)} onSuccess={handleCloseSuccess} />
      )}
      {editShift && (
        <EditNotesModal shift={editShift} onClose={() => setEditShift(null)} onSuccess={handleEditSuccess} />
      )}
    </KasirLayout>
  )
}