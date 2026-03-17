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

  const formatTime = (val) => {
    if (!val) return '-'
    return new Date(val).toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit'
    })
  }

  const formatDateTime = (val) => {
    if (!val) return '-'
    return new Date(val).toLocaleString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const formatRp = (val) => `Rp ${Number(val || 0).toLocaleString('id-ID')}`

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

  const getUraian = (shift) => {
    const tgl = formatDate(shift.StartTime)
    const jam = formatTime(shift.StartTime)
    return `Shift ${tgl} ${jam}`
  }

  const shiftsWithSaldo = getShiftsWithSaldo(data?.shifts)
  const totalSelisih = data?.saldo_akhir ?? ((data?.total_cash_in || 0) - (data?.total_cash_out || 0))

  return (
    <Layout title="Pergantian Shift">
      <div className="max-w-6xl mx-auto">

        {/* Filter */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-5">
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
              <input
                type="date"
                value={filter.start_date}
                onChange={e => setFilter(f => ({ ...f, start_date: e.target.value }))}
                className="px-4 py-2 border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Akhir</label>
              <input
                type="date"
                value={filter.end_date}
                onChange={e => setFilter(f => ({ ...f, end_date: e.target.value }))}
                className="px-4 py-2 border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              onClick={fetchData}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition"
            >
              Tampilkan
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
          </div>
        )}

        {data && !loading && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4 mb-5">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-gray-400 text-xs mb-1">Total Shift</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{data.total_shift || data.shifts?.length || 0}</p>
                <p className="text-xs text-gray-400 mt-1">shift tercatat</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-gray-400 text-xs mb-1">Total Kas Masuk</p>
                <p className="text-xl font-bold text-emerald-600">{formatRp(data.total_cash_in)}</p>
                <p className="text-xs text-gray-400 mt-1">modal buka shift</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-gray-400 text-xs mb-1">Total Kas Keluar</p>
                <p className="text-xl font-bold text-red-500">{formatRp(data.total_cash_out)}</p>
                <p className="text-xs text-gray-400 mt-1">setor saat tutup</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-gray-400 text-xs mb-1">Saldo Akhir</p>
                <p className={`text-xl font-bold ${(data.saldo_akhir ?? 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatRp(data.saldo_akhir ?? 0)}
                </p>
                <p className="text-xs text-gray-400 mt-1">kas masuk + penjualan - kas keluar</p>
              </div>
            </div>

            {/* Tabel */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-800 dark:text-white">Detail Pergantian Shift</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  {data.shifts?.length || 0} data
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {[
                        { label: 'Waktu', w: 'w-32' },
                        { label: 'Uraian', w: 'w-40' },
                        { label: 'Jenis', w: 'w-28' },
                        { label: 'Kasir', w: 'w-28' },
                        { label: 'Masuk', w: 'w-28' },
                        { label: 'Keluar', w: 'w-28' },
                        { label: 'Selisih', w: 'w-28' },
                        { label: 'Saldo', w: 'w-28' },
                      ].map(h => (
                        <th key={h.label} className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase ${h.w}`}>
                          {h.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {shiftsWithSaldo.length > 0 ? shiftsWithSaldo.map((shift, idx) => {
                      const jenis = getJenis(shift)
                      const cashIn = shift.CashIn || shift.cash_in || 0
                      const cashOut = shift.CashOut || shift.cash_out || 0
                      const diff = shift.Difference || shift.difference || (cashIn - cashOut)
                      const saldo = shift._saldo || 0
                      const isPositif = diff >= 0
                      const isSaldoPositif = saldo >= 0
                      const startTime = shift.StartTime || shift.start_time
                      const endTime = shift.EndTime || shift.end_time
                      const userName = shift.User?.Name || shift.user?.Name || '-'

                      return (
                        <tr key={shift.ID || idx} className="hover:bg-gray-50 transition">
                          {/* Waktu */}
                          <td className="px-4 py-3">
                            <p className="text-xs font-medium text-gray-700">{formatDate(startTime)}</p>
                            <p className="text-xs text-gray-400 dark:text-zinc-500">
                              {formatTime(startTime)}
                              {endTime && !String(endTime).startsWith('0001')
                                ? ` – ${formatTime(endTime)}`
                                : ''}
                            </p>
                          </td>

                          {/* Uraian */}
                          <td className="px-4 py-3">
                            <p className="text-xs text-gray-700">{getUraian(shift)}</p>
                            {endTime && !String(endTime).startsWith('0001') && (
                              <p className="text-xs text-gray-400 dark:text-zinc-500">s/d {formatDateTime(endTime)}</p>
                            )}
                          </td>

                          {/* Jenis */}
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${jenis.color}`}>
                              {jenis.label}
                            </span>
                          </td>

                          {/* Kasir */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-emerald-700 text-xs font-bold">
                                  {userName?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                              </div>
                              <span className="text-xs text-gray-700">{userName}</span>
                            </div>
                          </td>

                          {/* Masuk = CashIn (modal buka) */}
                          <td className="px-4 py-3">
                            <p className="text-xs font-semibold text-emerald-600">{formatRp(cashIn)}</p>
                          </td>

                          {/* Keluar = CashOut (setor tutup) */}
                          <td className="px-4 py-3">
                            <p className="text-xs font-semibold text-red-500">{formatRp(cashOut)}</p>
                          </td>

                          {/* Selisih = Difference dari backend */}
                          <td className="px-4 py-3">
                            <p className={`text-xs font-semibold ${isPositif ? 'text-blue-600' : 'text-red-600'}`}>
                              {isPositif ? '+' : ''}{formatRp(diff)}
                            </p>
                          </td>

                          {/* Saldo running */}
                          <td className="px-4 py-3">
                            <p className={`text-xs font-bold ${isSaldoPositif ? 'text-gray-800' : 'text-red-600'}`}>
                              {formatRp(saldo)}
                            </p>
                          </td>
                        </tr>
                      )
                    }) : (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-gray-400 dark:text-zinc-500">
                          <p className="text-3xl mb-2">📭</p>
                          <p>Tidak ada data shift pada periode ini</p>
                        </td>
                      </tr>
                    )}
                  </tbody>

                  {/* Footer total */}
                  {shiftsWithSaldo.length > 0 && (
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-xs font-bold text-gray-600 uppercase">Total</td>
                        <td className="px-4 py-3 text-xs font-bold text-emerald-600">{formatRp(data.total_cash_in)}</td>
                        <td className="px-4 py-3 text-xs font-bold text-red-500">{formatRp(data.total_cash_out)}</td>
                        <td className="px-4 py-3 text-xs font-bold text-blue-600">
                          {totalSelisih >= 0 ? '+' : ''}{formatRp(totalSelisih)}
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-gray-800 dark:text-white">{formatRp(totalSelisih)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}