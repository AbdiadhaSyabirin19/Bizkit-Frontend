import { useState, useEffect, useRef } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import Layout from '../../components/Layout'
import api from '../../api/axios'

// ── Helpers ─────────────────────────────────────────────────────────────────
const formatRpStr = (val) => {
  const num = Number(val || 0)
  return 'Rp ' + num.toLocaleString('id-ID')
}
const formatRp = (val) => {
  const num = Number(val || 0)
  return num.toLocaleString('id-ID')
}
const formatNum = (val, dec = 2) => {
  if (val === undefined || val === null) return '0'
  return Number(val).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: dec })
}
const formatTime = (val) => val ? new Date(val).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'
const formatDateTime = (val) => val ? new Date(val).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: 'numeric', month: 'long', year: 'numeric' }) : '-'
const formatDateShort = (val) => {
  if (!val) return '-'
  return new Date(val).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()
  const days = []
  for (let i = firstDay - 1; i >= 0; i--) days.push({ day: prevDays - i, current: false })
  for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, current: true })
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) days.push({ day: i, current: false })
  return days
}
function toDateStr(y, m, d) { return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` }
function getWeekRange(date) {
  const d = new Date(date); const day = d.getDay()
  const start = new Date(d); start.setDate(d.getDate() - (day === 0 ? 6 : day - 1)) // start Sen
  const end = new Date(start); end.setDate(start.getDate() + 6)
  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
}
function getMonthRange(date) {
  const d = new Date(date)
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
}
function getYearRange(y) { return { start: `${y}-01-01`, end: `${y}-12-31` } }

// ── Calendar Component ──────────────────────────────────────────────────────
function DualCalendar({ startDate, endDate, onApply, onCancel, mode }) {
  const today = new Date()
  const [leftMonth, setLeftMonth] = useState(today.getMonth())
  const [leftYear, setLeftYear] = useState(today.getFullYear())
  const [selStart, setSelStart] = useState(startDate)
  const [selEnd, setSelEnd] = useState(endDate)

  const rightMonth = leftMonth === 11 ? 0 : leftMonth + 1; const rightYear = leftMonth === 11 ? leftYear + 1 : leftYear
  const prevMonth = () => { if (leftMonth === 0) { setLeftMonth(11); setLeftYear(leftYear - 1) } else setLeftMonth(leftMonth - 1) }
  const nextMonth = () => { if (leftMonth === 11) { setLeftMonth(0); setLeftYear(leftYear + 1) } else setLeftMonth(leftMonth + 1) }

  const handleDayClick = (y, m, d) => {
    const ds = toDateStr(y, m, d)
    if (mode === 'daily') { setSelStart(ds); setSelEnd(ds) }
    else {
      if (!selStart || (selStart && selEnd && selStart !== selEnd)) { setSelStart(ds); setSelEnd(null) }
      else { if (ds < selStart) { setSelEnd(selStart); setSelStart(ds) } else setSelEnd(ds) }
    }
  }

  const isInRange = (y, m, d) => {
    if (!selStart) return false; const ds = toDateStr(y, m, d)
    if (!selEnd) return ds === selStart; return ds >= selStart && ds <= selEnd
  }
  const isStart = (y, m, d) => toDateStr(y, m, d) === selStart
  const isEnd = (y, m, d) => toDateStr(y, m, d) === (selEnd || selStart)

  const renderMonth = (year, month) => (
    <div className="w-[280px]">
      <div className="text-center font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">{MONTHS[month]} {year}</div>
      <div className="grid grid-cols-7 gap-0">
        {DAYS.map(d => <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>)}
        {getMonthDays(year, month).map((d, idx) => {
          const inRange = d.current && isInRange(year, month, d.day)
          const start = d.current && isStart(year, month, d.day)
          const end = d.current && isEnd(year, month, d.day)
          return (
            <button key={idx} onClick={() => d.current && handleDayClick(year, month, d.day)}
              className={`h-8 text-xs transition-all ${!d.current ? 'text-gray-300 dark:text-zinc-600' : 'text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'}
                ${inRange && !start && !end ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}
                ${start ? 'bg-emerald-500 text-white rounded-l-lg font-bold' : ''}
                ${end ? 'bg-emerald-500 text-white rounded-r-lg font-bold' : ''}
                ${start && end ? 'rounded-lg' : ''}`}
            >{d.day}</button>
          )
        })}
      </div>
    </div>
  )
  return (
    <div className="absolute top-full left-0 mt-2 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 p-5 z-50">
      <div className="flex items-start gap-6">
        <div className="flex items-center">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded transition mr-2">«</button>
          {renderMonth(leftYear, leftMonth)}
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded transition ml-2">»</button>
        </div>
      </div>
      <div className="flex justify-between mt-4 pt-3 border-t"><span className="text-xs text-gray-400">{selStart} - {selEnd || selStart}</span>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-4 py-1.5 text-xs text-gray-500">Cancel</button>
          <button onClick={() => onApply(selStart, selEnd || selStart)} className="px-5 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-semibold">Apply</button>
        </div>
      </div>
    </div>
  )
}

function DropdownPicker({ value, options, onChange, label = 'Bulan' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler)
  }, [])
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-sm hover:bg-gray-50 text-sm flex items-center gap-2">
        {options.find(o => o.value === value)?.label || value} <span className="text-xs">▼</span>
      </button>
      {open && (
        <div className="absolute top-full mt-1 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border overflow-hidden z-50 max-h-60 overflow-y-auto">
          {options.map(o => (
            <button key={o.value} onClick={() => { onChange(o.value); setOpen(false) }}
              className={`w-full text-left px-4 py-2 text-sm ${value === o.value ? 'bg-emerald-50 text-emerald-600 font-semibold' : 'hover:bg-gray-50 dark:hover:bg-zinc-700'}`}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function DailyReportPage() {
  const todayStr = new Date().toISOString().split('T')[0]

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [periodMode, setPeriodMode] = useState('daily') // daily, weekly, monthly, yearly, custom
  const [startDate, setStartDate] = useState(todayStr)
  const [endDate, setEndDate] = useState(todayStr)

  const [yearlyBreakdown, setYearlyBreakdown] = useState('monthly') // monthly / weekly (for yearly mode)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()) // 0-11
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const [showDropdown, setShowDropdown] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showCenterCalendar, setShowCenterCalendar] = useState(false)
  const [statsMode, setStatsMode] = useState('qty') // qty, nota, omzet
  const [showStatsDropdown, setShowStatsDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const statsDropdownRef = useRef(null)

  const periodLabels = { daily: 'Harian', weekly: 'Mingguan', monthly: 'Bulanan', yearly: 'Tahunan', custom: 'Custom Range' }
  const statsLabels = { qty: 'Statistik berdasarkan Qty', nota: 'Statistik berdasarkan Nota', omzet: 'Statistik berdasarkan Omzet' }
  const monthOptions = MONTHS.map((m, i) => ({ value: i, label: m }))
  const yearOptions = Array.from({ length: 10 }, (_, i) => ({ value: new Date().getFullYear() - 5 + i, label: String(new Date().getFullYear() - 5 + i) }))

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) { setShowDropdown(false); setShowCalendar(false) }
      if (statsDropdownRef.current && !statsDropdownRef.current.contains(e.target)) setShowStatsDropdown(false)
      // Hide center calendar if clicked outside (optional, but good practice)
      // We don't have a specific ref just for center calendar yet, but dual calendar clicks won't trigger if we don't handle it precisely.
      // Easiest is to let the user close it explicitly or attach a ref if needed. 
    }
    document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Sync dates based on month/year selectors if in monthly/yearly mode
  useEffect(() => {
    if (periodMode === 'monthly') {
      const start = new Date(selectedYear, selectedMonth, 1)
      const end = new Date(selectedYear, selectedMonth + 1, 0)
      setStartDate(start.toISOString().split('T')[0])
      setEndDate(end.toISOString().split('T')[0])
    } else if (periodMode === 'yearly') {
      setStartDate(`${selectedYear}-01-01`)
      setEndDate(`${selectedYear}-12-31`)
    }
  }, [selectedMonth, selectedYear, periodMode])

  useEffect(() => { fetchData() }, [startDate, endDate, periodMode, yearlyBreakdown])

  const fetchData = async () => {
    setLoading(true)
    try {
      const m = periodMode === 'custom' ? 'weekly' : periodMode
      const res = await api.get(`/reports/daily-advanced?start_date=${startDate}&end_date=${endDate}&mode=${m}&yearly_breakdown=${yearlyBreakdown}`)

      let fetchedData = res.data.data || {}

      // Override label untuk mode mingguan & bulanan di frontend agar langsung berubah
      if (m === 'weekly' || m === 'monthly') {
        const daysIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
        if (fetchedData.grouped_sales) {
          fetchedData.grouped_sales.forEach(g => {
            const d = new Date(g.date)
            g.label = daysIndo[d.getDay()] || g.label
          })
        }
        if (fetchedData.chart_trend) {
          // sesuaikan chart legend label juga mengikuti perubahan di grouped_sales
          fetchedData.chart_trend = (fetchedData.grouped_sales || []).map(g => ({
            label: g.label,
            value: g.q
          }))
        }
      } else if (m === 'yearly' && yearlyBreakdown === 'weekly') {
        const monthsStr = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
        if (fetchedData.grouped_sales) {
          fetchedData.grouped_sales.forEach(g => {
            // g.date is like "2026-W11"
            const [yStr, wStr] = g.date.split('-W')
            const yr = parseInt(yStr, 10)
            const wk = parseInt(wStr, 10)

            // Calculate start date of ISO week
            const simple = new Date(yr, 0, 1 + (wk - 1) * 7)
            const dow = simple.getDay()
            const ISOweekStart = simple
            if (dow <= 4)
              ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1)
            else
              ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay())

            const startD = new Date(ISOweekStart)
            const endD = new Date(startD)
            endD.setDate(startD.getDate() + 6)

            const monthName = monthsStr[startD.getMonth()]
            const sDay = String(startD.getDate()).padStart(2, '0')
            const sMonth = String(startD.getMonth() + 1).padStart(2, '0')
            const eDay = String(endD.getDate()).padStart(2, '0')
            const eMonth = String(endD.getMonth() + 1).padStart(2, '0')

            g.label = `${monthName} (${sDay}/${sMonth}-${eDay}/${eMonth})`
          })
        }
        if (fetchedData.chart_trend) {
          fetchedData.chart_trend = (fetchedData.grouped_sales || []).map(g => ({
            label: g.label,
            value: g.q
          }))
        }
      }

      setData(fetchedData)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handlePeriodSelect = (mode) => {
    setPeriodMode(mode); setShowDropdown(false)
    if (mode === 'daily') { setStartDate(todayStr); setEndDate(todayStr) }
    else if (mode === 'weekly') { const r = getWeekRange(todayStr); setStartDate(r.start); setEndDate(r.end) }
    else if (mode === 'monthly') { const r = getMonthRange(todayStr); setStartDate(r.start); setEndDate(r.end); setSelectedMonth(new Date().getMonth()); setSelectedYear(new Date().getFullYear()) }
    else if (mode === 'yearly') { const r = getYearRange(new Date().getFullYear()); setStartDate(r.start); setEndDate(r.end); setSelectedYear(new Date().getFullYear()) }
    else if (mode === 'custom') setShowCalendar(true)
  }

  const handlePrevNext = (dir) => {
    if (periodMode === 'daily') {
      const d = new Date(startDate); d.setDate(d.getDate() + dir);
      const ds = d.toISOString().split('T')[0]; setStartDate(ds); setEndDate(ds)
    } else if (periodMode === 'weekly') {
      const d = new Date(startDate); d.setDate(d.getDate() + (7 * dir));
      const r = getWeekRange(d.toISOString().split('T')[0]); setStartDate(r.start); setEndDate(r.end)
    } else if (periodMode === 'monthly') {
      let m = selectedMonth + dir; let y = selectedYear
      if (m > 11) { m = 0; y++ } else if (m < 0) { m = 11; y-- }
      setSelectedMonth(m); setSelectedYear(y)
    } else if (periodMode === 'yearly') {
      setSelectedYear(selectedYear + dir)
    }
  }

  // Exports
  const exportExcel = async () => {
    const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs')
    const wb = XLSX.utils.book_new()
    let rows = []
    if (periodMode === 'daily') {
      rows = [
        ['No', 'Waktu', 'Customer', 'Bayar', 'Qty', 'Total'],
        ...(data?.sales || []).map((s, i) => [
          i + 1,
          formatTime(s.CreatedAt || s.created_at),
          s.CustomerName || s.customer_name || 'Umum',
          s.PaymentMethod?.Name || s.payment_method?.name || s.payment_method?.Name || '-',
          s.Items?.reduce((a, b) => a + (b.quantity || b.Quantity || 0), 0) || s.items?.reduce((a, b) => a + (b.quantity || b.Quantity || 0), 0) || 0,
          s.GrandTotal || s.grand_total
        ]),
        ['', '', '', 'Total', data?.total_qty || 0, data?.total_omzet || 0]
      ]
    } else {
      const col1Name = (periodMode === 'yearly' && yearlyBreakdown === 'monthly') ? 'Bulan' : (periodMode === 'yearly' && yearlyBreakdown === 'weekly' ? 'Minggu' : 'Hari')
      const headers = periodMode === 'yearly' ? ['No', col1Name, 'N', 'Q', 'Omzet'] : ['No', col1Name, 'Tanggal', 'N', 'Q', 'Omzet']

      rows = [
        headers,
        ...(data?.grouped_sales || []).map((g, i) => periodMode === 'yearly' ? [i + 1, g.label, g.n, g.q, g.omzet] : [i + 1, g.label, g.date, g.n, g.q, g.omzet]),
        periodMode === 'yearly' ? ['', 'Total', data?.total_transaksi || 0, data?.total_qty || 0, data?.total_omzet || 0] : ['', '', 'Total', data?.total_transaksi || 0, data?.total_qty || 0, data?.total_omzet || 0]
      ]
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Data')
    XLSX.writeFile(wb, `Laporan-${periodMode}-${startDate}.xlsx`)
  }
  const exportPDF = () => { window.print() }

  // Variables
  const isDaily = periodMode === 'daily'

  // Data extraction
  const sales = data?.sales || []
  const groupedSales = data?.grouped_sales || []
  const shiftFlows = data?.shift_cash_flows || []
  const pSummary = data?.payment_summary || []
  const summary = data?.summary || {}

  const pStats = (data?.product_stats || []).sort((a, b) => statsMode === 'qty' ? b.qty - a.qty : statsMode === 'nota' ? b.nota_count - a.nota_count : b.omzet - a.omzet)
  const cStats = (data?.category_stats || []).sort((a, b) => statsMode === 'qty' ? b.qty - a.qty : statsMode === 'nota' ? b.nota_count - a.nota_count : b.omzet - a.omzet)
  const getVal = (i) => statsMode === 'qty' ? i.qty : statsMode === 'nota' ? i.nota_count : i.omzet
  const lbl = statsMode === 'qty' ? 'Qty' : statsMode === 'nota' ? 'Nota' : 'Omzet'
  const mxP = pStats.length ? Math.max(...pStats.map(getVal)) : 1
  const mxC = cStats.length ? Math.max(...cStats.map(getVal)) : 1

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-zinc-800 p-3 rounded-lg shadow-xl border border-gray-100 dark:border-zinc-700 text-sm">
          <p className="font-semibold mb-1 text-gray-700 dark:text-gray-200">{label}</p>
          <p className="text-emerald-600 dark:text-emerald-400">Qty: {payload[0].value.toLocaleString('id-ID')}</p>
        </div>
      )
    }
    return null
  }

  return (
    <Layout title={`Laporan Penjualan ${periodLabels[periodMode]}`}>
      <div className="max-w-6xl mx-auto pb-10">

        {/* ═══ Header: Navigator Period ═══ */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-5 gap-4">
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => { setShowDropdown(!showDropdown); setShowCalendar(false) }}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-sm font-medium text-sm text-gray-700 dark:text-gray-200 print:hidden"
            >
              📅 {periodLabels[periodMode]} ▼
            </button>
            {showDropdown && !showCalendar && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-zinc-800 rounded-xl shadow-xl py-1 z-50 w-48 border border-gray-100 dark:border-zinc-700">
                {Object.entries(periodLabels).map(([key, label]) => (
                  <button key={key} onClick={() => handlePeriodSelect(key)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition">
                    {label}
                  </button>
                ))}
              </div>
            )}
            {showCalendar && periodMode === 'custom' && (
              <DualCalendar startDate={startDate} endDate={endDate} mode="range"
                onApply={(s, e) => { setStartDate(s); setEndDate(e); setShowCalendar(false) }} onCancel={() => setShowCalendar(false)} />
            )}
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button className="flex items-center gap-2 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-semibold bg-white hover:bg-red-50 transition print:hidden" onClick={exportPDF}>
              📄 Download PDF
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 border border-emerald-200 text-emerald-600 rounded-lg text-xs font-semibold bg-white hover:bg-emerald-50 transition print:hidden" onClick={exportExcel}>
              📊 Download Excel
            </button>
          </div>
        </div>

        {/* ═══ Main Title Navigator ═══ */}
        <div className="bg-white dark:bg-zinc-800 p-2 md:p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 mb-5 flex items-center justify-between print:border-none print:shadow-none">
          <button onClick={() => handlePrevNext(-1)} className="px-4 py-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition font-bold text-lg print:hidden">«</button>

          <div className="flex items-center gap-3">
            {periodMode === 'daily' && (
              <div className="relative">
                <span className="font-bold text-gray-800 dark:text-white px-4 cursor-pointer hover:text-emerald-600 transition" onClick={() => { setShowCenterCalendar(!showCenterCalendar); setShowDropdown(false) }}>
                  {formatDateShort(startDate)}
                </span>
                {showCenterCalendar && (
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50">
                    <DualCalendar startDate={startDate} endDate={endDate} mode="daily"
                      onApply={(s, e) => { setStartDate(s); setEndDate(e); setShowCenterCalendar(false) }} onCancel={() => setShowCenterCalendar(false)} />
                  </div>
                )}
              </div>
            )}
            {periodMode === 'weekly' && (
              <div className="relative">
                <span className="font-bold text-gray-800 dark:text-white px-4 cursor-pointer hover:text-emerald-600 transition" onClick={() => { setShowCenterCalendar(!showCenterCalendar); setShowDropdown(false) }}>
                  {formatDateShort(startDate)} - {formatDateShort(endDate)}
                </span>
                {showCenterCalendar && (
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50">
                    <DualCalendar startDate={startDate} endDate={endDate} mode="range"
                      onApply={(s, e) => { setStartDate(s); setEndDate(e); setShowCenterCalendar(false) }} onCancel={() => setShowCenterCalendar(false)} />
                  </div>
                )}
              </div>
            )}
            {periodMode === 'custom' && (
              <div className="relative">
                <span className="font-bold text-gray-800 dark:text-white px-4 cursor-pointer hover:text-emerald-600 transition" onClick={() => { setShowCenterCalendar(!showCenterCalendar); setShowDropdown(false) }}>
                  {formatDateShort(startDate)} - {formatDateShort(endDate)}
                </span>
                {showCenterCalendar && (
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50">
                    <DualCalendar startDate={startDate} endDate={endDate} mode="range"
                      onApply={(s, e) => { setStartDate(s); setEndDate(e); setShowCenterCalendar(false) }} onCancel={() => setShowCenterCalendar(false)} />
                  </div>
                )}
              </div>
            )}

            {periodMode === 'monthly' && (
              <>
                <DropdownPicker value={selectedMonth} options={monthOptions} onChange={setSelectedMonth} />
                <DropdownPicker value={selectedYear} options={yearOptions} onChange={setSelectedYear} />
              </>
            )}

            {periodMode === 'yearly' && (
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex gap-4 px-4 border border-gray-200 dark:border-zinc-700 p-1.5 rounded-lg bg-gray-50 dark:bg-zinc-800">
                  <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap">
                    <input type="radio" checked={yearlyBreakdown === 'monthly'} onChange={() => setYearlyBreakdown('monthly')} className="text-emerald-500 rounded-full" /> Dirinci Bulanan
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap">
                    <input type="radio" checked={yearlyBreakdown === 'weekly'} onChange={() => setYearlyBreakdown('weekly')} className="text-emerald-500 rounded-full" /> Dirinci Mingguan
                  </label>
                </div>
                <DropdownPicker value={selectedYear} options={yearOptions} onChange={setSelectedYear} />
              </div>
            )}
          </div>

          <button onClick={() => handlePrevNext(1)} className="px-4 py-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition font-bold text-lg print:hidden">»</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" /></div>
        ) : (
          <div className="space-y-6">

            {/* ═══ TABLE RECORD ═══ */}
            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300">
                    {isDaily ? (
                      <tr>
                        <th className="px-4 py-3 text-left w-12 text-xs font-bold">No.</th>
                        <th className="px-4 py-3 text-left w-24 text-xs font-bold">Waktu</th>
                        <th className="px-4 py-3 text-left text-xs font-bold">Cust</th>
                        <th className="px-4 py-3 text-left text-xs font-bold">Bayar</th>
                        <th className="px-4 py-3 text-center w-16 text-xs font-bold">Q</th>
                        <th className="px-4 py-3 text-right text-xs font-bold">Total</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="px-4 py-3 text-left w-12 text-xs font-bold">No.</th>
                        <th className="px-4 py-3 text-left text-xs font-bold">{periodMode === 'yearly' ? (yearlyBreakdown === 'monthly' ? 'Bulan' : 'Minggu') : 'Hari'}</th>
                        {periodMode !== 'yearly' && <th className="px-4 py-3 text-left text-xs font-bold">Tgl</th>}
                        <th className="px-4 py-3 text-center text-xs font-bold">N</th>
                        <th className="px-4 py-3 text-center text-xs font-bold">Q</th>
                        <th className="px-4 py-3 text-right text-xs font-bold">Omzet</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-700">
                    {isDaily ? (
                      sales.length ? sales.map((s, i) => (
                        <tr key={s.ID || s.id} className="bg-white dark:bg-zinc-800">
                          <td className="px-4 py-2.5 text-xs text-gray-500">{i + 1}</td>
                          <td className="px-4 py-2.5 text-xs">{formatTime(s.CreatedAt || s.created_at)}</td>
                          <td className="px-4 py-2.5 text-xs">{s.CustomerName || s.customer_name || 'Umum'}</td>
                          <td className="px-4 py-2.5 text-xs text-red-600">{s.PaymentMethod?.Name || s.payment_method?.name || s.payment_method?.Name || '-'}</td>
                          <td className="px-4 py-2.5 text-xs text-center font-semibold">{s.Items?.reduce((a, b) => a + (b.quantity || b.Quantity || 0), 0) || s.items?.reduce((a, b) => a + (b.quantity || b.Quantity || 0), 0) || 0}</td>
                          <td className="px-4 py-2.5 text-xs text-right font-semibold">{formatRp(s.GrandTotal || s.grand_total)}</td>
                        </tr>
                      )) : <tr><td colSpan={6} className="px-4 py-6 text-center text-xs text-gray-400">Tidak ada data</td></tr>
                    ) : (
                      groupedSales.length ? groupedSales.map((g, i) => (
                        <tr key={i} className="bg-white dark:bg-zinc-800">
                          <td className="px-4 py-2.5 text-xs text-gray-500">{i + 1}</td>
                          <td className="px-4 py-2.5 text-xs">{g.label}</td>
                          {periodMode !== 'yearly' && <td className="px-4 py-2.5 text-xs text-gray-400">{g.date}</td>}
                          <td className="px-4 py-2.5 text-xs text-center">{g.n}</td>
                          <td className="px-4 py-2.5 text-xs text-center font-semibold">{g.q}</td>
                          <td className="px-4 py-2.5 text-xs text-right font-semibold">{formatRp(g.omzet)}</td>
                        </tr>
                      )) : <tr><td colSpan={periodMode === 'yearly' ? 5 : 6} className="px-4 py-6 text-center text-xs text-gray-400">Tidak ada data</td></tr>
                    )}
                  </tbody>
                  {((isDaily && sales.length) || (!isDaily && groupedSales.length)) && (
                    <tfoot className="bg-gray-50 dark:bg-zinc-700/50 border-t-2 border-gray-200 dark:border-zinc-600">
                      <tr>
                        <td colSpan={isDaily ? 4 : (periodMode === 'yearly' ? 2 : 3)} className="px-4 py-3 text-center text-sm font-bold">Total</td>
                        {!isDaily && <td className="px-4 py-3 text-center text-sm font-bold">{data?.total_transaksi}</td>}
                        <td className="px-4 py-3 text-center text-sm font-bold">{data?.total_qty}</td>
                        <td className="px-4 py-3 text-right text-sm font-bold">{formatRp(data?.total_omzet)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* ═══ SUMMARY PANEL (ONLY NON-DAILY) ═══ */}
            {!isDaily && summary && (
              <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden text-sm">
                <div className="bg-gray-100 dark:bg-zinc-700 px-4 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-300">
                  {formatDateShort(startDate)} - {formatDateShort(endDate)}
                </div>
                <div className="divide-y divide-gray-100 dark:divide-zinc-700">
                  <div className="flex justify-between px-5 py-2.5"><span className="text-gray-600 dark:text-zinc-400 text-xs">Rata-rata Nota</span><span className="font-medium text-xs font-mono">{formatNum(summary.avg_nota, 2)}</span></div>
                  <div className="flex justify-between px-5 py-2.5"><span className="text-gray-600 dark:text-zinc-400 text-xs">Rata-rata Qty</span><span className="font-medium text-xs font-mono">{formatNum(summary.avg_qty, 2)}</span></div>
                  <div className="flex justify-between px-5 py-2.5"><span className="text-gray-600 dark:text-zinc-400 text-xs">Rata-rata Omzet</span><span className="font-medium text-xs font-mono">{formatRpStr(summary.avg_omzet)}</span></div>
                  <div className="flex justify-between px-5 py-2.5"><span className="text-gray-600 dark:text-zinc-400 text-xs">Rata-rata Qty/Nota</span><span className="font-medium text-xs font-mono">{formatNum(summary.avg_qty_per_nota, 2)}</span></div>
                  <div className="flex justify-between px-5 py-2.5"><span className="text-gray-600 dark:text-zinc-400 text-xs">Rata-rata Omzet/Nota</span><span className="font-medium text-xs font-mono">{formatRpStr(summary.avg_omz_per_nota)}</span></div>
                  <div className="flex justify-between px-5 py-2.5"><span className="text-gray-600 dark:text-zinc-400 text-xs">Rata-rata Omzet/Qty</span><span className="font-medium text-xs font-mono">{formatRpStr(summary.avg_omz_per_qty)}</span></div>
                </div>
              </div>
            )}

            {/* ═══ METODE PEMBAYARAN ═══ */}
            {pSummary.length > 0 && (
              <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden text-sm">
                <div className="bg-gray-100 dark:bg-zinc-700 px-4 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-300">
                  Metode Pembayaran
                </div>
                <div className="divide-y divide-gray-100 dark:divide-zinc-700">
                  {pSummary.map((p, idx) => (
                    <div key={idx} className="flex justify-between px-5 py-2.5">
                      <span className="text-gray-600 dark:text-zinc-400 text-xs">Penjualan {p.name}</span>
                      <span className="font-medium text-xs">{formatRp(p.total)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between px-5 py-3 bg-gray-50 dark:bg-zinc-700/50">
                    <span className="font-bold text-gray-700 dark:text-zinc-300 text-xs">Total Penjualan</span>
                    <span className="font-bold text-xs">{formatRp(data?.total_omzet)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ KAS SHIFT (DAILY ONLY) ═══ */}
            {isDaily && shiftFlows.map((sf, idx) => (
              <div key={idx} className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden text-sm mb-4">
                <div className="bg-gray-100 dark:bg-zinc-700 px-4 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-300">
                  Arus Kas Tunai {sf.user_name} {formatTime(sf.start_time)}{sf.end_time ? ` - ${formatTime(sf.end_time)}` : ''} {formatDateShort(sf.start_time)}
                </div>
                <div className="divide-y divide-gray-100 dark:divide-zinc-700 flex flex-col">
                  <div className="flex justify-between px-5 py-2.5">
                    <span className="text-xs text-gray-600 dark:text-zinc-400">Pembayaran Tunai</span>
                    <span className="text-xs font-medium">{formatRp(sf.cash_sales)}</span>
                  </div>
                  <div className="flex justify-between px-5 py-2.5">
                    <span className="text-xs text-gray-600 dark:text-zinc-400">Total Kas Masuk</span>
                    <span className="text-xs font-medium">{formatRp(sf.total_kas_masuk)}</span>
                  </div>
                  <div className="flex justify-between px-5 py-3 bg-gray-50 dark:bg-zinc-700/50">
                    <span className="text-xs font-bold text-gray-700 dark:text-zinc-300">Total Kas Tunai</span>
                    <span className="text-xs font-bold text-emerald-600">{formatRp(sf.total_kas_tunai)}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* ═══ STATISTIK DROPDOWN ═══ */}
            <div className="flex justify-center my-8">
              <div className="relative" ref={statsDropdownRef}>
                <button onClick={() => setShowStatsDropdown(!showStatsDropdown)}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md text-xs font-medium transition shadow"
                >
                  {statsLabels[statsMode]} ▼
                </button>
                {showStatsDropdown && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white dark:bg-zinc-800 rounded-xl shadow-xl py-1 z-50 w-56 border border-gray-100 dark:border-zinc-700">
                    {Object.entries(statsLabels).map(([key, label]) => (
                      <button key={key} onClick={() => { setStatsMode(key); setShowStatsDropdown(false) }}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 dark:hover:bg-zinc-700 transition">
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ═══ TABLES PRODUK / KATEGORI ═══ */}
            <div className="space-y-6">
              {[{ title: 'Produk', arr: pStats, max: mxP }, { title: 'Paket', arr: [], max: 1 }, { title: 'Kategori', arr: cStats, max: mxC }].map((T, k) => (
                <div key={k}>
                  <p className="text-xs text-gray-600 dark:text-zinc-400 mb-2 font-medium">{T.title}</p>
                  <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300">
                        <tr>
                          <th className="px-4 py-2 text-left w-12 text-xs font-bold">No</th>
                          <th className="px-4 py-2 text-left text-xs font-bold">{T.title}</th>
                          <th className="px-4 py-2 text-center w-24 text-xs font-bold">{lbl}</th>
                          <th className="px-4 py-2 text-left w-1/3 text-xs font-bold"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-zinc-700/50">
                        {T.arr.length ? T.arr.map((p, idx) => {
                          const val = getVal(p); const pct = T.max ? (val / T.max) * 100 : 0
                          return (
                            <tr key={idx} className="bg-white dark:bg-zinc-800">
                              <td className="px-4 py-2 text-xs text-gray-500">{idx + 1}</td>
                              <td className="px-4 py-2 text-xs">{p.name}</td>
                              <td className="px-4 py-2 text-xs text-center font-medium">{statsMode === 'omzet' ? formatRp(val) : val}</td>
                              <td className="px-4 py-2">
                                <div className="w-full bg-gray-100 dark:bg-zinc-700 h-2.5 rounded-sm overflow-hidden">
                                  <div className="bg-indigo-500 h-2.5 transition-all" style={{ width: `${pct}%` }} />
                                </div>
                              </td>
                            </tr>
                          )
                        }) : <tr><td colSpan={4} className="px-4 py-4 text-center text-xs text-gray-400">Tidak ada data</td></tr>}
                      </tbody>
                      {T.arr.length > 0 && (
                        <tfoot className="bg-gray-50 dark:bg-zinc-700/50 border-t border-gray-200 dark:border-zinc-600">
                          <tr><td colSpan={2} className="px-4 py-2 text-center text-xs font-bold text-gray-800 dark:text-zinc-200">Total</td><td className="px-4 py-2 text-center text-xs font-bold text-gray-800 dark:text-white">{statsMode === 'omzet' ? formatRp(T.arr.reduce((s, x) => s + getVal(x), 0)) : T.arr.reduce((s, x) => s + getVal(x), 0)}</td><td></td></tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              ))}
            </div>

            {/* ═══ CHARTS (ONLY NON-DAILY) ═══ */}
            {!isDaily && (
              <div className="space-y-6 mt-10">

                {/* Chart 1: Trend */}
                <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden text-sm">
                  <div className="bg-gray-100 dark:bg-zinc-700 px-4 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-300">
                    Total Qty Per {periodMode === 'monthly' ? 'Tanggal' : (periodMode === 'weekly' ? 'Tanggal' : 'Bulan')}
                  </div>
                  <div className="p-4 h-[250px] md:h-[300px] text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data?.chart_trend || []} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} dx={-10} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="value" stroke="#3730A3" strokeWidth={2} dot={{ r: 3, fill: '#3730A3' }} activeDot={{ r: 5, fill: '#10B981' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Analisis Perhari Average */}
                <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden text-sm">
                  <div className="bg-gray-100 dark:bg-zinc-700 px-4 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-300">
                    Analisis Perhari - Rata-rata Qty
                  </div>
                  <div className="p-4 h-[250px] md:h-[300px] text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.chart_day || []} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} barSize={30}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} dx={-10} />
                        <Tooltip cursor={{ fill: '#F3F4F6' }} content={<CustomTooltip />} />
                        <Bar dataKey="value" fill="#9CA3AF" radius={[2, 2, 0, 0]} label={{ position: 'top', fill: '#4B5563', fontSize: 9, formatter: (v) => formatNum(v, 1) }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 3: Analisis Perjam Average */}
                <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden text-sm">
                  <div className="bg-gray-100 dark:bg-zinc-700 px-4 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-300">
                    Analisis Perjam - Rata-rata Qty
                  </div>
                  <div className="p-4 h-[250px] md:h-[300px] text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.chart_hour || []} margin={{ top: 20, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 8 }} dy={10} interval={0} angle={-45} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} dx={-10} />
                        <Tooltip cursor={{ fill: '#F3F4F6' }} content={<CustomTooltip />} />
                        <Bar dataKey="value" fill="#9CA3AF" radius={[2, 2, 0, 0]} label={{ position: 'top', fill: '#4B5563', fontSize: 8, formatter: (v) => v > 0 ? formatNum(v, 1) : '' }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}
      </div>
    </Layout>
  )
}