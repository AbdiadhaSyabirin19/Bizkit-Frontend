import { useState } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'

export default function ShiftReportPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const [filter, setFilter] = useState({ start_date: today, end_date: today })

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/reports/shift?start_date=${filter.start_date}&end_date=${filter.end_date}`)
      setData(res.data.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const formatDate = (val) => {
    if (!val) return '-'
    return new Date(val).toLocaleDateString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  }

  // format time
  const formatTime = (val) => {
    if (!val) return '-'
    return new Date(val).toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit'
    })
  }

  // Hitung saldo running total (urutan dari terlama ke terbaru)
  const getShiftsWithSaldo = (shifts) => {
    if (!shifts?.length) return []
    const sorted = [...shifts].reverse() // backend DESC, balik jadi ASC dulu
    let saldo = 0
    return sorted.map((shift, idx) => {
      const cashIn = shift.CashIn || shift.cash_in || 0
      const cashOut = shift.CashOut || shift.cash_out || 0
      const totalSales = shift.total_sales || 0
      // Saldo per shift = saldo sebelumnya + kasIn + penjualan shift - kasOut
      // Tapi karena kita tidak punya penjualan per-shift di sini, gunakan Difference dari backend
      const diff = shift.Difference || shift.difference || (cashIn - cashOut)
      saldo += diff
      return { ...shift, _saldo: saldo, _cashIn: cashIn, _cashOut: cashOut, _diff: diff, no: idx + 1 }
    }).reverse()
  }

  const getJenis = (shift) => {
    if (shift.CashIn > 0 && shift.CashOut > 0) return { label: 'Buka & Tutup', color: 'bg-blue-100 text-blue-700' }
    if (shift.CashOut > 0) return { label: 'Tutup Shift', color: 'bg-red-100 text-red-600' }
    return { label: 'Buka Shift', color: 'bg-emerald-100 text-emerald-700' }
  }

  const shiftsWithSaldo = getShiftsWithSaldo(data?.shifts)

  return (
    <Layout title="Pergantian Shift">
      <div className="max-w-7xl mx-auto py-8">

        {/* Filter inline row */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <span className="text-sm font-semibold text-gray-800">Periode</span>
          </div>
          
          <div className="flex items-center">
            <input
              type="date"
              value={filter.start_date}
              onChange={e => setFilter(f => ({ ...f, start_date: e.target.value }))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none w-36"
            />
            {/* no separator in screenshot, just side-by-side inputs (or slight gap) */}
            <input
              type="date"
              value={filter.end_date}
              onChange={e => setFilter(f => ({ ...f, end_date: e.target.value }))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none w-36 ml-2"
            />
            <button
              onClick={fetchData}
              className="px-6 py-1.5 bg-[#374151] hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition ml-3 shadow-sm"
            >
              Ganti
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-400"></div>
          </div>
        )}

        {data && !loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#dcdfe4] text-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold w-36">Waktu</th>
                    <th className="px-4 py-3 text-left font-bold">Uraian</th>
                    <th className="px-4 py-3 text-left font-bold w-28">Jenis</th>
                    <th className="px-4 py-3 text-left font-bold w-32">Nama</th>
                    <th className="px-4 py-3 text-right font-bold w-28">Masuk</th>
                    <th className="px-4 py-3 text-right font-bold w-28">Keluar</th>
                    <th className="px-4 py-3 text-right font-bold w-28">Selisih</th>
                    <th className="px-4 py-3 text-right font-bold w-28">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {shiftsWithSaldo.length > 0 ? shiftsWithSaldo.map((shift, idx) => {
                    const cashIn = shift.CashIn || shift.cash_in || 0
                    const cashOut = shift.CashOut || shift.cash_out || 0
                    const diff = shift.Difference || shift.difference || (cashIn - cashOut)
                    const saldo = shift._saldo || 0
                    const startTime = shift.StartTime || shift.start_time
                    const userName = shift.User?.Name || shift.user?.Name || shift.User?.username || shift.user?.username || shift.User?.name || shift.user?.name || '-'

                    // Determine type (Jenis) based on cashflow
                    let jenisStr = 'Awal Shift'
                    if (cashOut > 0 && cashIn === 0) jenisStr = 'Akhir Shift'
                    else if (cashOut > 0 && cashIn > 0) jenisStr = 'Update Shift'

                    // Format numbers clean like screenshot: 50.000 (no Rp)
                    const fmtNum = (num) => num === 0 ? '0' : Number(num).toLocaleString('id-ID')

                    return (
                      <tr key={shift.ID || idx} className="hover:bg-gray-50/50 transition border-b border-gray-100">
                        {/* Waktu */}
                        <td className="px-4 py-3 text-gray-800 font-medium">
                          {new Date(startTime).toLocaleString('sv').replace(' ', ' ')}
                        </td>

                        {/* Uraian */}
                        <td className="px-4 py-3 text-gray-700">
                           {/* Using static uraian string to mimic screenshot style, ideally from backend */}
                           {shift.Description || shift.description || (diff !== 0 ? `Sistem : Kas ${diff > 0 ? 'lebih' : 'kurang'} ${Math.abs(diff)} dari ${jenisStr === 'Awal Shift' ? 'kas sebelumnya' : 'estimasi saldo'}.` : '')}
                        </td>

                        {/* Jenis */}
                        <td className="px-4 py-3 text-gray-700">
                          {jenisStr}
                        </td>

                        {/* Nama (Kasir) */}
                        <td className="px-4 py-3 text-gray-700">
                          {userName}
                        </td>

                        {/* Masuk */}
                        <td className="px-4 py-3 text-right text-gray-800">
                          {cashIn > 0 ? fmtNum(cashIn) : ''}
                        </td>

                        {/* Keluar */}
                        <td className="px-4 py-3 text-right text-gray-800">
                          {cashOut > 0 ? fmtNum(cashOut) : ''}
                        </td>

                        {/* Selisih */}
                        <td className="px-4 py-3 text-right text-gray-800">
                           {fmtNum(diff)}
                        </td>

                        {/* Saldo */}
                        <td className="px-4 py-3 text-right text-gray-800">
                           {fmtNum(saldo)}
                        </td>
                      </tr>
                    )
                  }) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        Tidak ada data shift pada periode ini
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}