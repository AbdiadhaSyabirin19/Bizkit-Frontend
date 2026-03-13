import { useState } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'

export default function SalesReportPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const today = new Date().toISOString().split('T')[0]
  const [filter, setFilter] = useState({
    start_date: today,
    end_date: today
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/reports/sales?start_date=${filter.start_date}&end_date=${filter.end_date}`)
      setData(res.data.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const formatRp = (val) => `Rp ${Number(val || 0).toLocaleString('id-ID')}`

  return (
    <Layout title="Riwayat Penjualan">
      <div className="max-w-6xl mx-auto">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Riwayat Penjualan</h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm">Rekap data penjualan berdasarkan periode</p>
        </div>

        {/* Filter */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-700 mb-6 transition-colors duration-200">
          <div className="flex items-end gap-4 flex-wrap">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400">Tanggal Mulai</label>
              <input type="date" value={filter.start_date} onChange={e => setFilter(f => ({ ...f, start_date: e.target.value }))} className="px-4 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors font-medium text-gray-800 dark:text-gray-200" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400">Tanggal Akhir</label>
              <input type="date" value={filter.end_date} onChange={e => setFilter(f => ({ ...f, end_date: e.target.value }))} className="px-4 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors font-medium text-gray-800 dark:text-gray-200" />
            </div>
            <button onClick={fetchData} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm active:scale-95">
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
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                { label: 'Total Transaksi', value: data.total_transaksi, icon: '🧾', color: 'blue' },
                { label: 'Total Diskon', value: formatRp(data.total_diskon), icon: '🏷️', color: 'orange' },
                { label: 'Total Omzet', value: formatRp(data.total_omzet), icon: '💰', color: 'emerald' },
              ].map(s => (
                <div key={s.label} className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-700 transition-transform hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-500 dark:text-zinc-400">{s.label}</p>
                    <span className="text-xl p-2 bg-gray-50 dark:bg-gray-700 rounded-xl">{s.icon}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Tabel */}
            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden transition-colors">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-700">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Detail Transaksi</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-900/50">
                  <tr>
                    {['No', 'Invoice', 'Tanggal', 'Pembeli', 'Kasir', 'Metode', 'Subtotal', 'Diskon', 'Total', ''].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-zinc-700/50">
                  {data.sales?.length > 0 ? data.sales.map((sale, idx) => {
                    const invoice = sale.InvoiceNumber || sale.invoice_number
                    const tanggal = new Date(sale.CreatedAt || sale.created_at).toLocaleDateString('id-ID')
                    const pembeli = sale.CustomerName || sale.customer_name || '-'
                    const kasir = sale.User?.Name || sale.user?.Name || '-'
                    const metode = sale.PaymentMethod?.Name || sale.payment_method?.Name || '-'
                    const subtotal = sale.Subtotal || sale.subtotal || 0
                    const diskon = sale.DiscountTotal || sale.discount_total || 0
                    const total = sale.GrandTotal || sale.grand_total || 0
                    const items = sale.Items || sale.items || []
                    const isExpanded = expandedId === (sale.ID || idx)

                    return (
                      <>
                        <tr key={`row-${sale.ID || idx}`} className="hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors">
                          <td className="px-6 py-4 text-gray-600 dark:text-zinc-400">{idx + 1}</td>
                          <td className="px-6 py-4 font-mono text-xs text-gray-800 dark:text-gray-200">{invoice}</td>
                          <td className="px-6 py-4 text-gray-500 dark:text-zinc-400 text-xs">{tanggal}</td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-xs font-medium">{pembeli}</td>
                          <td className="px-6 py-4 text-gray-600 dark:text-zinc-400 text-xs">{kasir}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-medium">{metode}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-zinc-400 text-xs">{formatRp(subtotal)}</td>
                          <td className="px-6 py-4 text-red-500 text-xs">{diskon > 0 ? `-${formatRp(diskon)}` : '-'}</td>
                          <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{formatRp(total)}</td>
                          <td className="px-4 py-3">
                            {items.length > 0 && (
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : (sale.ID || idx))}
                                className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
                              >
                                {isExpanded ? '▲ Tutup' : `▼ ${items.length} item`}
                              </button>
                            )}
                          </td>
                        </tr>
                        {isExpanded && items.length > 0 && (
                          <tr key={`detail-${sale.ID || idx}`} className="bg-emerald-50/40">
                            <td colSpan={10} className="px-8 py-3">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-gray-500">
                                    <th className="text-left pb-1">Produk</th>
                                    <th className="text-left pb-1">Qty</th>
                                    <th className="text-left pb-1">Harga Satuan</th>
                                    <th className="text-left pb-1">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map((item, i) => {
                                    const prodName = item.Product?.Name || item.product?.Name || item.product?.name || '-'
                                    const qty = item.Quantity || item.quantity || 0
                                    const basePrice = item.BasePrice || item.base_price || 0
                                    const itemSubtotal = item.Subtotal || item.subtotal || 0
                                    return (
                                      <tr key={i} className="border-t border-emerald-100 dark:border-zinc-700">
                                        <td className="py-2 text-gray-700 dark:text-gray-300 font-medium">{prodName}</td>
                                        <td className="py-2 text-gray-500 dark:text-zinc-400">{qty}x</td>
                                        <td className="py-2 text-gray-500 dark:text-zinc-400">{formatRp(basePrice)}</td>
                                        <td className="py-2 font-bold text-gray-900 dark:text-white">{formatRp(itemSubtotal)}</td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  }) : (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-gray-400">
                        <p className="text-3xl mb-2">📭</p>
                        <p>Tidak ada data pada periode ini</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}