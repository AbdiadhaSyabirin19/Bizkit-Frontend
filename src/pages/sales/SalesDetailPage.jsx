import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import { usePermission } from '../../hooks/usePermission'

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
  const { can } = usePermission()
  
  const [sale, setSale] = useState(null)
  const [storeSettings, setStoreSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [saleRes, settingsRes] = await Promise.all([
        api.get(`/sales/${id}`),
        api.get('/settings')
      ])
      setSale(saleRes.data?.data)
      setStoreSettings(settingsRes.data?.data)
    } catch (err) {
      console.error(err)
      navigate('/sales')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
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

  const items = sale.items || sale.Items || []
  const subtotal = sale.subtotal || sale.Subtotal || 0
  const discountTotal = sale.discount_total || sale.DiscountTotal || 0
  const grandTotal = sale.grand_total || sale.GrandTotal || 0

  return (
    <Layout title="Detail Penjualan">
      <div className="max-w-4xl mx-auto py-8">
        {/* Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6 mx-auto max-w-2xl">
          <div className="grid grid-cols-[140px_1fr] gap-y-4 text-xs">
            <div className="font-bold text-gray-800">Tanggal:</div>
            <div className="text-gray-600">{formatDate(sale.created_at || sale.CreatedAt)}</div>

            <div className="font-bold text-gray-800">Outlet:</div>
            <div className="text-gray-600">{storeSettings?.StoreName || storeSettings?.store_name || '-'}</div>

            <div className="font-bold text-gray-800">ID Penjualan:</div>
            <div className="text-gray-600 font-mono">{sale.invoice_number || sale.InvoiceNumber}</div>

            <div className="font-bold text-gray-800">Diinput Oleh:</div>
            <div className="text-gray-600 font-medium">{sale.user?.name || sale.User?.Name || '-'}</div>

            <div className="font-bold text-gray-800">Pelanggan:</div>
            <div className="text-gray-600 font-medium">{sale.customer_name || sale.CustomerName || 'Umum'}</div>

            <div className="font-bold text-gray-800">Jenis Pembayaran:</div>
            <div className="text-gray-600">Bayar Penuh</div>

            <div className="font-bold text-gray-800">Metode Bayar:</div>
            <div className="text-gray-600">{sale.payment_method?.name || sale.PaymentMethod?.Name || '-'}</div>

            <div className="font-bold text-gray-800">Status Pembayaran:</div>
            <div className="text-gray-600">Lunas</div>

            <div className="font-bold text-gray-800">Sisa Pembayaran:</div>
            <div className="text-gray-600">0</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-2 mb-10">
          {can('sales', 'edit') && (
            <button 
              onClick={() => navigate(`/sales/${id}/edit`)}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition shadow-sm"
            >
              Edit
            </button>
          )}
          {can('sales', 'delete') && (
            <button 
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              Delete
            </button>
          )}
          <button className="px-4 py-1.5 bg-amber-400 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition shadow-sm">
            Pembayaran
          </button>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#cbd5e1] text-gray-700 text-xs font-bold border-b border-gray-300">
                <th className="px-4 py-3 border-r border-gray-300 w-16 text-center">No</th>
                <th className="px-4 py-3 border-r border-gray-300">Produk</th>
                <th className="px-4 py-3 border-r border-gray-300 text-center">Qty</th>
                <th className="px-4 py-3 border-r border-gray-300 text-right">Harga</th>
                <th className="px-4 py-3 border-r border-gray-300 text-center">Dis</th>
                <th className="px-4 py-3 border-r border-gray-300 text-center">Pot</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, idx) => (
                <tr key={idx} className="text-xs">
                  <td className="px-4 py-3 text-center text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {item.product?.name || item.Product?.Name || `Produk #${item.product_id || item.ProductID}`}
                    <div className="text-[10px] text-gray-400 font-normal">
                      {(item.variants || item.Variants || []).map(v => v.variant_option?.name || v.VariantOption?.Name).join(', ')}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{item.quantity} {item.product?.unit?.name || 'Item'}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{(item.base_price || item.BasePrice).toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-center text-gray-600">0%</td>
                  <td className="px-4 py-3 text-center text-gray-600">0</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">{(item.subtotal || item.Subtotal).toLocaleString('id-ID')}</td>
                </tr>
              ))}
              
              {/* Summary Rows */}
              <tr>
                <td colSpan="6" className="px-4 py-2 text-right font-bold text-gray-800">Promo</td>
                <td className="px-4 py-2 text-right font-bold text-gray-800">0</td>
              </tr>
              <tr>
                <td colSpan="6" className="px-4 py-2 text-right font-bold text-gray-800">Subtotal</td>
                <td className="px-4 py-2 text-right font-bold text-gray-800">{subtotal.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td colSpan="6" className="px-4 py-2 text-right font-bold text-gray-800 text-red-500">Diskon</td>
                <td className="px-4 py-2 text-right font-bold text-red-500">{(discountTotal > 0 ? -discountTotal : 0).toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td colSpan="6" className="px-4 py-2 text-right font-bold text-gray-800">Biaya Tambahan</td>
                <td className="px-4 py-2 text-right font-bold text-gray-800">0</td>
              </tr>
              <tr>
                <td colSpan="6" className="px-4 py-2 text-right font-bold text-gray-800">Total</td>
                <td className="px-4 py-2 text-right font-bold text-gray-800">{grandTotal.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td colSpan="6" className="px-4 py-2 text-right font-bold text-gray-800">Pajak (%)</td>
                <td className="px-4 py-2 text-right font-bold text-gray-800">0</td>
              </tr>
              <tr className="border-t-2 border-gray-100">
                <td colSpan="6" className="px-4 py-3 text-right font-black text-gray-900 text-sm">Grand Total</td>
                <td className="px-4 py-3 text-right font-black text-gray-900 text-sm">{grandTotal.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-[10px] text-gray-400 pt-8 border-t border-gray-100">
          <p>Copyright © 2014-2026 AINDO. All rights reserved.</p>
          <p className="font-bold">BizKit</p>
        </div>
      </div>
    </Layout>
  )
}
