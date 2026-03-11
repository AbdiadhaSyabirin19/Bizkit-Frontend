import { useState, useEffect } from 'react'
import KasirLayout from '../../components/KasirLayout'
import api from '../../api/axios'

const formatRp = (v) => `Rp ${Number(v || 0).toLocaleString('id-ID')}`
const formatTime = (v) => v ? new Date(v).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'
const formatDate = (v) => v ? new Date(v).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'

export default function KasirDashboardPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [data, setData] = useState(null)
  const [yesterday, setYesterday] = useState(null)
  const [shift, setShift] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [date])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const yDate = new Date(date)
      yDate.setDate(yDate.getDate() - 1)
      const yStr = yDate.toISOString().split('T')[0]

      const [todayRes, yRes, shiftRes] = await Promise.allSettled([
        api.get(`/sales/daily?date=${date}`),
        api.get(`/sales/daily?date=${yStr}`),
        api.get(`/shifts/active`),
      ])

      if (todayRes.status === 'fulfilled') setData(todayRes.value.data.data)
      if (yRes.status === 'fulfilled') setYesterday(yRes.value.data.data)
      if (shiftRes.status === 'fulfilled') setShift(shiftRes.value.data.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const prevDay = () => { const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d.toISOString().split('T')[0]) }
  const nextDay = () => { const d = new Date(date); d.setDate(d.getDate() + 1); setDate(d.toISOString().split('T')[0]) }
  const isToday = date === new Date().toISOString().split('T')[0]

  // Hitung top produk
  const topProducts = (() => {
    if (!data?.sales) return []
    const map = {}
    data.sales.forEach(sale => {
      sale.items?.forEach(item => {
        const name = item.product?.name || item.product?.Name || '-'
        if (!map[name]) map[name] = { name, qty: 0, omzet: 0 }
        map[name].qty += item.quantity || item.Quantity || 0
        map[name].omzet += item.subtotal || item.Subtotal || 0
      })
    })
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 5)
  })()

  // Grafik transaksi per jam (00-23)
  const hourlyChart = (() => {
    const hours = Array(24).fill(0).map((_, h) => ({ hour: h, count: 0, omzet: 0 }))
    if (!data?.sales) return hours
    data.sales.forEach(sale => {
      const h = new Date(sale.created_at || sale.CreatedAt).getHours()
      if (!isNaN(h)) {
        hours[h].count += 1
        hours[h].omzet += sale.grand_total || sale.GrandTotal || 0
      }
    })
    return hours
  })()

  const peakHours = [...hourlyChart].sort((a, b) => b.count - a.count).slice(0, 3).filter(h => h.count > 0)
  const maxCount  = Math.max(...hourlyChart.map(h => h.count), 1)
  const maxOmzet  = Math.max(...hourlyChart.map(h => h.omzet), 1)

  // Perbandingan vs kemarin
  const omzetToday     = data?.total_omzet || 0
  const omzetYesterday = yesterday?.total_omzet || 0
  const omzetDiff      = omzetYesterday > 0 ? ((omzetToday - omzetYesterday) / omzetYesterday * 100).toFixed(1) : null
  const trxToday       = data?.total_transaksi || 0
  const trxYesterday   = yesterday?.total_transaksi || 0
  const trxDiff        = trxYesterday > 0 ? ((trxToday - trxYesterday) / trxYesterday * 100).toFixed(1) : null

  const DiffBadge = ({ diff }) => {
    if (diff === null) return null
    const up = Number(diff) >= 0
    return (
      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-lg ${up ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
        {up ? '↑' : '↓'} {Math.abs(diff)}%
      </span>
    )
  }

  const summaryCards = [
    {
      label: 'Total Transaksi',
      value: trxToday,
      yesterday: trxYesterday,
      diff: trxDiff,
      icon: '🧾',
      color: 'bg-blue-50',
      iconBg: 'bg-blue-100',
    },
    {
      label: 'Total Omzet',
      value: formatRp(omzetToday),
      yesterday: formatRp(omzetYesterday),
      diff: omzetDiff,
      icon: '💰',
      color: 'bg-emerald-50',
      iconBg: 'bg-emerald-100',
    },
    {
      label: 'Total Item Terjual',
      value: data?.total_qty || 0,
      yesterday: yesterday?.total_qty || 0,
      diff: (yesterday?.total_qty || 0) > 0
        ? (((data?.total_qty || 0) - (yesterday?.total_qty || 0)) / yesterday.total_qty * 100).toFixed(1)
        : null,
      icon: '📦',
      color: 'bg-orange-50',
      iconBg: 'bg-orange-100',
    },
  ]

  return (
    <KasirLayout title="Dashboard Kasir">
      <div className="max-w-6xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Dashboard Kasir</h1>
            <p className="text-gray-500 text-sm">Ringkasan performa penjualan</p>
          </div>

          {/* Date navigator */}
          <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2 shadow-sm">
            <button onClick={prevDay} className="p-1 hover:bg-gray-100 rounded-lg transition">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="text-sm text-gray-700 font-medium focus:outline-none cursor-pointer" />
            <button onClick={nextDay} disabled={isToday} className="p-1 hover:bg-gray-100 rounded-lg transition disabled:opacity-30">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
          </div>
        ) : (
          <div className="space-y-5">

            {/* ── Info Shift Aktif ── */}
            {shift && (
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl p-4 text-white flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">⏰</div>
                  <div>
                    <p className="font-semibold text-sm">Shift Aktif</p>
                    <p className="text-emerald-100 text-xs">Mulai: {formatTime(shift.start_time || shift.StartTime)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <p className="text-emerald-100 text-xs">Kasir</p>
                    <p className="font-semibold">{shift.user?.Name || shift.User?.Name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-emerald-100 text-xs">Outlet</p>
                    <p className="font-semibold">{shift.outlet?.Name || shift.Outlet?.Name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-emerald-100 text-xs">Modal Awal</p>
                    <p className="font-semibold">{formatRp(shift.opening_cash || shift.OpeningCash)}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">● Berlangsung</span>
              </div>
            )}

            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {summaryCards.map(card => (
                <div key={card.label} className={`${card.color} rounded-2xl p-4`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center text-lg`}>
                      {card.icon}
                    </div>
                    <DiffBadge diff={card.diff} />
                  </div>
                  <p className="text-gray-500 text-xs mb-1">{card.label}</p>
                  <p className="text-xl font-bold text-gray-800">{card.value}</p>
                  <p className="text-xs text-gray-400 mt-1">Kemarin: {card.yesterday}</p>
                </div>
              ))}
            </div>

            {/* ── Grafik Transaksi Per Jam ── */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h2 className="font-semibold text-gray-800">Grafik Transaksi per Jam</h2>
                  <p className="text-xs text-gray-400">{formatDate(date)}</p>
                </div>
                {peakHours.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-gray-400">Jam tersibuk:</p>
                    {peakHours.map(h => (
                      <span key={h.hour} className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold">
                        {String(h.hour).padStart(2, '0')}:00 ({h.count}x)
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bar chart */}
              <div className="overflow-x-auto">
                <div className="flex items-end gap-1 min-w-[600px] h-32">
                  {hourlyChart.map(h => {
                    const heightPct = h.count > 0 ? Math.max(8, (h.count / maxCount) * 100) : 0
                    const isNow = isToday && new Date().getHours() === h.hour
                    return (
                      <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 group relative">
                        {/* Tooltip */}
                        {h.count > 0 && (
                          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                            {h.count}x · {formatRp(h.omzet)}
                          </div>
                        )}
                        <div className="w-full flex items-end" style={{ height: '100px' }}>
                          <div
                            className={`w-full rounded-t-md transition-all ${
                              isNow ? 'bg-emerald-500' : h.count > 0 ? 'bg-emerald-300 group-hover:bg-emerald-400' : 'bg-gray-100'
                            }`}
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                        <span className={`text-xs ${isNow ? 'text-emerald-600 font-bold' : 'text-gray-400'}`}>
                          {String(h.hour).padStart(2, '0')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Omzet per jam (mini bar) */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-2">Omzet per jam</p>
                <div className="overflow-x-auto">
                  <div className="flex items-end gap-1 min-w-[600px] h-10">
                    {hourlyChart.map(h => {
                      const heightPct = h.omzet > 0 ? Math.max(8, (h.omzet / maxOmzet) * 100) : 0
                      return (
                        <div key={h.hour} className="flex-1 flex items-end" style={{ height: '40px' }}>
                          <div
                            className="w-full rounded-t-sm bg-blue-200 hover:bg-blue-400 transition"
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Bawah: Produk Terlaris + Metode Bayar ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Produk terlaris */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-800">Produk Terlaris</h2>
                  <p className="text-xs text-gray-400">Berdasarkan qty terjual</p>
                </div>
                {topProducts.length === 0 ? (
                  <div className="px-5 py-10 text-center text-gray-400 text-sm">Belum ada data</div>
                ) : (
                  <div className="p-5 space-y-3">
                    {topProducts.map((p, idx) => {
                      const maxQty = topProducts[0]?.qty || 1
                      const pct = Math.round((p.qty / maxQty) * 100)
                      const colors = ['bg-emerald-500', 'bg-blue-400', 'bg-purple-400', 'bg-orange-400', 'bg-pink-400']
                      return (
                        <div key={p.name}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center font-bold">
                                {idx + 1}
                              </span>
                              <span className="text-sm text-gray-700 font-medium">{p.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-400">{p.qty} qty</span>
                              <span className="text-xs font-semibold text-gray-700 w-24 text-right">{formatRp(p.omzet)}</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className={`${colors[idx % colors.length]} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Metode pembayaran */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-800">Metode Pembayaran</h2>
                  <p className="text-xs text-gray-400">Distribusi pembayaran hari ini</p>
                </div>
                {(() => {
                  const kasMap = {}
                  ;(data?.sales || []).forEach(sale => {
                    const method = sale.payment_method?.name
                      || sale.payment_method?.Name
                      || sale.PaymentMethod?.name
                      || sale.PaymentMethod?.Name
                      || 'Tunai'
                    if (!kasMap[method]) kasMap[method] = { method, masuk: 0, transaksi: 0 }
                    kasMap[method].masuk += sale.grand_total || sale.GrandTotal || 0
                    kasMap[method].transaksi += 1
                  })
                  const list = Object.values(kasMap)
                  const total = list.reduce((s, k) => s + k.masuk, 0)
                  const colors = ['bg-emerald-400', 'bg-blue-400', 'bg-purple-400', 'bg-orange-400', 'bg-pink-400']

                  if (list.length === 0) return (
                    <div className="px-5 py-10 text-center text-gray-400 text-sm">Belum ada data</div>
                  )

                  return (
                    <div className="p-5 space-y-3">
                      {list.map((k, idx) => {
                        const pct = total > 0 ? Math.round((k.masuk / total) * 100) : 0
                        return (
                          <div key={k.method}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${colors[idx % colors.length]}`} />
                                <span className="text-sm text-gray-700 font-medium">{k.method}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-400">{k.transaksi}x · {pct}%</span>
                                <span className="text-xs font-semibold text-gray-700 w-28 text-right">{formatRp(k.masuk)}</span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div className={`${colors[idx % colors.length]} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )
                      })}
                      <div className="pt-2 border-t border-gray-100 flex justify-between text-sm font-bold text-gray-700">
                        <span>Total</span>
                        <span className="text-emerald-600">{formatRp(total)}</span>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* ── 5 Transaksi Terakhir ── */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-800">Transaksi Terakhir</h2>
                  <p className="text-xs text-gray-400">5 transaksi terbaru hari ini</p>
                </div>
              </div>
              {(data?.sales?.length || 0) === 0 ? (
                <div className="px-5 py-10 text-center text-gray-400 text-sm">
                  <p className="text-3xl mb-2">📭</p>
                  <p>Belum ada transaksi {isToday ? 'hari ini' : 'pada tanggal ini'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Invoice', 'Waktu', 'Kasir', 'Metode', 'Total'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {[...(data?.sales || [])].reverse().slice(0, 5).map((sale, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {sale.invoice_number || sale.InvoiceNumber}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {formatTime(sale.created_at || sale.CreatedAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-emerald-700 text-xs font-bold">
                                  {(sale.user?.Name || '-').charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-xs text-gray-700">{sale.user?.Name || '-'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-xs">
                              {sale.payment_method?.name || sale.payment_method?.Name || sale.PaymentMethod?.name || sale.PaymentMethod?.Name || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-800 text-sm">
                            {formatRp(sale.grand_total || sale.GrandTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </KasirLayout>
  )
}