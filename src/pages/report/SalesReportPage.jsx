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
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">Riwayat Penjualan</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Laporan penjualan berdasarkan periode</p>
        </div>

        {/* Filter */}
        <div className="bg-white dark:bg-black rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-gray-800 mb-8 transition-colors">
          <div className="flex items-end gap-6 flex-wrap">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Tanggal Mulai</label>
              <input type="date" value={filter.start_date} onChange={e => setFilter(f => ({ ...f, start_date: e.target.value }))} className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-gray-800 dark:text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Tanggal Akhir</label>
              <input type="date" value={filter.end_date} onChange={e => setFilter(f => ({ ...f, end_date: e.target.value }))} className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-gray-800 dark:text-white" />
            </div>
            <button onClick={fetchData} className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-black transition-all shadow-lg shadow-emerald-500/20 active:scale-95 uppercase tracking-widest">
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
                <div key={s.label} className="bg-white dark:bg-black rounded-[32px] p-7 shadow-sm border border-gray-100 dark:border-gray-800 transition-all group hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">{s.label}</p>
                    <span className="text-xl p-2 bg-gray-50 dark:bg-gray-900 rounded-xl group-hover:scale-110 transition-transform">{s.icon}</span>
                  </div>
                  <p className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Tabel */}
            <div className="bg-white dark:bg-black rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
              <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-lg font-black text-gray-800 dark:text-white tracking-tight">Detail Transaksi</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    {['No', 'Invoice', 'Tanggal', 'Pembeli', 'Kasir', 'Metode', 'Subtotal', 'Diskon', 'Total', ''].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
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
                        <tr key={`row-${sale.ID || idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors group">
                          <td className="px-6 py-4 text-gray-400 font-bold">{idx + 1}</td>
                          <td className="px-6 py-4 font-black text-xs text-gray-800 dark:text-gray-200">{invoice}</td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs font-medium">{tanggal}</td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-xs font-black uppercase tracking-tight">{pembeli}</td>
                          <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-[11px] font-bold">{kasir}</td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-wider">{metode}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-500 text-xs font-medium">{formatRp(subtotal)}</td>
                          <td className="px-6 py-4 text-red-500 text-xs font-bold">{diskon > 0 ? `-${formatRp(diskon)}` : '-'}</td>
                          <td className="px-6 py-4 font-black text-gray-900 dark:text-white">{formatRp(total)}</td>
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
                                      <tr key={i} className="border-t border-emerald-100 dark:border-emerald-500/20">
                                        <td className="py-2 text-gray-700 dark:text-gray-300 font-bold">{prodName}</td>
                                        <td className="py-2 text-gray-500 dark:text-gray-400 font-bold">{qty}x</td>
                                        <td className="py-2 text-gray-500 dark:text-gray-400 font-medium">{formatRp(basePrice)}</td>
                                        <td className="py-2 font-black text-gray-900 dark:text-white">{formatRp(itemSubtotal)}</td>
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