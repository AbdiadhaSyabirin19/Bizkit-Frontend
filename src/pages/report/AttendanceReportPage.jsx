import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'

export default function AttendanceReportPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  const API_BASE =
    import.meta.env.VITE_API_URL?.replace('/api', '') ||
    'https://bizkit-backend.onrender.com'

  useEffect(() => {
    fetchData()
  }, [date])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/reports/attendance?date=${date}`)
      setData(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
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
    return new Date(val).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDateTime = (val) => {
    if (!val || val === '0001-01-01T00:00:00Z') return '-'
    return new Date(val).toLocaleString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (val) => {
    if (!val) return '-'
    return new Date(val).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return null
    if (
      checkIn === '0001-01-01T00:00:00Z' ||
      checkOut === '0001-01-01T00:00:00Z'
    )
      return null

    const diff = new Date(checkOut) - new Date(checkIn)
    if (diff <= 0) return null

    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)

    return `${hours}j ${minutes}m`
  }

  const getInitial = (name) => name?.charAt(0)?.toUpperCase() || '?'

  const getPhotoUrl = (path) => {
    if (!path) return null
    if (path.startsWith('http') || path.startsWith('data:')) return path
    return API_BASE + path
  }

  const avatarColors = [
    'bg-emerald-500',
    'bg-blue-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
  ]

  return (
    <Layout title="Laporan Absensi">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Laporan Absensi</h1>
          <p className="text-gray-500 text-sm">Rekap absensi karyawan per hari</p>
        </div>

        {/* Date Navigator */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-5 flex items-center justify-between">
          <button onClick={prevDay} className="p-2 hover:bg-gray-100 rounded-lg">
            ◀
          </button>

          <div className="flex items-center gap-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm"
            />
            <span className="text-gray-500 text-sm hidden md:block">
              {formatDate(date)}
            </span>
          </div>

          <button onClick={nextDay} className="p-2 hover:bg-gray-100 rounded-lg">
            ▶
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-400 text-xs">Total Hadir</p>
            <p className="text-xl font-bold">{data?.total || 0}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-400 text-xs">Sudah Keluar</p>
            <p className="text-xl font-bold">
              {data?.attendances?.filter((a) => {
                const co = a.CheckOut || a.check_out
                return co && !co.startsWith('0001')
              }).length || 0}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-400 text-xs">Masih Kerja</p>
            <p className="text-xl font-bold">
              {data?.attendances?.filter((a) => {
                const co = a.CheckOut || a.check_out
                return !co || co.startsWith('0001')
              }).length || 0}
            </p>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-10">Loading...</div>
        ) : data?.attendances?.length > 0 ? (
          <div className="space-y-4">
            {data.attendances.map((att, idx) => {
              const checkIn = att.CheckIn || att.check_in
              const checkOut = att.CheckOut || att.check_out
              const photoIn = att.PhotoIn || att.photo_in
              const photoOut = att.PhotoOut || att.photo_out

              const userName =
                att.User?.Name || att.user?.Name || att.User?.username || '-'

              const color = avatarColors[idx % avatarColors.length]
              const duration = getDuration(checkIn, checkOut)

              return (
                <div
                  key={att.ID || idx}
                  className="bg-white rounded-2xl shadow-sm p-5"
                >
                  <div className="flex items-center gap-4">

                    <div
                      className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white font-bold`}
                    >
                      {getInitial(userName)}
                    </div>

                    <div className="flex-1">
                      <p className="font-bold">{userName}</p>

                      {duration && (
                        <p className="text-sm text-emerald-600">
                          Durasi kerja: {duration}
                        </p>
                      )}
                    </div>

                    {photoIn && (
                      <img
                        src={getPhotoUrl(photoIn)}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    )}

                    {photoOut && (
                      <img
                        src={getPhotoUrl(photoOut)}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-2 mt-4 text-sm">
                    <div>
                      <p className="text-gray-400 dark:text-zinc-500">Check In</p>
                      <p className="font-semibold">{formatTime(checkIn)}</p>
                    </div>

                    <div>
                      <p className="text-gray-400 dark:text-zinc-500">Check Out</p>
                      <p className="font-semibold">{formatTime(checkOut)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500 dark:text-zinc-400 dark:text-zinc-500">
            Tidak ada data absensi
          </div>
        )}
      </div>
    </Layout>
  )
}