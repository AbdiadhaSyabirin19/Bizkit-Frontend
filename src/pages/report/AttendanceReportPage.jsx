import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'

export default function AttendanceReportPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  useEffect(() => { fetchData() }, [date])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/reports/attendance?date=${date}`)
      setData(res.data.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const prevDay = () => {
    const d = new Date(date)
    d.setDate(d.getDate() - 1)
    setDate(d.toISOString().split('T')[0])
  }

  const nextDay = () => {
    const d = new Date(date)
    d.setDate(d.getDate() + 1)
    setDate(d.toISOString().split('T')[0])
  }

  const formatTime = (val) => {
    if (!val || val === '0001-01-01T00:00:00Z') return '-'
    return new Date(val).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDateTime = (val) => {
    if (!val || val === '0001-01-01T00:00:00Z') return '-'
    return new Date(val).toLocaleString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long',
      day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const formatDate = (val) => {
    if (!val) return '-'
    return new Date(val).toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  const getDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return null
    if (checkIn === '0001-01-01T00:00:00Z' || checkOut === '0001-01-01T00:00:00Z') return null
    const diff = new Date(checkOut) - new Date(checkIn)
    if (diff <= 0) return null
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    return `${hours}j ${minutes}m`
  }

  const getInitial = (name) => name?.charAt(0)?.toUpperCase() || '?'

  const avatarColors = [
    'bg-emerald-500', 'bg-blue-500', 'bg-purple-500',
    'bg-orange-500', 'bg-pink-500', 'bg-teal-500'
  ]

  return (
    <Layout title="Laporan Absensi">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-800">Laporan Absensi</h1>
          <p className="text-gray-500 text-sm">Rekap absensi karyawan per hari</p>
        </div>

        {/* Date Navigator */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-5 flex items-center justify-between">
          <button onClick={prevDay} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <span className="text-gray-500 text-sm hidden md:block">{formatDate(date)}</span>
          </div>
          <button onClick={nextDay} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Summary Card */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-lg">👥</span>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Total Hadir</p>
              <p className="text-xl font-bold text-gray-800">{data?.total || 0}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-lg">✅</span>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Sudah Keluar</p>
              <p className="text-xl font-bold text-gray-800">
                {data?.attendances?.filter(a => {
                  const co = a.CheckOut || a.check_out
                  return co && !co.startsWith('0001')
                }).length || 0}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-lg">⏳</span>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Masih Kerja</p>
              <p className="text-xl font-bold text-gray-800">
                {data?.attendances?.filter(a => {
                  const co = a.CheckOut || a.check_out
                  return !co || co.startsWith('0001')
                }).length || 0}
              </p>
            </div>
          </div>
        </div>

        {/* List Absensi */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
          </div>
        ) : data?.attendances?.length > 0 ? (
          <div className="space-y-4">
            {data.attendances.map((att, idx) => {
              // Support both PascalCase (GORM) and snake_case
              const checkIn = att.CheckIn || att.check_in
              const checkOut = att.CheckOut || att.check_out
              const photoIn = att.PhotoIn || att.photo_in
              const photoOut = att.PhotoOut || att.photo_out
              const userName = att.User?.Name || att.user?.Name || att.User?.username || '-'
              const userRole = att.User?.Role?.Name || att.user?.role?.Name || att.User?.role?.Name || 'Karyawan'

              const duration = getDuration(checkIn, checkOut)
              const color = avatarColors[idx % avatarColors.length]
              const sudahKeluar = checkOut && !checkOut.startsWith('0001')
              const hasPhotoIn = photoIn && photoIn !== ''
              const hasPhotoOut = photoOut && photoOut !== ''
              const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080'
              const getPhotoUrl = (path) => {
                if (!path) return null
                if (path.startsWith('http') || path.startsWith('data:')) return path
                return API_BASE + path
              }

              return (
                <div key={att.ID || idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                  {/* Header kartu */}
                  <div className="flex items-center gap-4 p-5">
                    {/* Avatar */}
                    <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-bold text-xl">{getInitial(userName)}</span>
                    </div>

                    {/* Info user */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-800 text-base">{userName}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sudahKeluar ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}`}>
                          {sudahKeluar ? 'Selesai' : 'Sedang Bekerja'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5">{userRole}</p>
                      {duration && (
                        <p className="text-emerald-600 text-xs mt-1 font-medium">⏱ Durasi kerja: {duration}</p>
                      )}
                    </div>

                    {/* Foto thumbnails */}
                    <div className="flex gap-2 flex-shrink-0">
                      {hasPhotoIn && (
                        <button onClick={() => setSelectedPhoto({ url: getPhotoUrl(photoIn), name: `${userName} - Masuk` })} className="group relative">
                          <img src={getPhotoUrl(photoIn)} alt="Foto masuk" className="w-14 h-14 rounded-xl object-cover border-2 border-emerald-200 group-hover:border-emerald-400 transition" onError={e => e.target.parentElement.style.display = 'none'} />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition" />
                          <p className="text-xs text-gray-400 text-center mt-0.5">Masuk</p>
                        </button>
                      )}
                      {hasPhotoOut && (
                        <button onClick={() => setSelectedPhoto({ url: getPhotoUrl(photoOut), name: `${userName} - Pulang` })} className="group relative">
                          <img src={getPhotoUrl(photoOut)} alt="Foto pulang" className="w-14 h-14 rounded-xl object-cover border-2 border-orange-200 group-hover:border-orange-400 transition" onError={e => e.target.parentElement.style.display = 'none'} />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition" />
                          <p className="text-xs text-gray-400 text-center mt-0.5">Pulang</p>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Detail waktu */}
                  <div className="border-t border-gray-50 grid grid-cols-2 divide-x divide-gray-50">
                    <div className="px-5 py-3">
                      <p className="text-xs text-gray-400 mb-1">📥 Check In</p>
                      <p className="font-bold text-emerald-600 text-base">{formatTime(checkIn)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(checkIn)}</p>
                    </div>
                    <div className="px-5 py-3">
                      <p className="text-xs text-gray-400 mb-1">📤 Check Out</p>
                      {sudahKeluar ? (
                        <>
                          <p className="font-bold text-red-500 text-base">{formatTime(checkOut)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(checkOut)}</p>
                        </>
                      ) : (
                        <p className="text-orange-400 text-sm font-medium">Belum checkout</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-500 font-medium">Tidak ada data absensi</p>
            <p className="text-gray-400 text-sm mt-1">Pada tanggal {formatDate(date)}</p>
          </div>
        )}
      </div>

      {/* Modal Foto */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="bg-white rounded-2xl overflow-hidden max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="font-semibold text-gray-800">📸 Bukti Foto — {selectedPhoto.name}</p>
              <button onClick={() => setSelectedPhoto(null)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <img src={selectedPhoto.url} alt={selectedPhoto.name} className="w-full object-contain max-h-96" />
          </div>
        </div>
      )}
    </Layout>
  )
}