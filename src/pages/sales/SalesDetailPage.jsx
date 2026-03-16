import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Layout from '../../components/Layout'

const formatRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')
const formatDate = (str) => {
  if (!str) return '-'
  return new Date(str).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
}

export default function SalesDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [sale, setSale] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  const fetchSale = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/sales/${id}`)
      setSale(res.data?.data)
    } catch (err) {
      console.error(err)
      navigate('/sales')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSale()
  }, [id])

  const handleDelete = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return
    setDeleting(true)
    try {
      await api.delete(`/sales/${id}`)
      navigate('/sales')
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus transaksi')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
    </div>
  )

  if (!sale) return null

  return (
    <Layout title="Detail Penjualan">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/sales')} className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p className="text-emerald-600 font-mono text-sm font-bold uppercase tracking-wider">{sale.invoice_number || sale.InvoiceNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate(`/sales/${id}/edit`)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </button>
          <button 
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition flex items-center gap-2 disabled:opacity-50"
          >
            {deleting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
            Hapus
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: General Info */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Tanggal</p>
              <p className="text-sm text-gray-800 font-medium">{formatDate(sale.created_at || sale.CreatedAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Pelanggan</p>
              <p className="text-sm text-gray-800 font-medium">{sale.customer_name || sale.CustomerName || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Metode Bayar</p>
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold ring-1 ring-emerald-100">
                {sale.payment_method?.name || sale.PaymentMethod?.Name || '-'}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Operator</p>
              <p className="text-sm text-gray-800 font-medium">{sale.user?.name || sale.User?.Name || '-'}</p>
            </div>
          </div>
        </div>

        {/* Right Side: Items & Total */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-5 border-b border-gray-50 flex items-center justify-between">
               <h2 className="font-bold text-gray-800">Detail Pesanan</h2>
               <span className="text-xs text-gray-400 font-bold">{(sale.items || sale.Items || []).length} Item</span>
             </div>
             <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                {(sale.items || sale.Items || []).map((item, idx) => (
                  <div key={idx} className="p-5 flex justify-between items-start hover:bg-gray-50/50 transition">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800 mb-1">{item.product?.name || item.Product?.Name || `Produk #${item.product_id || item.ProductID}`}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(item.variants || item.Variants || []).map((v, vIdx) => (
                          <span key={vIdx} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold">
                            {v.variant_option?.name || v.VariantOption?.Name}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">{formatRp(item.base_price || item.BasePrice)} × {item.quantity || item.Quantity}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-gray-800">{formatRp(item.subtotal || item.Subtotal)}</p>
                    </div>
                  </div>
                ))}
             </div>
             <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span className="font-bold text-gray-700">{formatRp(sale.subtotal || sale.Subtotal)}</span>
                  </div>
                  {(sale.discount_total || sale.DiscountTotal) > 0 && (
                    <div className="flex justify-between text-sm text-red-500">
                      <span>Diskon</span>
                      <span className="font-bold">- {formatRp(sale.discount_total || sale.DiscountTotal)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-end pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Pembayaran</p>
                  <p className="text-3xl font-black text-emerald-600">{formatRp(sale.grand_total || sale.GrandTotal)}</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
