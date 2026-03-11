import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'

export default function OutletDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [outlet, setOutlet] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchDetail() }, [id])

  const fetchDetail = async () => {
    setLoading(true)
    try {
      const [outletRes, prodRes] = await Promise.all([
        api.get(`/outlets/${id}`),
        api.get('/products'),
      ])
      setOutlet(outletRes.data.data)
      // Filter produk yang punya outlet ini
      const allProducts = prodRes.data.data || []
      const filtered = allProducts.filter(p =>
        p.outlets?.some(o => (o.ID || o.id) === Number(id))
      )
      setProducts(filtered)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  if (loading) return (
    <Layout title="Detail Outlet">
      <div className="flex items-center justify-center py-20 text-gray-400"><p>Memuat data...</p></div>
    </Layout>
  )

  if (!outlet) return (
    <Layout title="Detail Outlet">
      <div className="flex items-center justify-center py-20 text-gray-400"><p>Outlet tidak ditemukan</p></div>
    </Layout>
  )

  return (
    <Layout title="Detail Outlet">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/outlets')} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Detail Outlet</h1>
            <p className="text-gray-500 text-sm">Informasi lengkap outlet</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">🏪</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">{outlet.name}</h2>
                  {outlet.address && <p className="text-sm text-gray-500 mt-0.5">{outlet.address}</p>}
                  {outlet.phone && <p className="text-sm text-emerald-600 mt-0.5">📞 {outlet.phone}</p>}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${outlet.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {outlet.status === 'active' ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-3">
              Produk Tersedia
              <span className="ml-2 text-xs text-gray-400 font-normal">({products.length} produk)</span>
            </h3>
            {products.length > 0 ? (
              <div className="space-y-2">
                {products.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">📦</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.category?.name || '-'}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600">
                      Rp {Number(p.price).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-6">Belum ada produk di outlet ini</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}