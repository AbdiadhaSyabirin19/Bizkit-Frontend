import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import { usePermission } from '../../hooks/usePermission'

const formatRp = (n) => typeof n === 'number' ? n.toLocaleString('id-ID') : '0'
const formatDate = (str) => {
    if (!str) return '-'
    const d = new Date(str)
    const pad = (n) => String(n).padStart(2, '0')
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`
}

export default function PaymentHistoryPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { can } = usePermission()

    const [sale, setSale] = useState(null)
    const [payments, setPayments] = useState([])
    const [loading, setLoading] = useState(true)

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isEdit, setIsEdit] = useState(false)
    const [paymentMethods, setPaymentMethods] = useState([])
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        id: null,
        amount_paid: '',
        payment_method_id: '',
        payment_date: new Date().toISOString().slice(0, 16).replace('T', ' ')
    })

    const fetchData = async () => {
        setLoading(true)
        try {
            const [saleRes, payRes] = await Promise.all([
                api.get(`/sales/${id}`),
                api.get(`/sales/${id}/payments`)
            ])
            setSale(saleRes.data?.data)
            setPayments(payRes.data?.data || [])
        } catch (err) {
            console.error(err)
            const msg = err.response?.data?.message || err.message || "Unknown error"
            const status = err.response?.status || ""
            alert(`Gagal memuat histori pembayaran. \nError: ${status} ${msg}`)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
        fetchPaymentMethods()
    }, [id])

    const fetchPaymentMethods = async () => {
        try {
            const res = await api.get('/payment-methods')
            setPaymentMethods(res.data?.data || [])
        } catch (err) { }
    }

    const openModal = (payment = null) => {
        if (payment) {
            setIsEdit(true)
            setFormData({
                id: payment.receivable_payment_id || payment.receivable_payment?.ID,
                amount_paid: payment.amount_paid || '',
                payment_method_id: payment.receivable_payment?.payment_method_id || '',
                payment_date: payment.receivable_payment?.payment_date ? payment.receivable_payment.payment_date.slice(0, 16).replace('T', ' ') : new Date().toISOString().slice(0, 16).replace('T', ' ')
            })
        } else {
            setIsEdit(false)
            setFormData({
                id: null,
                amount_paid: '',
                payment_method_id: '',
                payment_date: new Date().toISOString().slice(0, 16).replace('T', ' ')
            })
        }
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)

        const payload = {
            payment_date: formData.payment_date.replace(' ', 'T') + ':00Z',
            customer_name: sale.customer_name || 'Umum',
            payment_method_id: parseInt(formData.payment_method_id),
            notes: isEdit ? 'Update cicilan' : 'Cicilan',
            amount: Number(formData.amount_paid),
            items: [
                {
                    sale_id: parseInt(id),
                    amount_paid: Number(formData.amount_paid)
                }
            ]
        }

        try {
            if (isEdit) {
                await api.put(`/receivables/${formData.id}`, payload)
            } else {
                await api.post('/receivables', payload)
            }
            setIsModalOpen(false)
            fetchData()
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menyimpan pembayaran')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
        </div>
    )

    if (!sale) return null

    // Calculate remaining
    const grandTotal = sale.grand_total || sale.GrandTotal || 0
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount_paid || p.AmountPaid || 0), 0)
    const remaining = Math.max(0, grandTotal - totalPaid)

    return (
        <Layout title="Histori Pembayaran Piutang Penjualan">
            <div className="max-w-6xl mx-auto py-6 relative">

                <div className="flex justify-center mb-8 relative z-10">
                    <button
                        onClick={() => openModal()}
                        className="px-6 py-2 bg-[#14b8a6] hover:bg-[#0f766e] text-white rounded-full text-sm font-semibold transition shadow-sm"
                    >
                        Tambah Pembayaran
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className="grid grid-cols-1 gap-1 text-sm text-gray-600">
                            <div><span className="w-32 inline-block">ID Penjualan:</span> <span className="text-gray-900">{sale.invoice_number}</span></div>
                            <div><span className="w-32 inline-block">Total Pembelian:</span> <span className="text-gray-900">{formatRp(grandTotal)}</span></div>
                            <div><span className="w-32 inline-block">Sisa Pembayaran:</span> <span className="text-gray-900">{formatRp(remaining)}</span></div>
                        </div>

                        <div className="relative w-64 self-end">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900 font-bold text-lg">🔍</span>
                            <input
                                type="text"
                                placeholder=""
                                className="w-full pl-10 pr-4 py-1.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left bg-white whitespace-nowrap">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="px-4 py-4 text-xs font-bold text-gray-800 tracking-wide w-16">
                                        No
                                        <svg className="w-3 h-3 inline-block ml-1 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l4 6H8l4-6zm0 20l-4-6h8l-4 6z" /></svg>
                                    </th>
                                    <th className="px-4 py-4 text-xs font-bold text-gray-800 tracking-wide">
                                        ID Pembayaran
                                        <svg className="w-3 h-3 inline-block ml-1 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l4 6H8l4-6zm0 20l-4-6h8l-4 6z" /></svg>
                                    </th>
                                    <th className="px-4 py-4 text-xs font-bold text-gray-800 tracking-wide">
                                        Metode Pembayaran
                                        <svg className="w-3 h-3 inline-block ml-1 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l4 6H8l4-6zm0 20l-4-6h8l-4 6z" /></svg>
                                    </th>
                                    <th className="px-4 py-4 text-xs font-bold text-gray-800 tracking-wide">
                                        Jumlah Pembayaran
                                        <svg className="w-3 h-3 inline-block ml-1 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l4 6H8l4-6zm0 20l-4-6h8l-4 6z" /></svg>
                                    </th>
                                    <th className="px-4 py-4 text-xs font-bold text-gray-800 tracking-wide">
                                        Sisa Pembayaran
                                        <svg className="w-3 h-3 inline-block ml-1 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l4 6H8l4-6zm0 20l-4-6h8l-4 6z" /></svg>
                                    </th>
                                    <th className="px-4 py-4 text-xs font-bold text-gray-800 tracking-wide">
                                        Tanggal Pembayaran
                                        <svg className="w-3 h-3 inline-block ml-1 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l4 6H8l4-6zm0 20l-4-6h8l-4 6z" /></svg>
                                    </th>
                                    <th className="px-4 py-4 text-xs font-bold text-gray-800 tracking-wide text-center">
                                        Aksi
                                        <svg className="w-3 h-3 inline-block ml-1 text-transparent" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l4 6H8l4-6zm0 20l-4-6h8l-4 6z" /></svg>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {payments.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center py-10 text-gray-500 text-sm">Belum ada history pembayaran</td></tr>
                                ) : (
                                    payments.map((pItem, idx) => {
                                        return (
                                            <tr key={idx} className="text-sm">
                                                <td className="px-4 py-4 text-gray-600">{idx + 1}</td>
                                                <td className="px-4 py-4 text-gray-600">{pItem.receivable_payment?.ID || pItem.receivable_payment_id}</td>
                                                <td className="px-4 py-4 text-gray-600">{pItem.receivable_payment?.payment_method?.name || '-'}</td>
                                                <td className="px-4 py-4 text-gray-600">{formatRp(pItem.amount_paid)}</td>
                                                <td className="px-4 py-4 text-gray-600">
                                                    {formatRp(Math.max(0, grandTotal - payments.slice(0, idx + 1).reduce((s, x) => s + x.amount_paid, 0)))}
                                                </td>
                                                <td className="px-4 py-4 text-gray-600">{formatDate(pItem.receivable_payment?.payment_date)}</td>
                                                <td className="px-4 py-4 text-center">
                                                    <button
                                                        onClick={() => openModal(pItem)}
                                                        className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-full text-xs font-semibold transition"
                                                    >
                                                        Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Tambah/Edit Pembayaran */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800">
                                {isEdit ? 'Edit Pembayaran' : 'Tambah Pembayaran'} <span className="text-gray-400 font-normal">| ID Penjualan: {sale.invoice_number}</span>
                            </h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6">
                            <div className="space-y-6">
                                {/* Jumlah Pembayaran */}
                                <div className="grid grid-cols-12 items-center gap-4">
                                    <label className="col-span-4 text-sm font-medium text-gray-700">Jumlah Pembayaran</label>
                                    <div className="col-span-8">
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={formData.amount_paid}
                                            onChange={e => setFormData({ ...formData, amount_paid: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Metode Pembayaran */}
                                <div className="grid grid-cols-12 items-center gap-4">
                                    <label className="col-span-4 text-sm font-medium text-gray-700">Metode Pembayaran</label>
                                    <div className="col-span-8">
                                        <select
                                            required
                                            value={formData.payment_method_id}
                                            onChange={e => setFormData({ ...formData, payment_method_id: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 outline-none bg-white text-gray-700"
                                        >
                                            <option value="" className="text-gray-400">[Metode Bayar]</option>
                                            {paymentMethods.map(pm => (
                                                <option key={pm.ID} value={pm.ID}>{pm.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Tanggal Bayar */}
                                <div className="grid grid-cols-12 items-center gap-4">
                                    <label className="col-span-4 text-sm font-medium text-gray-700">Tanggal Bayar</label>
                                    <div className="col-span-8">
                                        <input
                                            type="text"
                                            required
                                            value={formData.payment_date}
                                            onChange={e => setFormData({ ...formData, payment_date: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Sisa Pembayaran Dynamic */}
                                <div className="grid grid-cols-12 items-center gap-4 pt-4">
                                    <label className="col-span-4 text-sm font-medium text-gray-700">Sisa Pembayaran</label>
                                    <div className="col-span-8">
                                        <div className="text-sm font-medium text-gray-900">
                                            {
                                                formatRp(Math.max(0, remaining - (isEdit ? 0 : Number(formData.amount_paid || 0))))
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-5 py-2 border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition"
                                >
                                    Close
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 bg-[#374151] hover:bg-gray-800 text-white rounded-full text-sm font-medium flex items-center gap-2 transition disabled:opacity-50"
                                >
                                    {saving ? 'Loading...' : (isEdit ? 'Update Pembayaran' : 'Tambah Data Pembayaran')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    )
}
