import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [prices, setPrices] = useState([])
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchDetail() }, [id])

  const fetchDetail = async () => {
    setLoading(true)
    try {
      const [prodRes, priceRes, promoRes] = await Promise.all([
        api.get(`/products/${id}`),
        api.get(`/products/${id}/prices`),
        api.get(`/products/${id}/promos`),
      ])
      setProduct(prodRes.data.data)
      setPrices(priceRes.data.data || [])
      setPromos(promoRes.data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const promoTypeLabel = (t) => ({ special_price: 'Harga Spesial', discount: 'Diskon %', cut_price: 'Potongan Harga' }[t] || t)
  const promoTypeColor = (t) => ({
    special_price: 'bg-purple-100 text-purple-600',
    discount: 'bg-blue-100 text-blue-600',
    cut_price: 'bg-orange-100 text-orange-600'
  }[t] || 'bg-gray-100 text-gray-600')

  const promoValueLabel = (promo) => {
    if (promo.promo_type === 'discount') return `${promo.discount_pct}% off${promo.max_discount > 0 ? ` (maks Rp ${Number(promo.max_discount).toLocaleString('id-ID')})` : ''}`
    if (promo.promo_type === 'cut_price') return `Potongan Rp ${Number(promo.cut_price).toLocaleString('id-ID')}`
    if (promo.promo_type === 'special_price') return 'Harga spesial berlaku'
    return '-'
  }

  if (loading) return (
    <Layout title="Detail Produk">
      <div className="flex items-center justify-center py-20 text-gray-400">
        <p>Memuat data...</p>
      </div>
    </Layout>
  )

  if (!product) return (
    <Layout title="Detail Produk">
      <div className="flex items-center justify-center py-20 text-gray-400">
        <p>Produk tidak ditemukan</p>
      </div>
    </Layout>
  )

  return (
    <Layout title="Detail Produk">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/products')} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-800">Detail Produk</h1>
              {promos.length > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-600 rounded-full text-xs font-semibold animate-pulse">
                  🔥 {promos.length} Promo Aktif
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm">Informasi lengkap produk</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Kiri - Gambar */}
          <div className="col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Badge promo di gambar */}
              <div className="relative">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square bg-white-100 flex items-center justify-center">
                    <span className="text-6xl">📦</span>
                  </div>
                )}
                {promos.length > 0 && (
                  <div className="absolute top-2 right-2">
                    <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow">
                      PROMO
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4">
                <span className={`w-full flex justify-center py-1.5 rounded-lg text-sm font-medium ${product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {product.status === 'active' ? '✓ Aktif' : '✗ Nonaktif'}
                </span>
              </div>
            </div>
          </div>

          {/* Kanan - Info */}
          <div className="col-span-2 space-y-4">

            {/* Promo Banner — tampil paling atas jika ada promo */}
            {promos.length > 0 && (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🔥</span>
                  <h3 className="font-bold text-red-600">Produk Ini Sedang Ada Promo!</h3>
                </div>
                <div className="space-y-2">
                  {promos.map((promo, i) => (
                    <div key={i} className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border border-red-100">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${promoTypeColor(promo.promo_type)}`}>
                          {promoTypeLabel(promo.promo_type)}
                        </span>
                        <span className="text-sm font-medium text-gray-800">{promo.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-500">{promoValueLabel(promo)}</p>
                        {promo.voucher_type === 'custom' && promo.voucher_code && (
                          <p className="text-xs text-gray-400 font-mono">Kode: {promo.voucher_code}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Dasar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-lg font-bold text-gray-800 mb-1">{product.name}</h2>
              {product.code && <p className="text-sm text-gray-400 mb-3">Kode: {product.code}</p>}
              {product.description && <p className="text-sm text-gray-600 mb-4">{product.description}</p>}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Kategori</p>
                  <p className="text-sm font-medium text-gray-700">{product.category?.name || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Merek</p>
                  <p className="text-sm font-medium text-gray-700">{product.brand?.name || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Satuan</p>
                  <p className="text-sm font-medium text-gray-700">{product.unit?.name || '-'}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3">
                  <p className="text-xs text-emerald-600 mb-1">Harga Default</p>
                  <p className="text-sm font-bold text-emerald-700">Rp {Number(product.price).toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>

            {/* Multi Harga */}
            {prices.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-800 mb-3">Harga per Kategori</h3>
                <div className="space-y-2">
                  {prices.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-600">{p.price_category?.name || '-'}</span>
                      <span className="text-sm font-semibold text-gray-800">Rp {Number(p.price).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Varian */}
            {product.variants?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-800 mb-3">Varian Produk</h3>
                <div className="space-y-3">
                  {product.variants.map((v, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">{v.name}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {v.options?.map((o, j) => (
                          <div key={j} className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1">
                            <span className="text-xs text-gray-700">{o.name}</span>
                            {o.additional_price > 0 && (
                              <span className="text-xs text-orange-500">+Rp {Number(o.additional_price).toLocaleString('id-ID')}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Outlet */}
            {product.outlets?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-800 mb-3">Tersedia di Outlet</h3>
                <div className="space-y-2">
                  {product.outlets.map((o, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">🏪</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{o.name}</p>
                        {o.address && <p className="text-xs text-gray-400">{o.address}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}