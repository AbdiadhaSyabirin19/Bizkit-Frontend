import { useState, useEffect, useRef } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'

export default function DailyReportPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const printRef = useRef()

  useEffect(() => { fetchData() }, [date])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/sales/daily?date=${date}`)
      setData(res.data.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const prevDay = () => {
    const d = new Date(date); d.setDate(d.getDate() - 1)
    setDate(d.toISOString().split('T')[0])
  }
  const nextDay = () => {
    const d = new Date(date); d.setDate(d.getDate() + 1)
    setDate(d.toISOString().split('T')[0])
  }

  const formatRp = (val) => `Rp ${Number(val || 0).toLocaleString('id-ID')}`
  const formatTime = (val) => {
    if (!val) return '-'
    return new Date(val).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }
  const formatDate = (val) => {
    if (!val) return '-'
    return new Date(val).toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  // Hitung statistik dari items
  const getStats = () => {
    if (!data?.sales) return { topProducts: [], totalQtyByProduct: {} }
    const productMap = {}
    data.sales.forEach(sale => {
      sale.items?.forEach(item => {
        const name = item.product?.name || item.product?.Name || '-'
        if (!productMap[name]) productMap[name] = { name, qty: 0, omzet: 0 }
        productMap[name].qty += item.quantity || item.Quantity || 0
        productMap[name].omzet += item.subtotal || item.Subtotal || 0
      })
    })
    return Object.values(productMap).sort((a, b) => b.qty - a.qty)
  }

  // Laporan arus kas
  const getArusKas = () => {
    if (!data?.sales) return []
    const kasMap = {}
    data.sales.forEach(sale => {
      const method = sale.payment_method?.Name || sale.PaymentMethod?.Name || 'Tunai'
      if (!kasMap[method]) kasMap[method] = { method, masuk: 0, transaksi: 0 }
      kasMap[method].masuk += sale.grand_total || sale.GrandTotal || 0
      kasMap[method].transaksi += 1
    })
    return Object.values(kasMap)
  }

  const topProducts = getStats()
  const arusKas = getArusKas()
  const totalKas = arusKas.reduce((s, k) => s + k.masuk, 0)

  // ── Export Excel ──
  const exportExcel = async () => {
    const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs')

    const wb = XLSX.utils.book_new()

    // Sheet 1: Transaksi
    const trxRows = [
      ['No', 'Invoice', 'Waktu', 'Kasir', 'Metode Bayar', 'Qty', 'Subtotal', 'Diskon', 'Total'],
      ...(data?.sales || []).map((sale, idx) => {
        const qty = sale.items?.reduce((s, i) => s + (i.quantity || i.Quantity || 0), 0) || 0
        return [
          idx + 1,
          sale.invoice_number || sale.InvoiceNumber,
          formatTime(sale.created_at || sale.CreatedAt),
          sale.user?.Name || '-',
          sale.payment_method?.Name || sale.PaymentMethod?.Name || '-',
          qty,
          sale.subtotal || sale.Subtotal || 0,
          sale.discount_total || sale.DiscountTotal || 0,
          sale.grand_total || sale.GrandTotal || 0,
        ]
      })
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(trxRows), 'Transaksi')

    // Sheet 2: Metode Pembayaran
    const bayarRows = [
      ['Metode Pembayaran', 'Jumlah Transaksi', 'Total'],
      ...arusKas.map(k => [k.method, k.transaksi, k.masuk]),
      ['TOTAL', arusKas.reduce((s, k) => s + k.transaksi, 0), totalKas]
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(bayarRows), 'Metode Bayar')

    // Sheet 3: Produk Terlaris
    const prodRows = [
      ['Produk', 'Qty Terjual', 'Total Omzet'],
      ...topProducts.map(p => [p.name, p.qty, p.omzet])
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(prodRows), 'Produk')

    XLSX.writeFile(wb, `Laporan-Harian-${date}.xlsx`)
  }

  // ── Export PDF ──
  const exportPDF = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Laporan Harian ${date}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 11px; color: #222; padding: 24px; }
          h1 { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
          p.sub { color: #666; font-size: 10px; margin-bottom: 16px; }
          .summary { display: flex; gap: 12px; margin-bottom: 16px; }
          .card { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
          .card .label { color: #6b7280; font-size: 9px; text-transform: uppercase; }
          .card .value { font-size: 14px; font-weight: bold; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th { background: #f3f4f6; text-align: left; padding: 7px 8px; font-size: 9px; text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
          td { padding: 7px 8px; border-bottom: 1px solid #f3f4f6; font-size: 10px; }
          tr:last-child td { border-bottom: none; }
          .section-title { font-size: 12px; font-weight: bold; margin: 14px 0 6px; }
          tfoot td { font-weight: bold; background: #f9fafb; }
        </style>
      </head>
      <body>
        <h1>Laporan Penjualan Harian</h1>
        <p class="sub">${formatDate(date)}</p>

        <div class="summary">
          <div class="card">
            <div class="label">Total Transaksi</div>
            <div class="value">${data?.total_transaksi || 0}</div>
          </div>
          <div class="card">
            <div class="label">Total Item</div>
            <div class="value">${data?.total_qty || 0}</div>
          </div>
          <div class="card">
            <div class="label">Total Omzet</div>
            <div class="value">${formatRp(data?.total_omzet)}</div>
          </div>
          <div class="card">
            <div class="label">Total Diskon</div>
            <div class="value">${formatRp((data?.sales || []).reduce((s, sale) => s + (sale.discount_total || sale.DiscountTotal || 0), 0))}</div>
          </div>
        </div>

        <div class="section-title">Daftar Transaksi</div>
        <table>
          <thead><tr>
            <th>No</th><th>Invoice</th><th>Waktu</th><th>Kasir</th><th>Metode Bayar</th><th>Q</th><th>Total</th>
          </tr></thead>
          <tbody>
            ${(data?.sales || []).map((sale, idx) => {
              const qty = sale.items?.reduce((s, i) => s + (i.quantity || i.Quantity || 0), 0) || 0
              return `<tr>
                <td>${idx + 1}</td>
                <td style="font-family:monospace;font-size:9px">${sale.invoice_number || sale.InvoiceNumber}</td>
                <td>${formatTime(sale.created_at || sale.CreatedAt)}</td>
                <td>${sale.user?.Name || '-'}</td>
                <td>${sale.payment_method?.Name || sale.PaymentMethod?.Name || '-'}</td>
                <td>${qty}</td>
                <td><b>${formatRp(sale.grand_total || sale.GrandTotal)}</b></td>
              </tr>`
            }).join('')}
          </tbody>
          <tfoot><tr>
            <td colspan="5">TOTAL</td>
            <td>${data?.total_qty || 0}</td>
            <td>${formatRp(data?.total_omzet)}</td>
          </tr></tfoot>
        </table>

        <div class="section-title">Metode Pembayaran</div>
        <table>
          <thead><tr><th>Metode</th><th>Transaksi</th><th>Total</th></tr></thead>
          <tbody>
            ${arusKas.map(k => `<tr>
              <td>${k.method}</td>
              <td>${k.transaksi}x</td>
              <td>${formatRp(k.masuk)}</td>
            </tr>`).join('')}
          </tbody>
          <tfoot><tr><td>TOTAL</td><td>${arusKas.reduce((s, k) => s + k.transaksi, 0)}x</td><td>${formatRp(totalKas)}</td></tr></tfoot>
        </table>

        <div class="section-title">Statistik Produk (by Qty)</div>
        <table>
          <thead><tr><th>No</th><th>Produk</th><th>Qty</th><th>Omzet</th></tr></thead>
          <tbody>
            ${topProducts.map((p, i) => `<tr>
              <td>${i + 1}</td>
              <td>${p.name}</td>
              <td>${p.qty}</td>
              <td>${formatRp(p.omzet)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `
    const win = window.open('', '_blank')
    win.document.write(printContent)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 500)
  }

  const totalDiskon = (data?.sales || []).reduce((s, sale) => s + (sale.discount_total || sale.DiscountTotal || 0), 0)

  return (
    <Layout title="Penjualan Harian">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Penjualan Harian</h1>
            <p className="text-gray-500 text-sm">Laporan transaksi per hari</p>
          </div>
          {data && !loading && (
            <div className="flex gap-2">
              <button
                onClick={exportExcel}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                Excel
              </button>
              <button
                onClick={exportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                PDF
              </button>
            </div>
          )}
        </div>

        {/* Date Navigator */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-5 flex items-center justify-between">
          <button onClick={prevDay} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <input
              type="date" value={date}
              onChange={e => setDate(e.target.value)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-gray-500 text-sm hidden md:block">{formatDate(date)}</span>
          </div>
          <button onClick={nextDay} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4 mb-5">
              {[
                { label: 'Total Transaksi', value: data?.total_transaksi || 0, icon: '🧾', color: 'bg-blue-100' },
                { label: 'Total Item Terjual', value: data?.total_qty || 0, icon: '📦', color: 'bg-purple-100' },
                { label: 'Total Omzet', value: formatRp(data?.total_omzet), icon: '💰', color: 'bg-emerald-100' },
                { label: 'Total Diskon', value: formatRp(totalDiskon), icon: '🏷️', color: 'bg-orange-100' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mb-3`}>
                    <span className="text-lg">{s.icon}</span>
                  </div>
                  <p className="text-gray-400 text-xs mb-1">{s.label}</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Tabel Transaksi */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-5">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-800 dark:text-white">Daftar Transaksi</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  {data?.sales?.length || 0} transaksi
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['No', 'Invoice', 'Waktu', 'Kasir', 'Bayar', 'Q', 'Subtotal', 'Diskon', 'Total'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data?.sales?.length > 0 ? data.sales.map((sale, idx) => {
                      const qty = sale.items?.reduce((s, i) => s + (i.quantity || i.Quantity || 0), 0) || 0
                      const grandTotal = sale.grand_total || sale.GrandTotal || 0
                      const subtotal = sale.subtotal || sale.Subtotal || 0
                      const diskon = sale.discount_total || sale.DiscountTotal || 0
                      const invoice = sale.invoice_number || sale.InvoiceNumber
                      const kasir = sale.user?.Name || '-'
                      const bayar = sale.payment_method?.Name || sale.PaymentMethod?.Name || '-'
                      const waktu = formatTime(sale.created_at || sale.CreatedAt)

                      return (
                        <tr key={sale.ID || idx} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 text-gray-500 text-xs">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{invoice}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-700 text-xs">{waktu}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-emerald-700 text-xs font-bold">{kasir?.charAt(0)?.toUpperCase()}</span>
                              </div>
                              <span className="text-xs text-gray-700">{kasir}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-xs">{bayar}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-700 text-xs font-medium">{qty}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{formatRp(subtotal)}</td>
                          <td className="px-4 py-3 text-xs">
                            {diskon > 0
                              ? <span className="text-orange-500">-{formatRp(diskon)}</span>
                              : <span className="text-gray-300">-</span>
                            }
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-gray-800 text-sm">{formatRp(grandTotal)}</span>
                          </td>
                        </tr>
                      )
                    }) : (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500">
                          <p className="text-3xl mb-2">📭</p>
                          <p>Tidak ada transaksi pada tanggal ini</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {data?.sales?.length > 0 && (
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-xs font-bold text-gray-600 uppercase">Total</td>
                        <td className="px-4 py-3 text-xs font-bold text-gray-800 dark:text-white">{data?.total_qty || 0}</td>
                        <td className="px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-400 dark:text-gray-500">{formatRp((data?.sales || []).reduce((s, sale) => s + (sale.subtotal || sale.Subtotal || 0), 0))}</td>
                        <td className="px-4 py-3 text-xs font-bold text-orange-500">-{formatRp(totalDiskon)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-emerald-600">{formatRp(data?.total_omzet)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 mb-5">
              {/* Metode Pembayaran */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-800 dark:text-white">Laporan Metode Pembayaran</h2>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Metode</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Transaksi</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {arusKas.length > 0 ? arusKas.map((k, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">{k.method}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">{k.transaksi}x</td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-800 dark:text-white">{formatRp(k.masuk)}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-xs">Tidak ada data</td></tr>
                    )}
                  </tbody>
                  {arusKas.length > 0 && (
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                      <tr>
                        <td className="px-4 py-3 text-xs font-bold text-gray-600 uppercase">Total</td>
                        <td className="px-4 py-3 text-xs font-bold text-gray-800 dark:text-white">{arusKas.reduce((s, k) => s + k.transaksi, 0)}x</td>
                        <td className="px-4 py-3 text-xs font-bold text-emerald-600">{formatRp(totalKas)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Arus Kas */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-800 dark:text-white">Laporan Arus Kas</h2>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">💵 Total Pemasukan</span>
                    <span className="font-semibold text-emerald-600">{formatRp(data?.total_omzet)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">🏷️ Total Diskon</span>
                    <span className="font-semibold text-orange-500">-{formatRp(totalDiskon)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-bold text-gray-700">💰 Kas Bersih</span>
                    <span className="font-bold text-lg text-emerald-600">{formatRp((data?.total_omzet || 0) - totalDiskon)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistik Produk */}
            {topProducts.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-5">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-800 dark:text-white">Statistik Produk berdasarkan Qty</h2>
                </div>
                <div className="p-5">
                  <div className="space-y-3">
                    {topProducts.map((p, idx) => {
                      const maxQty = topProducts[0]?.qty || 1
                      const pct = Math.round((p.qty / maxQty) * 100)
                      const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500']
                      const color = colors[idx % colors.length]
                      return (
                        <div key={p.name}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 w-5">#{idx + 1}</span>
                              <span className="text-sm text-gray-700 font-medium">{p.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{p.qty} qty</span>
                              <span className="text-xs font-semibold text-gray-800 w-28 text-right">{formatRp(p.omzet)}</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Tabel produk */}
                <div className="border-t border-gray-100 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">No</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Produk</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Qty Terjual</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Total Omzet</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Avg/Transaksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {topProducts.map((p, idx) => (
                        <tr key={p.name} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                          <td className="px-4 py-3 text-gray-700 text-sm font-medium">{p.name}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold">{p.qty}</span>
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-gray-800 dark:text-white">{formatRp(p.omzet)}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                            {formatRp(p.qty > 0 ? p.omzet / p.qty : 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}