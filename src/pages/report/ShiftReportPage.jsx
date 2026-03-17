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



  // Hitung selisih dan split jadi dua baris (Awal & Akhir)
  const getShiftsWithSaldo = (shifts) => {
    if (!shifts?.length) return []
    // backend mengembalikan desc, kita ubah jadi asc untuk hitung selisih dari awal
    const sorted = [...shifts].reverse() 
    const rows = []
    let prevCashOut = null

    sorted.forEach((shift) => {
      const cashIn = shift.CashIn || shift.cash_in || 0
      const cashOut = shift.CashOut || shift.cash_out || 0
      const diffEnd = shift.Difference || shift.difference || 0
      const startTime = shift.StartTime || shift.start_time
      const endTime = shift.EndTime || shift.end_time
      const userName = shift.User?.Name || shift.user?.Name || shift.User?.username || shift.user?.username || shift.User?.name || shift.user?.name || '-'

      // 1. Awal Shift
      const selisihAwal = prevCashOut !== null ? (cashIn - prevCashOut) : 0
      
      let uraianAwal = ''
      if (selisihAwal > 0) uraianAwal = `Sistem : Kas lebih ${selisihAwal} dari kas sebelumnya.`
      else if (selisihAwal < 0) uraianAwal = `Sistem : Kas kurang ${Math.abs(selisihAwal)} dari kas sebelumnya.`

      rows.push({
        id: `${shift.ID || shift.id}-awal`,
        waktu: startTime,
        uraian: uraianAwal,
        jenis: 'Awal Shift',
        nama: userName,
        masuk: cashIn,
        keluar: null,
        selisih: selisihAwal,
        saldo: cashIn // Fix: Saldo Awal adalah modal yang dimasukkan
      })

      // 2. Akhir Shift
      const isEnded = endTime && !String(endTime).startsWith('0001')
      if (isEnded) {
        // Difference dari backend -> (CashIn + Sales) - CashOut
        // Selisih Laporan -> CashOut - Expected = -(Difference)
        const selisihAkhir = -diffEnd

        let uraianAkhir = ''
        if (selisihAkhir > 0) uraianAkhir = `Sistem : Kas lebih ${selisihAkhir} dari estimasi saldo.`
        else if (selisihAkhir < 0) uraianAkhir = `Sistem : Kas kurang ${Math.abs(selisihAkhir)} dari estimasi saldo.`

        rows.push({
          id: `${shift.ID || shift.id}-akhir`,
          waktu: endTime,
          uraian: uraianAkhir,
          jenis: 'Akhir Shift',
          nama: userName,
          masuk: null,
          keluar: cashOut,
          selisih: selisihAkhir,
          saldo: cashOut // Fix: Saldo Akhir adalah uang yang ada di laci saat shift ditutup
        })

        prevCashOut = cashOut
      } else {
        prevCashOut = cashIn
      }
    })

    return rows
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
                  {shiftsWithSaldo.length > 0 ? shiftsWithSaldo.map((row) => {
                    const fmtNum = (num) => num === 0 ? '0' : Number(num).toLocaleString('id-ID')

                    return (
                      <tr key={row.id} className="hover:bg-gray-50/50 transition border-b border-gray-100">
                        <td className="px-4 py-3 text-gray-800 font-medium whitespace-nowrap">
                          {new Date(row.waktu).toLocaleString('sv').replace(' ', ' ')}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                           {row.uraian}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {row.jenis}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {row.nama}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-800">
                          {row.masuk !== null && row.masuk > 0 ? fmtNum(row.masuk) : (row.masuk === 0 ? '0' : '')}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-800">
                          {row.keluar !== null && row.keluar > 0 ? fmtNum(row.keluar) : (row.keluar === 0 ? '0' : '')}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-800">
                           {fmtNum(row.selisih)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-800">
                           {fmtNum(row.saldo)}
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