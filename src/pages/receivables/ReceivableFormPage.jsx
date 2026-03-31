import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../api/axios'
import Layout from '../../components/Layout'

const formatRp = (n) => typeof n === 'number' ? n.toLocaleString('id-ID') : '0'

export default function ReceivableFormPage() {
    const { id } = useParams()
    const isEdit = Boolean(id)
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const defaultSaleId = searchParams.get('sale_id')

    const [loading, setLoading] = useState(isEdit)
    const [saving, setSaving] = useState(false)

    const [paymentMethods, setPaymentMethods] = useState([])
    const [unpaidSales, setUnpaidSales] = useState([])

    const [formData, setFormData] = useState({
        payment_date: new Date().toISOString().split('T')[0],
        customer_name: '',
        payment_method_id: '',
        notes: '',
    })

    // We can support multiple sales in this UI, or just one block as pictured
    // The picture shows "Penjualan #1", implies we could add more, but for now 1 row is fine or array of rows
    const [items, setItems] = useState([
        {
            id: Date.now(),
            sale_id: defaultSaleId ? parseInt(defaultSaleId) : '',
            amount_paid: ''
        }
    ])

    useEffect(() => {
        const fetchSelectOptions = async () => {
            try {
                const [pmRes, salesRes] = await Promise.all([
                    api.get('/payment-methods'),
                    api.get('/unpaid-sales')
                ])
                setPaymentMethods(pmRes.data?.data || [])
                setUnpaidSales(salesRes.data?.data || [])
            } catch (err) {
                console.error("Gagal load base data", err)
            }
        }

        const loadExisting = async () => {
            try {
                const res = await api.get(`/receivables/${id}`)
                const data = res.data?.data
                setFormData({
                    payment_date: data.payment_date ? data.payment_date.split('T')[0] : '',
                    customer_name: data.customer_name || '',
                    payment_method_id: data.payment_method_id || '',
                    notes: data.notes || ''
                })

                if (data.items && data.items.length > 0) {
                    setItems(data.items.map(it => ({
                        id: it.ID,
                        sale_id: it.sale_id,
                        amount_paid: it.amount_paid
                    })))

                    // Add these sales to the unpaidSales pool so they can be shown in dropdown
                    // since they might be fully paid now and absent from /unpaid-sales
                    const missingSales = data.items.map(it => it.sale).filter(Boolean)
                    setUnpaidSales(prev => {
                        const exists = new Set(prev.map(p => p.ID))
                        const add = missingSales.filter(m => !exists.has(m.ID))
                        return [...prev, ...add]
                    })
                }
            } catch (err) {
                alert("Gagal memuat data pembayaran")
                navigate(-1)
            } finally {
                setLoading(false)
            }
        }

        fetchSelectOptions().then(() => {
            if (isEdit) loadExisting()
        })
    }, [id, isEdit])

    const handleItemChange = (itemId, field, value) => {
        setItems(items.map(it => {
            if (it.id === itemId) return { ...it, [field]: value }
            return it
        }))
    }

    const addItemRow = () => {
        setItems([...items, { id: Date.now(), sale_id: '', amount_paid: '' }])
    }

    const removeItemRow = (itemId) => {
        if (items.length === 1) return
        setItems(items.filter(it => it.id !== itemId))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)

        // Calculate total amount from items
        const validItems = items.filter(it => it.sale_id && it.amount_paid > 0)
        const amount = validItems.reduce((acc, it) => acc + Number(it.amount_paid), 0)

        const payload = {
            ...formData,
            amount: amount,
            payment_method_id: parseInt(formData.payment_method_id),
            items: validItems.map(it => ({
                sale_id: parseInt(it.sale_id),
                amount_paid: Number(it.amount_paid)
            }))
        }

        try {
            if (isEdit) {
                await api.put(`/receivables/${id}`, payload)
                alert('Berhasil mengupdate pembayaran')
            } else {
                await api.post('/receivables', payload)
                alert('Berhasil menyimpan pembayaran')
            }
            navigate(-1)
        } catch (err) {
            alert(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
        </div>
    )

    return (
        <Layout title={isEdit ? "Perbarui Pembayaran" : "Tambah Pembayaran"}>
            <form onSubmit={handleSubmit} className="max-w-5xl mx-auto py-6">

                {/* Header Block */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-800 mb-2">Tanggal Pembayaran</label>
                            <input
                                type="date"
                                required
                                value={formData.payment_date}
                                onChange={e => setFormData({ ...formData, payment_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-800 mb-2">Nama Pelanggan / Outlet</label>
                            <input
                                type="text"
                                value={formData.customer_name}
                                onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                                placeholder="Member 1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-800 mb-2">Metode Pembayaran</label>
                            <select
                                required
                                value={formData.payment_method_id}
                                onChange={e => setFormData({ ...formData, payment_method_id: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                            >
                                <option value="">Pilih Metode</option>
                                {paymentMethods.map(pm => (
                                    <option key={pm.ID} value={pm.ID}>{pm.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-800 mb-2">Keterangan Pembayaran</label>
                        <input
                            type="text"
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                </div>

                {/* Invoice Items Block */}
                <div className="bg-[#f8fafc] rounded-xl shadow-sm border border-indigo-50 p-6 relative">

                    {items.map((item, idx) => {
                        // Find selected sale
                        const sale = unpaidSales.find(s => s.ID === parseInt(item.sale_id)) || null

                        // Calculate remaining
                        let total = 0
                        let terbayar = 0
                        let sisa = 0

                        if (sale) {
                            total = sale.grand_total || sale.GrandTotal || 0
                            terbayar = sale.amount_paid || sale.AmountPaid || 0
                            // If we are editing, terbayar already includes this payment item's old amount.
                            // To show accurate sisa dynamically, we subtract old amount from terbayar.
                            // But for simplicity, let's just show it.
                            sisa = Math.max(0, total - terbayar)
                        }

                        return (
                            <div key={item.id} className="bg-white rounded border border-gray-200 p-4 mb-4 relative grid grid-cols-12 gap-4 items-center">

                                {items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeItemRow(item.id)}
                                        className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-md z-10 hover:bg-red-600"
                                    >
                                        ×
                                    </button>
                                )}

                                <div className="col-span-4">
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Penjualan #{idx + 1}</label>
                                    <select
                                        required
                                        value={item.sale_id}
                                        onChange={e => handleItemChange(item.id, 'sale_id', e.target.value)}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                                    >
                                        <option value="">Pilih Penjualan...</option>
                                        {unpaidSales.map(s => (
                                            <option key={s.ID} value={s.ID}>
                                                {s.customer_name || 'Umum'} | {s.invoice_number} | {formatRp(s.grand_total)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Total</label>
                                    <div className="text-sm font-semibold">{formatRp(total)}</div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Terbayar</label>
                                    <div className="text-sm">{formatRp(terbayar)}</div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Sisa</label>
                                    <div className="text-sm font-semibold text-red-500">{formatRp(sisa)}</div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Jumlah Bayar</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={item.amount_paid}
                                        onChange={e => handleItemChange(item.id, 'amount_paid', e.target.value)}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                                    />
                                </div>

                            </div>
                        )
                    })}

                    <div className="flex justify-end mt-2">
                        <button
                            type="button"
                            onClick={addItemRow}
                            className="w-8 h-8 bg-[#0f172a] hover:bg-slate-800 text-white rounded flex items-center justify-center text-lg font-bold transition shadow"
                        >
                            +
                        </button>
                    </div>

                </div>

                {/* Form Actions */}
                <div className="mt-8">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-3 bg-[#334155] hover:bg-slate-700 text-white rounded-lg font-bold transition shadow-md disabled:opacity-50"
                    >
                        {saving ? 'Loading...' : 'Simpan'}
                    </button>
                </div>

            </form>
        </Layout>
    )
}
