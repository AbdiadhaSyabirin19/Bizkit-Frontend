import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import api from '../../api/axios'
import { usePermission } from '../../hooks/usePermission'

export default function PaymentMethodPage() {
  const [data, setData] = useState([])
  const [outlets, setOutlets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState({ open: false, mode: 'add', item: null })
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({ name: '', show_in_sale: true, show_in_purchase: false, outlet_id: '' })
  const { can } = usePermission()

  useEffect(() => { fetchData(); fetchOutlets() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/payment-methods')
      setData(res.data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const fetchOutlets = async () => {
    try {
      const res = await api.get('/outlets')
      setOutlets(res.data.data || [])
    } catch (err) { console.error(err) }
  }

  const filtered = data.filter(d => d.name?.toLowerCase().includes(search.toLowerCase()))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nama metode wajib diisi'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const openAdd = () => {
    setErrors({})
    setForm({ name: '', show_in_sale: true, show_in_purchase: false, outlet_id: '' })
    setModal({ open: true, mode: 'add', item: null })
  }

  const openEdit = (row) => {
    setErrors({})
    setForm({
      name: row.name || row.Name || '',
      show_in_sale: row.show_in_sale ?? row.ShowInSale ?? true,
      show_in_purchase: row.show_in_purchase ?? row.ShowInPurchase ?? false,
      outlet_id: row.outlet_id || row.OutletID || '',
    })
    setModal({ open: true, mode: 'edit', item: row })
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        show_in_sale: form.show_in_sale,
        show_in_purchase: form.show_in_purchase,
        outlet_id: form.outlet_id ? Number(form.outlet_id) : null,
      }
      if (modal.mode === 'add') await api.post('/payment-methods', payload)
      else await api.put(`/payment-methods/${modal.item.ID}`, payload)
      fetchData()
      setModal({ open: false })
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/payment-methods/${confirm.id}`)
      fetchData()
    } catch (err) { console.error(err) }
    finally { setConfirm({ open: false, id: null }) }
  }

  const Toggle = ({ value, onChange }) => (
    <button type="button" onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-emerald-500' : 'bg-gray-300'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )

  const columns = [
    { key: 'no', label: 'No', render: (row) => filtered.indexOf(row) + 1 },
    {
      key: 'name', label: 'Metode Pembayaran',
      render: (row) => <span className="font-medium text-gray-800">{row.name || row.Name}</span>
    },
    {
      key: 'show_in_sale', label: 'Tampil di Penjualan',
      render: (row) => (row.show_in_sale ?? row.ShowInSale)
        ? <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">✓ Ya</span>
        : <span className="px-2 py-1 bg-gray-100 text-gray-400 rounded-full text-xs">Tidak</span>
    },
    {
      key: 'show_in_purchase', label: 'Tampil di Pembelian',
      render: (row) => (row.show_in_purchase ?? row.ShowInPurchase)
        ? <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">✓ Ya</span>
        : <span className="px-2 py-1 bg-gray-100 text-gray-400 rounded-full text-xs">Tidak</span>
    },
    {
      key: 'outlet', label: 'Outlet',
      render: (row) => {
        const name = row.outlet?.Name || row.outlet?.name || row.Outlet?.Name
        return name
          ? <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">{name}</span>
          : <span className="text-gray-300 text-xs">Semua Outlet</span>
      }
    },
    {
      key: 'aksi', label: 'Aksi',
      render: (row) => (
        <div className="flex gap-2">
          {can('payment_methods', 'edit') && (
            <button onClick={() => openEdit(row)}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs transition">
              Edit
            </button>
          )}
          {can('payment_methods', 'delete') && (
            <button onClick={() => setConfirm({ open: true, id: row.ID })}
              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs transition">
              Hapus
            </button>
          )}
        </div>
      )
    },
  ]

  return (
    <Layout title="Metode Pembayaran">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Metode Pembayaran</h1>
            <p className="text-gray-500 text-sm">Kelola metode pembayaran</p>
          </div>
          {can('payment_methods', 'create') && (
            <button onClick={openAdd}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah
            </button>
          )}
        </div>

        <div className="mb-4">
          <input type="text" placeholder="Cari metode pembayaran..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-xs px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>

        <Table columns={columns} data={filtered} loading={loading} />

        <Modal isOpen={modal.open} onClose={() => setModal({ open: false })}
          title={modal.mode === 'add' ? 'Tambah Metode Pembayaran' : 'Edit Metode Pembayaran'}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Metode <span className="text-red-400">*</span></label>
              <input type="text" value={form.name}
                onChange={e => { setForm(f => ({ ...f, name: e.target.value })); if (errors.name) setErrors(er => ({ ...er, name: '' })) }}
                placeholder="Contoh: Cash, QRIS, Transfer"
                className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                onKeyDown={e => e.key === 'Enter' && handleSave()} />
              {errors.name && <p className="text-xs text-red-400 mt-1">⚠ {errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outlet <span className="text-gray-400 font-normal text-xs">(opsional — kosong = semua outlet)</span></label>
              <select value={form.outlet_id} onChange={e => setForm(f => ({ ...f, outlet_id: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                <option value="">Semua Outlet</option>
                {outlets.map(o => <option key={o.ID} value={o.ID}>{o.Name || o.name}</option>)}
              </select>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-700">Tampil di Penjualan</p>
                <p className="text-xs text-gray-400 mt-0.5">Metode ini muncul saat proses transaksi penjualan</p>
              </div>
              <Toggle value={form.show_in_sale} onChange={v => setForm(f => ({ ...f, show_in_sale: v }))} />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-700">Tampil di Pembelian</p>
                <p className="text-xs text-gray-400 mt-0.5">Metode ini muncul saat proses transaksi pembelian</p>
              </div>
              <Toggle value={form.show_in_purchase} onChange={v => setForm(f => ({ ...f, show_in_purchase: v }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal({ open: false })}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium transition">
                Batal
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-sm font-medium transition">
                {saving ? 'Menyimpan...' : modal.mode === 'add' ? 'Simpan' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </Modal>

        <ConfirmDialog isOpen={confirm.open} onClose={() => setConfirm({ open: false })} onConfirm={handleDelete} />
      </div>
    </Layout>
  )
}