import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'

const getID = (row) => row.ID || row.id

export default function VariantDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [variant, setVariant] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchDetail() }, [id])

  const fetchDetail = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/variants/${id}`)
      setVariant(res.data.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  if (loading) return (
    <Layout title="Detail Varian">
      <div className="flex items-center justify-center py-20 text-gray-400"><p>Memuat data...</p></div>
    </Layout>
  )

  if (!variant) return (
    <Layout title="Detail Varian">
      <div className="flex items-center justify-center py-20 text-gray-400"><p>Varian tidak ditemukan</p></div>
    </Layout>
  )

  return (
    <Layout title="Detail Varian">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/variants')} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Detail Varian</h1>
            <p className="text-gray-500 text-sm">Informasi lengkap varian</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{variant.name}</h2>
                {variant.description && <p className="text-sm text-gray-500 mt-1">{variant.description}</p>}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${variant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {variant.status === 'active' ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Min Pilihan</p>
                <p className="text-2xl font-bold text-gray-800">{variant.min_select}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Maks Pilihan</p>
                <p className="text-2xl font-bold text-gray-800">{variant.max_select}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-3">
              Opsi Varian
              <span className="ml-2 text-xs text-gray-400 font-normal">({variant.options?.length || 0} opsi)</span>
            </h3>
            {variant.options?.length > 0 ? (
              <div className="space-y-2">
                {variant.options.map((o, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold text-emerald-600">{i + 1}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{o.name}</span>
                    </div>
                    <div className="text-right">
                      {o.additional_price > 0 ? (
                        <span className="text-sm font-semibold text-orange-500">+Rp {Number(o.additional_price).toLocaleString('id-ID')}</span>
                      ) : (
                        <span className="text-sm text-gray-400">Gratis</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">Belum ada opsi</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}