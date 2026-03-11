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
          <h1 className="text-xl font-bold text-gray-800">Riwayat Penjualan</h1>
          <p className="text-gray-500 text-sm">Laporan penjualan berdasarkan periode</p>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-5">
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
              <input type="date" value={filter.start_date} onChange={e => setFilter(f => ({ ...f, start_date: e.target.value }))} className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Akhir</label>
              <input type="date" value={filter.end_date} onChange={e => setFilter(f => ({ ...f, end_date: e.target.value }))} className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
            <button onClick={fetchData} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition">
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
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[
                { label: 'Total Transaksi', value: data.total_transaksi, icon: '🧾' },
                { label: 'Total Diskon', value: formatRp(data.total_diskon), icon: '🏷️' },
                { label: 'Total Omzet', value: formatRp(data.total_omzet), icon: '💰' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-500 text-sm">{s.label}</p>
                    <span className="text-2xl">{s.icon}</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Tabel */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b">
                <h2 className="font-semibold text-gray-800">Detail Transaksi</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['No', 'Invoice', 'Tanggal', 'Pembeli', 'Kasir', 'Metode', 'Subtotal', 'Diskon', 'Total', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
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
                        <tr key={`row-${sale.ID || idx}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-700">{idx + 1}</td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-700">{invoice}</td>
                          <td className="px-4 py-3 text-gray-700 text-xs">{tanggal}</td>
                          <td className="px-4 py-3 text-gray-700 text-xs font-medium">{pembeli}</td>
                          <td className="px-4 py-3 text-gray-700 text-xs">{kasir}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-xs">{metode}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{formatRp(subtotal)}</td>
                          <td className="px-4 py-3 text-red-500 text-xs">{diskon > 0 ? `-${formatRp(diskon)}` : '-'}</td>
                          <td className="px-4 py-3 font-semibold text-gray-800">{formatRp(total)}</td>
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
                                      <tr key={i} className="border-t border-emerald-100">
                                        <td className="py-1 text-gray-700 font-medium">{prodName}</td>
                                        <td className="py-1 text-gray-600">{qty}x</td>
                                        <td className="py-1 text-gray-600">{formatRp(basePrice)}</td>
                                        <td className="py-1 font-semibold text-gray-800">{formatRp(itemSubtotal)}</td>
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