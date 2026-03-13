import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'

export default function TrendReportPage() {
  const [activeTab, setActiveTab] = useState('product')
  const [year, setYear] = useState(new Date().getFullYear())
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedID, setSelectedID] = useState('')
  const [statMode, setStatMode] = useState('qty') // qty | nota | omzet
  const [showStatDropdown, setShowStatDropdown] = useState(false)
  const [trendData, setTrendData] = useState(null)
  const [salesData, setSalesData] = useState([])
  const [loading, setLoading] = useState(false)

  // Load produk & kategori saat mount
  useEffect(() => {
    api.get('/products').then(r => {
      const list = r.data.data || []
      setProducts(list)
      if (list.length > 0) setSelectedID(String(list[0].ID || list[0].id))
    })
    api.get('/categories').then(r => {
      setCategories(r.data.data || [])
    })
  }, [])

  // Reset selectedID saat ganti tab
  useEffect(() => {
    if (activeTab === 'product' && products.length > 0) {
      setSelectedID(String(products[0].ID || products[0].id))
    } else if (activeTab === 'category' && categories.length > 0) {
      setSelectedID(String(categories[0].ID || categories[0].id))
    }
  }, [activeTab])

  // Fetch data saat year / selectedID / activeTab berubah
  useEffect(() => {
    if (!selectedID) return
    fetchData()
  }, [year, selectedID, activeTab])

  // Di fetchData, setelah set data:
  const fetchData = async () => {
    setLoading(true)
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    try {
      const [trendRes, salesRes] = await Promise.all([
        api.get(`/reports/trend?start_date=${startDate}&end_date=${endDate}`),
        // Ganti dari /reports/sales ke /sales biasa
        api.get(`/sales?start_date=${startDate}&end_date=${endDate}`),
      ])
      setTrendData(trendRes.data.data)

      // /sales return array langsung, bukan object
      const sales = Array.isArray(salesRes.data.data)
        ? salesRes.data.data
        : salesRes.data.data?.sales || []
      setSalesData(sales)

      // DEBUG - hapus setelah data muncul
      console.log('Sales count:', sales.length)
      console.log('Sample sale:', JSON.stringify(sales[0], null, 2))

    } catch (err) { console.error('Error:', err) }
    finally { setLoading(false) }
  }

  const formatRp = (val) => `Rp ${Number(val || 0).toLocaleString('id-ID')}`
  const fmt2 = (val) => Number(val || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  // ── Nama item yang dipilih ──
  const selectedName = activeTab === 'product'
    ? products.find(p => String(p.ID || p.id) === selectedID)?.Name || products.find(p => String(p.ID || p.id) === selectedID)?.name || ''
    : categories.find(c => String(c.ID || c.id) === selectedID)?.Name || categories.find(c => String(c.ID || c.id) === selectedID)?.name || ''

  // ── Filter sales berdasarkan produk/kategori yang dipilih ──
  const getFilteredSales = () => {
    if (!salesData.length || !selectedID) return []
    return salesData.filter(sale => {
      const items = sale.Items || sale.items || []
      return items.some(item => {
        if (activeTab === 'product') {
          const pid = String(item.ProductID || item.product_id || item.Product?.ID || item.product?.id || '')
          return pid === selectedID
        } else {
          // Cek CategoryID dari berbagai kemungkinan field name
          const product = item.Product || item.product || {}
          const catID = String(
            product.CategoryID ||
            product.category_id ||
            product.Category?.ID ||
            product.category?.id ||
            ''
          )
          return catID === selectedID
        }
      })
    })
  }

  // ── Hitung label minggu ISO ──
  const getWeekStart = (dateStr) => {
    const d = new Date(dateStr)
    const day = d.getDay()
    const diff = (day === 0 ? -6 : 1 - day)
    const mon = new Date(d)
    mon.setDate(d.getDate() + diff)
    return mon
  }

  const getWeekKey = (dateStr) => getWeekStart(dateStr).toISOString().split('T')[0]

  const fmtShort = (d) => d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })
  const fmtMonth = (d) => d.toLocaleDateString('id-ID', { month: 'short' })

  const getWeekLabel = (dateStr) => {
    const mon = getWeekStart(dateStr)
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
    const monthLabel = fmtMonth(mon)
    return `${monthLabel} (${fmtShort(mon)}-${fmtShort(sun)})`
  }

  // ── Hasilkan semua minggu dalam setahun ──
  const getAllWeeksOfYear = () => {
    const weeks = {}
    const start = new Date(`${year}-01-01`)
    const end = new Date(`${year}-12-31`)
    // Mulai dari Senin pertama sebelum/pada 1 Jan
    const cur = getWeekStart(start.toISOString().split('T')[0])
    while (cur <= end) {
      const key = cur.toISOString().split('T')[0]
      const label = getWeekLabel(cur.toISOString().split('T')[0])
      weeks[key] = { key, label, nota: 0, qty: 0, omzet: 0 }
      cur.setDate(cur.getDate() + 7)
    }
    return weeks
  }

  // ── Statistik per minggu ──
  const getWeeklyStats = () => {
    const filteredSales = getFilteredSales()
    const weekMap = getAllWeeksOfYear()

    filteredSales.forEach(sale => {
      const dateStr = (sale.CreatedAt || sale.created_at || '').split('T')[0]
      if (!dateStr) return
      const key = getWeekKey(dateStr)
      if (!weekMap[key]) return
      weekMap[key].nota += 1
      weekMap[key].omzet += sale.GrandTotal || sale.grand_total || 0
      ;(sale.Items || sale.items || []).forEach(item => {
        if (activeTab === 'product' && String(item.ProductID || item.product_id) === selectedID) {
          weekMap[key].qty += item.Quantity || item.quantity || 0
        } else if (activeTab === 'category') {
          const product = item.Product || item.product || {}
          const catID = String(product.CategoryID || product.category_id || product.Category?.ID || product.category?.id || '')
          if (catID === selectedID) weekMap[key].qty += item.Quantity || item.quantity || 0
        }
      })
    })
    return Object.values(weekMap).sort((a, b) => a.key.localeCompare(b.key))
  }

  // ── Analisis per hari ──
  const getDailyAvg = () => {
    const filteredSales = getFilteredSales()
    const DAY_LABELS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
    const dayStats = {}
    const dayCounts = {}
    filteredSales.forEach(sale => {
      const d = new Date(sale.CreatedAt || sale.created_at || '')
      const raw = d.getDay() // 0=Sun
      const day = raw === 0 ? 6 : raw - 1 // 0=Mon..6=Sun
      const dateKey = (sale.CreatedAt || sale.created_at || '').split('T')[0]
      if (!dayStats[day]) { dayStats[day] = { nota: 0, qty: 0, omzet: 0 }; dayCounts[day] = new Set() }
      dayStats[day].nota += 1
      dayStats[day].omzet += sale.GrandTotal || sale.grand_total || 0
      ;(sale.Items || sale.items || []).forEach(item => {
        if (activeTab === 'product' && String(item.ProductID || item.product_id) === selectedID) {
          dayStats[day].qty += item.Quantity || item.quantity || 0
        } else if (activeTab === 'category') {
          const product = item.Product || item.product || {}
          const catID = String(product.CategoryID || product.category_id || product.Category?.ID || product.category?.id || '')
          if (catID === selectedID) dayStats[day].qty += item.Quantity || item.quantity || 0
        }
      })
      dayCounts[day].add(dateKey)
    })
    return DAY_LABELS.map((label, i) => {
      const s = dayStats[i] || { nota: 0, qty: 0, omzet: 0 }
      const u = dayCounts[i]?.size || 1
      return {
        day: label,
        avgNota: +(s.nota / u).toFixed(2),
        avgQty: +(s.qty / u).toFixed(2),
        avgOmzet: Math.round(s.omzet / u),
      }
    })
  }

  // ── Analisis per jam ──
  const getHourlyStats = () => {
    const filteredSales = getFilteredSales()
    const hourMap = {}
    filteredSales.forEach(sale => {
      const d = new Date(sale.CreatedAt || sale.created_at || '')
      const hour = d.getHours()
      if (!hourMap[hour]) hourMap[hour] = { hour, nota: 0, qty: 0, omzet: 0 }
      hourMap[hour].nota += 1
      hourMap[hour].omzet += sale.GrandTotal || sale.grand_total || 0
      ;(sale.Items || sale.items || []).forEach(item => {
        if (activeTab === 'product' && String(item.ProductID || item.product_id) === selectedID) {
          hourMap[hour].qty += item.Quantity || item.quantity || 0
        } else if (activeTab === 'category') {
          const product = item.Product || item.product || {}
          const catID = String(product.CategoryID || product.category_id || product.Category?.ID || product.category?.id || '')
          if (catID === selectedID) hourMap[hour].qty += item.Quantity || item.quantity || 0
        }
      })
    })
    return Array.from({ length: 24 }, (_, h) => ({
      hour: `${String(h).padStart(2, '0')}`,
      label: `${String(h).padStart(2, '0')}:00`,
      nota: hourMap[h]?.nota || 0,
      qty: hourMap[h]?.qty || 0,
      omzet: hourMap[h]?.omzet || 0,
      avgQty: hourMap[h] ? +(hourMap[h].qty / (hourMap[h].nota || 1)).toFixed(2) : 0,
    }))
  }

  // ── Rata-rata keseluruhan ──
  const getOverallAvg = () => {
    const filteredSales = getFilteredSales()
    if (!filteredSales.length) return null
    const totalNota = filteredSales.length
    let totalQty = 0
    filteredSales.forEach(sale => {
      ;(sale.Items || sale.items || []).forEach(item => {
        if (activeTab === 'product' && String(item.ProductID || item.product_id) === selectedID) {
          totalQty += item.Quantity || item.quantity || 0
        } else if (activeTab === 'category') {
          const product = item.Product || item.product || {}
          const catID = String(product.CategoryID || product.category_id || product.Category?.ID || product.category?.id || '')
          if (catID === selectedID) totalQty += item.Quantity || item.quantity || 0
        }
      })
    })
    const totalOmzet = filteredSales.reduce((s, sale) => s + (sale.GrandTotal || sale.grand_total || 0), 0)
    const uniqueDays = new Set(filteredSales.map(s => (s.CreatedAt || s.created_at || '').split('T')[0])).size || 1
    return {
      totalNota, totalQty, totalOmzet,
      avgNota: +(totalNota / uniqueDays).toFixed(2),
      avgQty: +(totalQty / uniqueDays).toFixed(2),
      avgOmzet: Math.round(totalOmzet / uniqueDays),
      qtyPerNota: +(totalQty / totalNota).toFixed(2),
      omzetPerNota: Math.round(totalOmzet / totalNota),
      omzetPerQty: totalQty > 0 ? Math.round(totalOmzet / totalQty) : 0,
    }
  }

  const weeklyStats = getWeeklyStats()
  const dailyAvg = getDailyAvg()
  const hourlyStats = getHourlyStats()
  const overallAvg = getOverallAvg()

  const statModeOptions = [
    { key: 'qty', label: 'Statistik berdasarkan Qty' },
    { key: 'nota', label: 'Statistik berdasarkan Nota' },
    { key: 'omzet', label: 'Statistik berdasarkan Omzet' },
  ]

  const getStatValue = (row) => {
    if (statMode === 'qty') return row.qty ?? row.avgQty ?? 0
    if (statMode === 'nota') return row.nota ?? row.avgNota ?? 0
    return row.omzet ?? row.avgOmzet ?? 0
  }

  const getStatLabel = (val) => {
    if (statMode === 'omzet') return formatRp(val)
    return Number(val).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  // ── Chart data ──
  const weeklyChartData = weeklyStats.map(w => ({
    name: w.label.replace(/\(.*?\)/, '').trim(),
    value: getStatValue(w),
    fullLabel: w.label,
  }))

  const dailyChartData = dailyAvg.map(d => ({
    day: d.day,
    value: getStatValue({ qty: d.avgQty, nota: d.avgNota, omzet: d.avgOmzet }),
  }))

  const hourlyChartData = hourlyStats.map(h => ({
    hour: h.hour,
    value: getStatValue({ qty: h.avgQty, nota: h.nota, omzet: h.omzet }),
  }))

  // ── Export Excel ──
  const exportExcel = async () => {
    const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs')
    const wb = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['No', 'Minggu', 'N (Nota)', 'Q (Qty)', 'Omzet'],
      ...weeklyStats.map((w, i) => [i + 1, w.label, w.nota, w.qty, w.omzet]),
      ['', 'Total', weeklyStats.reduce((s, w) => s + w.nota, 0), weeklyStats.reduce((s, w) => s + w.qty, 0), weeklyStats.reduce((s, w) => s + w.omzet, 0)]
    ]), 'Per Minggu')

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Hari', 'Avg Nota', 'Avg Qty', 'Avg Omzet'],
      ...dailyAvg.map(d => [d.day, d.avgNota, d.avgQty, d.avgOmzet])
    ]), 'Per Hari')

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Jam', 'Nota', 'Qty', 'Omzet'],
      ...hourlyStats.filter(h => h.nota > 0).map(h => [h.label, h.nota, h.qty, h.omzet])
    ]), 'Per Jam')

    if (overallAvg) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ['Metrik', 'Nilai'],
        ['Rata-rata Nota', overallAvg.avgNota],
        ['Rata-rata Qty', overallAvg.avgQty],
        ['Rata-rata Omzet', overallAvg.avgOmzet],
        ['Qty/Nota', overallAvg.qtyPerNota],
        ['Omzet/Nota', overallAvg.omzetPerNota],
        ['Omzet/Qty', overallAvg.omzetPerQty],
      ]), 'Rata-rata')
    }

    XLSX.writeFile(wb, `Trend-${selectedName}-${year}.xlsx`)
  }

  // ── Export PDF ──
  const exportPDF = () => {
    const totalN = weeklyStats.reduce((s, w) => s + w.nota, 0)
    const totalQ = weeklyStats.reduce((s, w) => s + w.qty, 0)
    const totalO = weeklyStats.reduce((s, w) => s + w.omzet, 0)

    const html = `<!DOCTYPE html><html><head>
    <meta charset="utf-8"><title>Trend Penjualan - ${selectedName} ${year}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:Arial,sans-serif;font-size:11px;color:#222;padding:24px}
      h1{font-size:15px;font-weight:bold;margin-bottom:2px}
      .sub{color:#666;font-size:10px;margin-bottom:14px}
      .sec{font-size:12px;font-weight:bold;margin:14px 0 6px;border-bottom:1px solid #e5e7eb;padding-bottom:4px}
      table{width:100%;border-collapse:collapse;margin-bottom:14px}
      th{background:#f3f4f6;text-align:left;padding:6px 8px;font-size:9px;text-transform:uppercase;color:#6b7280;border-bottom:1px solid #e5e7eb}
      td{padding:6px 8px;border-bottom:1px solid #f3f4f6;font-size:10px}
      tfoot td{font-weight:bold;background:#f9fafb;border-top:2px solid #e5e7eb}
      .avg-list{margin-bottom:14px}
      .avg-row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f3f4f6;font-size:10px}
      .avg-row .lbl{color:#6b7280}
    </style></head><body>
    <h1>Trend Penjualan — ${selectedName}</h1>
    <p class="sub">Tahun ${year} | ${activeTab === 'product' ? 'Per Produk' : 'Per Kategori'}</p>

    <div class="sec">Detail Per Minggu</div>
    <table>
      <thead><tr><th>No</th><th>Minggu</th><th>N</th><th>Q</th><th>Omzet</th></tr></thead>
      <tbody>${weeklyStats.map((w, i) => `<tr><td>${i + 1}</td><td>${w.label}</td><td>${w.nota}</td><td>${w.qty}</td><td>${formatRp(w.omzet)}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td colspan="2">Total</td><td>${totalN}</td><td>${totalQ}</td><td>${formatRp(totalO)}</td></tr></tfoot>
    </table>

    <div class="sec">Analisis Per Hari (Rata-rata)</div>
    <table>
      <thead><tr><th>Hari</th><th>Avg Nota</th><th>Avg Qty</th><th>Avg Omzet</th></tr></thead>
      <tbody>${dailyAvg.map(d => `<tr><td>${d.day}</td><td>${fmt2(d.avgNota)}</td><td>${fmt2(d.avgQty)}</td><td>${formatRp(d.avgOmzet)}</td></tr>`).join('')}</tbody>
    </table>

    <div class="sec">Analisis Per Jam</div>
    <table>
      <thead><tr><th>Jam</th><th>Nota</th><th>Qty</th><th>Omzet</th></tr></thead>
      <tbody>${hourlyStats.filter(h => h.nota > 0).map(h => `<tr><td>${h.label}</td><td>${h.nota}</td><td>${h.qty}</td><td>${formatRp(h.omzet)}</td></tr>`).join('')}</tbody>
    </table>

    ${overallAvg ? `
    <div class="sec">1 Januari ${year} - 31 Desember ${year}</div>
    <div class="avg-list">
      <div class="avg-row"><span class="lbl">Rata-rata Nota</span><span>${fmt2(overallAvg.avgNota)}</span></div>
      <div class="avg-row"><span class="lbl">Rata-rata Qty</span><span>${fmt2(overallAvg.avgQty)}</span></div>
      <div class="avg-row"><span class="lbl">Rata-rata Omzet</span><span>${formatRp(overallAvg.avgOmzet)}</span></div>
      <div class="avg-row"><span class="lbl">Rata-rata Qty/Nota</span><span>${fmt2(overallAvg.qtyPerNota)}</span></div>
      <div class="avg-row"><span class="lbl">Rata-rata Omzet/Nota</span><span>${formatRp(overallAvg.omzetPerNota)}</span></div>
      <div class="avg-row"><span class="lbl">Rata-rata Omzet/Qty</span><span>${formatRp(overallAvg.omzetPerQty)}</span></div>
    </div>` : ''}
    </body></html>`

    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 500)
  }

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-2 shadow text-xs">
        <p className="font-semibold">{payload[0]?.payload?.fullLabel || payload[0]?.payload?.day || payload[0]?.payload?.hour}</p>
        <p className="text-emerald-600">{statMode === 'omzet' ? formatRp(payload[0].value) : payload[0].value}</p>
      </div>
    )
  }

  return (
    <Layout title="Trend Penjualan">
      <div className="max-w-5xl mx-auto">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Trend Penjualan</h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm">Analisis tren penjualan per produk atau kategori</p>
        </div>

        {/* Tab */}
        <div className="flex gap-0 mb-5 border-b border-gray-200 dark:border-zinc-700">
          {[
            { key: 'product', label: 'Per Produk' },
            { key: 'category', label: 'Per Kategori' },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-6 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${activeTab === t.key ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Dropdown pilih produk/kategori + Export */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">
              Pilih {activeTab === 'product' ? 'Produk' : 'Produk Kategori'}:
            </p>
            <select
              value={selectedID}
              onChange={e => setSelectedID(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 min-w-48"
            >
              {(activeTab === 'product' ? products : categories).map(item => (
                <option key={item.ID || item.id} value={String(item.ID || item.id)}>
                  {item.Name || item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={exportPDF} className="w-9 h-9 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-lg transition" title="Export PDF">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 14h1.8c.9 0 1.5.5 1.5 1.3 0 .9-.6 1.4-1.6 1.4H9.4v1.3H8.5V14zm.9.7v1.3h.8c.5 0 .7-.2.7-.6 0-.5-.3-.7-.8-.7h-.7zm3.1-.7h1.6c1.1 0 1.8.7 1.8 1.9 0 1.3-.7 2.1-1.9 2.1h-1.5V14zm.9.7v2.5h.6c.7 0 1-.4 1-1.3 0-.8-.3-1.2-1-1.2h-.6zm3.6 0v1h1.4v.7H17v1.6h-.9V14H19v.7h-1.5z"/></svg>
            </button>
            <button onClick={exportExcel} className="w-9 h-9 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition" title="Export Excel">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM7 14.5l1.5 2.5L7 19.5h1l1-1.8 1 1.8h1l-1.5-2.5 1.5-2.5h-1l-1 1.8-1-1.8H7zm5 0v5h3.3c.9 0 1.4-.5 1.4-1.2 0-.5-.3-.9-.7-1 .3-.2.5-.5.5-.9 0-.7-.5-1.1-1.3-1.1H12v.2zm.9.6h1c.4 0 .6.2.6.5s-.2.5-.6.5h-1v-1zm0 1.8h1.1c.4 0 .6.2.6.5s-.2.5-.6.5H12.9V17z"/></svg>
            </button>
          </div>
        </div>

        {/* Navigasi Tahun */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 mb-4 flex items-center justify-between px-4 py-2">
          <button onClick={() => setYear(y => y - 1)} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="font-semibold text-gray-800 dark:text-white">{year}</span>
          <button onClick={() => setYear(y => y + 1)} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        {/* Dropdown Statistik */}
        <div className="relative mb-4 inline-block">
          <button
            onClick={() => setShowStatDropdown(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition"
          >
            {statModeOptions.find(o => o.key === statMode)?.label}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {showStatDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-48">
              {statModeOptions.map(opt => (
                <button key={opt.key} onClick={() => { setStatMode(opt.key); setShowStatDropdown(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition ${statMode === opt.key ? 'text-emerald-600 font-medium' : 'text-gray-700'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <>
            {/* Chart Total Per Minggu */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-zinc-700 mb-4 overflow-hidden">
              <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2.5">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Total {statMode === 'qty' ? 'Qty' : statMode === 'nota' ? 'Nota' : 'Omzet'} Per Minggu
                </p>
              </div>
              <div className="p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={1} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#10b981" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart Analisis Per Hari */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-zinc-700 mb-4 overflow-hidden">
              <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2.5">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Analisis Perhari - Rata-rata {statMode === 'qty' ? 'Qty' : statMode === 'nota' ? 'Nota' : 'Omzet'}
                </p>
              </div>
              <div className="p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dailyChartData} margin={{ top: 15, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#10b981" radius={[2, 2, 0, 0]}
                      label={{ position: 'top', fontSize: 9, formatter: (v) => Number(v).toFixed(2) }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart Analisis Per Jam */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-zinc-700 mb-4 overflow-hidden">
              <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2.5">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Analisis Perjam - Rata-rata {statMode === 'qty' ? 'Qty' : statMode === 'nota' ? 'Nota' : 'Omzet'}
                </p>
              </div>
              <div className="p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={hourlyChartData} margin={{ top: 15, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="hour" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#10b981" radius={[2, 2, 0, 0]}
                      label={{ position: 'top', fontSize: 8, formatter: (v) => v > 0 ? Number(v).toFixed(2) : '' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tabel Detail Per Minggu */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-zinc-700 mb-4 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-700">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Detail</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['No.', 'Minggu', 'N', 'Q', 'Omzet'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-zinc-400 dark:text-zinc-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {weeklyStats.map((w, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-zinc-400 dark:text-zinc-500">{idx + 1}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-700">{w.label}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-700">{w.nota}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-700">{w.qty}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-700">{formatRp(w.omzet)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                      <td colSpan={2} className="px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-zinc-400 dark:text-zinc-500">Total</td>
                      <td className="px-4 py-2.5 text-xs font-bold text-gray-800 dark:text-white">{weeklyStats.reduce((s, w) => s + w.nota, 0)}</td>
                      <td className="px-4 py-2.5 text-xs font-bold text-gray-800 dark:text-white">{weeklyStats.reduce((s, w) => s + w.qty, 0)}</td>
                      <td className="px-4 py-2.5 text-xs font-bold text-gray-800 dark:text-white">{formatRp(weeklyStats.reduce((s, w) => s + w.omzet, 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Rata-rata Keseluruhan */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-zinc-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-700">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 text-center">
                  1 Januari {year} - 31 Desember {year}
                </p>
              </div>
              <div className="divide-y divide-gray-50">
                {[
                  { label: 'Rata-rata Nota', value: overallAvg ? fmt2(overallAvg.avgNota) : '0,00' },
                  { label: 'Rata-rata Qty', value: overallAvg ? fmt2(overallAvg.avgQty) : '0,00' },
                  { label: 'Rata-rata Omzet', value: overallAvg ? formatRp(overallAvg.avgOmzet) : 'Rp 0' },
                  { label: 'Rata-rata Qty/Nota', value: overallAvg ? fmt2(overallAvg.qtyPerNota) : '0,00' },
                  { label: 'Rata-rata Omzet/Nota', value: overallAvg ? formatRp(overallAvg.omzetPerNota) : 'Rp 0' },
                  { label: 'Rata-rata Omzet/Qty', value: overallAvg ? formatRp(overallAvg.omzetPerQty) : 'Rp 0' },
                ].map(m => (
                  <div key={m.label} className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-sm text-gray-600 dark:text-zinc-400 dark:text-zinc-500">{m.label}</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}