import { useState, useEffect } from 'react'
import KasirLayout from '../../components/KasirLayout'
import api from '../../api/axios'

const formatRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')
const formatDate = (str) => {
  if (!str) return '-'
  return new Date(str).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}
const formatTime = (str) => {
  if (!str) return '-'
  return new Date(str).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit'
  })
}

// ── Detail Modal ────────────────────────────────────────────────────────────
function DetailModal({ sale, onClose }) {
  if (!sale) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-800">Detail Transaksi</h2>
            <p className="text-xs text-emerald-600 font-medium">{sale.InvoiceNumber || sale.invoice_number}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Info transaksi */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tanggal</span>
              <span className="font-medium text-gray-700">
                {formatDate(sale.CreatedAt || sale.created_at)} {formatTime(sale.CreatedAt || sale.created_at)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Pembeli</span>
              <span className="font-medium text-gray-700">
                {sale.CustomerName || sale.customer_name || '-'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Metode Bayar</span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">
                {sale.PaymentMethod?.Name || sale.payment_method?.name || '-'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Operator</span>
              <span className="font-medium text-gray-700">
                {sale.user?.name || sale.User?.Name || '-'}
              </span>
            </div>
            {(sale.PromoID || sale.promo_id) && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Promo</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium">
                  {sale.Promo?.Name || sale.promo?.name || 'Promo'}
                </span>
              </div>
            )}
          </div>

          {/* Items */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Item Pesanan</h3>
            <div className="space-y-2">
              {(sale.Items || sale.items || []).map((item, idx) => (
                <div key={idx} className="flex justify-between items-start bg-gray-50 rounded-xl p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {item.Product?.Name || item.product?.name || `Produk #${item.ProductID || item.product_id}`}
                    </p>
                    {(item.Variants || item.variants || []).length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {(item.Variants || item.variants).map(v =>
                          v.VariantOption?.Name || v.variant_option?.name || ''
                        ).filter(Boolean).join(', ')}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {formatRp(item.BasePrice || item.base_price)} × {item.Quantity || item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 ml-3">
                    {formatRp(item.Subtotal || item.subtotal)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Ringkasan harga */}
          <div className="border-t border-gray-100 pt-3 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{formatRp(sale.Subtotal || sale.subtotal)}</span>
            </div>
            {(sale.DiscountTotal || sale.discount_total) > 0 && (
              <div className="flex justify-between text-sm text-red-500">
                <span>Diskon</span>
                <span>- {formatRp(sale.DiscountTotal || sale.discount_total)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-800 pt-1 border-t border-gray-100">
              <span>Total</span>
              <span className="text-emerald-600">{formatRp(sale.GrandTotal || sale.grand_total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-semibold transition">
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function RiwayatTransaksi() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterMethod, setFilterMethod] = useState('')
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().split('T')[0])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [selected, setSelected] = useState(null)

  const fetchSales = async () => {
    setLoading(true)
    try {
        // Gunakan endpoint daily yang sudah ada di backend
        const res = await api.get('/sales/daily', {
          params: { date: filterDate, source: 'pos' }
        })
        // Response daily: { data: { sales: [...], ... } }
        const data = res.data?.data?.sales || res.data?.sales || []
        setSales(Array.isArray(data) ? data : [])
    } catch (err) {
        console.error(err)
        setSales([])
    } finally {
        setLoading(false)
    }
    }

  const fetchPaymentMethods = async () => {
    try {
      const res = await api.get('/payment-methods')
      setPaymentMethods(res.data?.data || res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchSales()
    fetchPaymentMethods()
  }, [filterDate])

  // Filter lokal
  const filtered = sales.filter(s => {
    const invoice  = (s.InvoiceNumber || s.invoice_number || '').toLowerCase()
    const customer = (s.CustomerName || s.customer_name || '').toLowerCase()
    const methodID = String(s.PaymentMethodID || s.payment_method_id || '')

    const matchSearch = !search ||
      invoice.includes(search.toLowerCase()) ||
      customer.includes(search.toLowerCase()) ||
      (s.Items || s.items || []).some(i =>
        (i.Product?.Name || i.product?.name || '').toLowerCase().includes(search.toLowerCase())
      )
    const matchMethod = !filterMethod || methodID === filterMethod
    return matchSearch && matchMethod
  })

  // Summary
  const totalOmzet = filtered.reduce((sum, s) => sum + (s.GrandTotal || s.grand_total || 0), 0)

  return (
    <KasirLayout title="Riwayat Transaksi">
      <div className="max-w-3xl mx-auto space-y-4">

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Total Transaksi</p>
            <p className="text-2xl font-bold text-gray-800">{filtered.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Total Omzet</p>
            <p className="text-xl font-bold text-emerald-600">{formatRp(totalOmzet)}</p>
          </div>
        </div>

        {/* ── Filter ── */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">

          {/* Search */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari invoice, nama pembeli, atau produk..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div className="flex gap-3">
            {/* Filter tanggal */}
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* Filter metode pembayaran */}
            <select
              value={filterMethod}
              onChange={e => setFilterMethod(e.target.value)}
              className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
            >
              <option value="">Semua Metode</option>
              {paymentMethods.map(m => (
                <option key={m.ID || m.id} value={String(m.ID || m.id)}>
                  {m.Name || m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── List Transaksi ── */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm text-gray-400">Belum ada transaksi</p>
            </div>
          ) : (
            filtered.map((sale, idx) => {
              const invoice  = sale.InvoiceNumber || sale.invoice_number || '-'
              const method   = sale.PaymentMethod?.Name || sale.payment_method?.name || '-'
              const total    = sale.GrandTotal || sale.grand_total || 0
              const itemCount = (sale.Items || sale.items || []).length
              const customer = sale.CustomerName || sale.customer_name || '-'
              const time     = formatTime(sale.CreatedAt || sale.created_at)

              return (
                <button key={sale.ID || sale.id || idx}
                  onClick={() => setSelected(sale)}
                  className="w-full bg-white rounded-2xl border border-gray-100 p-4 hover:border-emerald-300 hover:shadow-sm transition text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-800 truncate">{invoice}</span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium flex-shrink-0">
                          {method}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>🕐 {time}</span>
                        <span>👤 {customer}</span>
                        <span>🛍️ {itemCount} item</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-emerald-600">{formatRp(total)}</p>
                      <svg className="w-4 h-4 text-gray-300 ml-auto mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selected && <DetailModal sale={selected} onClose={() => setSelected(null)} />}
    </KasirLayout>
  )
}