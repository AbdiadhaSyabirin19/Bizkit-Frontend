import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'

export default function PromoDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [promo, setPromo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchDetail() }, [id])

  const fetchDetail = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/promos/${id}`)
      setPromo(res.data.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const promoTypeLabel = (t) => ({ special_price: 'Harga Spesial', discount: 'Diskon %', cut_price: 'Potongan Harga' }[t] || t)
  const appliesToLabel = (t) => ({ all: 'Semua Produk', category: 'Kategori', brand: 'Merek', product: 'Produk Tertentu' }[t] || t)
  const conditionLabel = (t) => ({
    qty: 'Min Qty Pembelian',
    total: 'Min Total Pembelian',
    qty_or_total: 'Min Qty atau Total',
    qty_and_total: 'Min Qty dan Total'
  }[t] || t)

  const DAYS = { '1': 'Senin', '2': 'Selasa', '3': 'Rabu', '4': 'Kamis', '5': 'Jumat', '6': 'Sabtu', '7': 'Minggu' }

  if (loading) return (
    <Layout title="Detail Promo">
      <div className="flex items-center justify-center py-20 text-gray-400">
        <p>Memuat data...</p>
      </div>
    </Layout>
  )

  if (!promo) return (
    <Layout title="Detail Promo">
      <div className="flex items-center justify-center py-20 text-gray-400">
        <p>Promo tidak ditemukan</p>
      </div>
    </Layout>
  )

  const activeDays = promo.active_days?.split(',').filter(Boolean) || []

  return (
    <Layout title="Detail Promo">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/promos')} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Detail Promo</h1>
            <p className="text-gray-500 text-sm">Informasi lengkap promo & voucher</p>
          </div>
        </div>

        <div className="space-y-4">

          {/* Info Dasar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{promo.name}</h2>
                <div className="flex gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">{promoTypeLabel(promo.promo_type)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${promo.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {promo.status === 'active' ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>
              {promo.max_usage > 0 && (
                <div className="text-right">
                  <p className="text-xs text-gray-400">Penggunaan</p>
                  <p className="text-lg font-bold text-gray-800">{promo.used_count}<span className="text-sm text-gray-400">/{promo.max_usage}</span></p>
                  <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min((promo.used_count / promo.max_usage) * 100, 100)}%` }} />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Berlaku Pada</p>
                <p className="text-sm font-medium text-gray-700">{appliesToLabel(promo.applies_to)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Syarat</p>
                <p className="text-sm font-medium text-gray-700">{conditionLabel(promo.condition)}</p>
              </div>
              {promo.min_qty > 0 && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Min Qty</p>
                  <p className="text-sm font-medium text-gray-700">{promo.min_qty} pcs</p>
                </div>
              )}
              {promo.min_total > 0 && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Min Total</p>
                  <p className="text-sm font-medium text-gray-700">Rp {Number(promo.min_total).toLocaleString('id-ID')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Detail Promo */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Detail Keuntungan</h3>
            {promo.promo_type === 'discount' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs text-blue-500 mb-1">Diskon</p>
                  <p className="text-2xl font-bold text-blue-600">{promo.discount_pct}%</p>
                </div>
                {promo.max_discount > 0 && (
                  <div className="bg-orange-50 rounded-xl p-3">
                    <p className="text-xs text-orange-500 mb-1">Maks Diskon</p>
                    <p className="text-lg font-bold text-orange-600">Rp {Number(promo.max_discount).toLocaleString('id-ID')}</p>
                  </div>
                )}
              </div>
            )}
            {promo.promo_type === 'cut_price' && (
              <div className="bg-purple-50 rounded-xl p-3">
                <p className="text-xs text-purple-500 mb-1">Potongan Harga</p>
                <p className="text-2xl font-bold text-purple-600">Rp {Number(promo.cut_price).toLocaleString('id-ID')}</p>
              </div>
            )}
            {promo.promo_type === 'special_price' && promo.special_prices?.length > 0 && (
              <div className="space-y-2">
                {promo.special_prices.map((sp, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-700">{sp.product?.name || `Produk #${sp.product_id}`}</span>
                    <span className="text-sm font-bold text-emerald-600">Rp {Number(sp.buy_price).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Berlaku pada item */}
          {promo.items?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Berlaku Pada</h3>
              <div className="flex flex-wrap gap-2">
                {promo.items.map((item, i) => (
                  <span key={i} className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
                    {item.ref_name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Waktu Aktif */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Waktu Aktif</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-2">Hari Aktif</p>
                <div className="flex gap-1.5">
                  {['1','2','3','4','5','6','7'].map(d => (
                    <span key={d} className={`px-2.5 py-1 rounded-lg text-xs font-medium ${activeDays.includes(d) ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {DAYS[d].slice(0,3)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Jam Aktif</p>
                  <p className="text-sm font-medium text-gray-700">{promo.start_time} - {promo.end_time}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Periode</p>
                  <p className="text-sm font-medium text-gray-700">
                    {promo.start_date?.split('T')[0]} s/d {promo.end_date?.split('T')[0]}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Voucher */}
          {promo.voucher_type !== 'none' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Voucher</h3>
              {promo.voucher_type === 'custom' && (
                <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <span className="text-2xl">🎟️</span>
                  <div>
                    <p className="text-xs text-orange-500 mb-1">Kode Voucher</p>
                    <p className="text-xl font-bold text-orange-600 font-mono">{promo.voucher_code}</p>
                  </div>
                </div>
              )}
              {promo.voucher_type === 'generate' && (
                <div>
                  <p className="text-sm text-gray-600 mb-3">Total {promo.vouchers?.length || 0} voucher digenerate</p>
                  <div className="max-h-48 overflow-y-auto space-y-1.5">
                    {promo.vouchers?.map((v, i) => (
                      <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${v.is_used ? 'bg-gray-50 border-gray-200' : 'bg-emerald-50 border-emerald-200'}`}>
                        <span className="font-mono text-sm font-medium text-gray-700">{v.code}</span>
                        <span className={`text-xs font-medium ${v.is_used ? 'text-gray-400' : 'text-emerald-600'}`}>
                          {v.is_used ? 'Terpakai' : 'Tersedia'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}