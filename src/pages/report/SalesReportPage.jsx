import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'

export default function SalesReportPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const [filter, setFilter] = useState({
    start_date: today,
    end_date: today,
    only_discounted: false
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/reports/sales?start_date=${filter.start_date}&end_date=${filter.end_date}&only_discounted=${filter.only_discounted}`)
      setData(res.data.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  // Load data awal
  useEffect(() => {
    fetchData()
  }, [])

  const formatNumber = (val) => Number(val || 0).toLocaleString('id-ID')

  // ── Export Excel ──
  const exportExcel = async () => {
    if (!data || !data.sales) return
    const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs')
    const wb = XLSX.utils.book_new()

    const rows = [
      ['LAPORAN RIWAYAT PENJUALAN'],
      [`Periode: ${filter.start_date} - ${filter.end_date}`],
      [''],
      ['No', 'Tanggal', 'Total', 'ID Penjualan', 'Nama Pelanggan']
    ]

    data.sales.forEach((s, i) => {
      rows.push([
        i + 1,
        new Date(s.created_at).toLocaleDateString('id-ID'),
        s.grand_total,
        s.invoice_number,
        s.customer_name || 'Umum'
      ])
    })

    rows.push([''])
    rows.push(['', 'TOTAL PENJUALAN', data.total_omzet])

    const ws = XLSX.utils.aoa_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Penjualan')
    XLSX.writeFile(wb, `Riwayat_Penjualan_${filter.start_date}_${filter.end_date}.xlsx`)
  }

  // ── Export PDF (Print) ──
  const exportPDF = () => {
    window.print()
  }

  return (
    <Layout title="Laporan Riwayat Penjualan">
      <div className="max-w-[1200px] mx-auto px-4 py-6 print:p-0">

        {/* Filter Section - Hidden on print */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 p-6 mb-6 print:hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 min-w-[320px]">
                <span className="text-gray-500 dark:text-zinc-400">📅</span>
                <span className="text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mr-2">Periode</span>
                <input
                  type="date"
                  value={filter.start_date}
                  onChange={e => setFilter(f => ({ ...f, start_date: e.target.value }))}
                  className="bg-transparent text-sm focus:outline-none font-medium text-gray-700 dark:text-gray-200"
                />
                <span className="text-gray-400 px-1">—</span>
                <input
                  type="date"
                  value={filter.end_date}
                  onChange={e => setFilter(f => ({ ...f, end_date: e.target.value }))}
                  className="bg-transparent text-sm focus:outline-none font-medium text-gray-700 dark:text-gray-200"
                />
              </div>

              <button
                onClick={fetchData}
                className="bg-[#374151] hover:bg-[#1f2937] text-white px-8 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95"
              >
                Ganti
              </button>

              <div className="flex items-center gap-2 ml-2">
                <input
                  type="checkbox"
                  id="discount-only"
                  checked={filter.only_discounted}
                  onChange={e => setFilter(f => ({ ...f, only_discounted: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <label htmlFor="discount-only" className="text-sm font-medium text-gray-600 dark:text-zinc-400 cursor-pointer select-none">
                  Tampilkan data yang ada diskon
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={exportPDF}
                className="flex items-center gap-2 bg-[#22d3ee] hover:bg-[#06b6d4] text-white px-10 py-2 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95 uppercase"
              >
                📄 PDF
              </button>
              <button
                onClick={exportExcel}
                className="flex items-center gap-2 bg-[#22d3ee] hover:bg-[#06b6d4] text-white px-10 py-2 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95 uppercase"
              >
                📊 EXCEL
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-20 print:hidden">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
          </div>
        )}

        {/* Table Section */}
        {data && !loading && (
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 mb-6 overflow-hidden print:border-none print:shadow-none">
            <div className="overflow-x-auto overflow-y-auto max-h-[70vh] print:overflow-visible print:max-h-full">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 z-10 bg-[#f8fafc] dark:bg-zinc-900 shadow-sm print:bg-white border-b border-gray-200 dark:border-zinc-700">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-gray-700 dark:text-zinc-300 w-16">No</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-700 dark:text-zinc-300">
                      <div className="flex items-center gap-1">Tgl <span className="text-[10px] text-gray-400 print:hidden">⇅</span></div>
                    </th>
                    <th className="px-6 py-4 text-left font-bold text-gray-700 dark:text-zinc-300">Total</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-700 dark:text-zinc-300">ID Penjualan</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-700 dark:text-zinc-300">
                      <div className="flex items-center gap-1">Nama Pelanggan <span className="text-[10px] text-gray-400 print:hidden">⇅</span></div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
                  {data.sales?.length > 0 ? data.sales.map((sale, idx) => (
                    <tr key={sale.id || sale.ID || idx} className="hover:bg-gray-50/50 dark:hover:bg-zinc-700/30 transition-colors">
                      <td className="px-6 py-4 text-gray-600 dark:text-zinc-400">{idx + 1}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-zinc-400">{new Date(sale.created_at || sale.CreatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })}</td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-200 font-medium">{formatNumber(sale.grand_total)}</td>
                      <td className="px-6 py-4">
                        <span
                          onClick={() => navigate(`/sales/${sale.id || sale.ID}`)}
                          className="text-teal-500 hover:text-teal-600 font-medium cursor-pointer transition-colors print:text-black underline decoration-dotted underline-offset-4"
                        >
                          {sale.invoice_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-200">{sale.customer_name || 'Umum'}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-gray-400 font-medium bg-gray-50/20">
                        Tidak ada data penjualan pada periode ini
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="px-6 py-6 border-t border-gray-100 dark:border-zinc-700 bg-gray-50/30 print:bg-white print:border-none">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                  Tanggal: {new Date(filter.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  -
                  {new Date(filter.end_date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </p>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                  Total Penjualan: {formatNumber(data.total_omzet)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}