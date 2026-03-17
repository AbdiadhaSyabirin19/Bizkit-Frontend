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

  const formatDate = (val) => {
    if (!val) return '-'
    const d = new Date(val)
    return d.toLocaleDateString('id-ID', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCardDateTime = (val) => {
    if (!val || val.startsWith('0001')) return '-'
    const d = new Date(val)
    let str = d.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }) + ' ' + d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    return str.replace(/\./g, ':')
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

  const groupedAttendances = () => {
    if (!data?.attendances) return {}
    const grouped = {}
    data.attendances.forEach(att => {
      let outletName = 'Pusat'
      const user = att.User || att.user
      if (user && (user.Outlet || user.outlet)) {
        outletName = user.Outlet?.Name || user.outlet?.Name || user.Outlet?.name || user.outlet?.name || 'Pusat'
      }
      if (!grouped[outletName]) grouped[outletName] = []
      grouped[outletName].push(att)
    })
    return grouped
  }

  const groups = groupedAttendances()

  return (
    <Layout title="Laporan Absensi">
      <div className="max-w-5xl mx-auto flex justify-center">
        
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm p-4 sm:p-8 min-h-[60vh]">
          {/* Date Navigator Centered */}
          <div className="flex justify-center items-center gap-4 mb-8">
            <button onClick={prevDay} className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded text-gray-700 bg-gray-100 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div className="relative flex items-center justify-center">
              <span className="font-bold text-sm text-gray-800 tracking-wide min-w-[140px] text-center">
                {formatDate(date)}
              </span>
              {/* Invisible input overlay for date picker if user clicks text */}
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <button onClick={nextDay} className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded text-gray-700 bg-gray-100 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>

          {/* Load / List */}
          {loading ? (
            <div className="flex justify-center py-20 text-gray-400">Loading...</div>
          ) : Object.keys(groups).length > 0 ? (
            <div className="space-y-8">
              {Object.keys(groups).map((outletName) => (
                <div key={outletName} className="mb-6">
                  {/* Outlet Header */}
                  <div className="bg-gray-200/80 border-l-4 border-orange-500 px-3 py-1.5 mb-5 flex items-center">
                    <span className="text-[11px] font-bold text-gray-800 tracking-wide">{outletName}</span>
                  </div>

                  {/* Grid */}
                  <div className="flex flex-wrap gap-5 justify-center sm:justify-start pl-1">
                    {groups[outletName].map((att, idx) => {
                      const checkIn = att.CheckIn || att.check_in
                      const photoIn = att.PhotoIn || att.photo_in
                      const userName = att.User?.name || att.user?.name || att.User?.Name || att.user?.Name || att.User?.username || att.user?.username || '-'
                      
                      return (
                         <div key={att.ID || idx} className="flex flex-col items-center w-[110px] sm:w-[130px] transition hover:scale-105 duration-200">
                            {photoIn ? (
                              <img src={getPhotoUrl(photoIn)} className="w-full h-[150px] sm:h-[180px] object-cover rounded-xl shadow-sm bg-gray-100 border border-gray-50" alt={`Absensi ${userName}`} />
                            ) : (
                              <div className={`w-full h-[150px] sm:h-[180px] rounded-xl shadow-sm border border-gray-50 flex items-center justify-center ${avatarColors[idx % avatarColors.length]} text-white text-3xl font-bold`}>
                                {getInitial(userName)}
                              </div>
                            )}
                            <p className="font-bold text-[10px] sm:text-xs mt-2 text-center w-full truncate px-1 text-gray-800">{userName}</p>
                            <p className="text-[9px] sm:text-[10px] text-gray-500 text-center w-full truncate tracking-tight">{formatCardDateTime(checkIn)}</p>
                         </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500 text-sm">
              Tidak ada data absensi
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}