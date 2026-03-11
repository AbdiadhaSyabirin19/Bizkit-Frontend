import { useState, useEffect, useRef } from 'react'
import KasirLayout from '../../components/KasirLayout'
import api from '../../api/axios'

// ── helpers ──────────────────────────────────────────────────────────────────
const formatRp = (v) => `Rp ${Number(v || 0).toLocaleString('id-ID')}`
const getID    = (r) => r.ID || r.id

// ── Komponen Popup Keranjang ──────────────────────────────────────────────────
// ── Komponen Popup Keranjang ──────────────────────────────────────────────────
function CartPopup({ cart, paymentMethods, onClose, onSuccess, onUpdateQty, onRemove }) {
  const [step, setStep]                 = useState('cart')
  const [customerName, setCustomerName] = useState('')
  const [nameError, setNameError]       = useState('')
  const [autoPromos, setAutoPromos]     = useState([])
  const [selectedPromo, setSelectedPromo] = useState(null)
  const [loadingPromos, setLoadingPromos] = useState(false)
  const [voucherCode, setVoucherCode]   = useState('')
  const [voucherError, setVoucherError] = useState('')
  const [voucherLoading, setVoucherLoading] = useState(false)
  const [selectedPayments, setSelectedPayments] = useState([{ method_id: '', amount: 0 }])
  const [saving, setSaving]             = useState(false)
  const [receipt, setReceipt]           = useState(null)

  const subtotal   = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const discount   = selectedPromo?.discount_amount || 0
  const grandTotal = Math.max(0, subtotal - discount)
  const totalPaid  = selectedPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const change     = Math.max(0, totalPaid - grandTotal)

  const buildCheckItems = () => cart.map(i => ({
    product_id: getID(i),
    category_id: i.category_id || i.CategoryID || null,
    brand_id: i.brand_id || i.BrandID || null,
    quantity: i.qty,
    price: i.price,
  }))

  useEffect(() => {
    if (cart.length === 0) { setAutoPromos([]); return }
    const fetchPromos = async () => {
      setLoadingPromos(true)
      try {
        const res = await api.post('/promos/check', { items: buildCheckItems(), subtotal })
        const list = res.data?.data || []
        setAutoPromos(list)
        if (selectedPromo && !list.find(p => p.promo_id === selectedPromo.promo_id)) {
          setSelectedPromo(null)
        }
      } catch { setAutoPromos([]) }
      finally { setLoadingPromos(false) }
    }
    fetchPromos()
  }, [JSON.stringify(cart), subtotal])

  const checkVoucher = async () => {
    if (!voucherCode.trim()) return
    setVoucherError('')
    setVoucherLoading(true)
    try {
      const res = await api.post('/promos/check-voucher', {
        code: voucherCode, items: buildCheckItems(), subtotal,
      })
      setSelectedPromo(res.data?.data)
      setVoucherError('')
    } catch (err) {
      setVoucherError(err.response?.data?.message || 'Voucher tidak valid')
      setSelectedPromo(null)
    } finally { setVoucherLoading(false) }
  }

  const removePromo = () => { setSelectedPromo(null); setVoucherCode(''); setVoucherError('') }

  const addPaymentMethod = () => {
    if (selectedPayments.length < 2) setSelectedPayments(p => [...p, { method_id: '', amount: 0 }])
  }
  const updatePayment = (idx, field, val) => {
    setSelectedPayments(p => p.map((pm, i) => i === idx ? { ...pm, [field]: val } : pm))
  }
  const removePaymentMethod = (idx) => {
    setSelectedPayments(p => p.filter((_, i) => i !== idx))
  }

  const handleGoToPayment = () => {
    if (!customerName.trim()) { setNameError('Nama pembeli wajib diisi'); return }
    setNameError('')
    setSelectedPayments([{ method_id: paymentMethods[0]?.ID || '', amount: grandTotal }])
    setStep('payment')
  }

  const handleSubmit = async () => {
    if (!selectedPayments[0]?.method_id || totalPaid < grandTotal) return
    setSaving(true)
    try {
      const payload = {
        payment_method_id: Number(selectedPayments[0].method_id),
        promo_id: selectedPromo?.promo_id || undefined,
        customer_name: customerName,
        items: cart.map(i => ({
          product_id: getID(i),
          quantity: i.qty,
          variants: (i.variantOptions || []).map(v => ({ variant_option_id: Number(v.id) }))
        }))
      }
      const res = await api.post('/sales', payload)
      setReceipt(res.data.data)
      setStep('success')
    } catch (err) {
      alert(err.response?.data?.message || 'Transaksi gagal')
    } finally { setSaving(false) }
  }

  const handlePrint = () => {
    if (!receipt) return
    const win = window.open('', '_blank')
    win.document.write(`
      <!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Struk #${receipt.invoice_number || receipt.InvoiceNumber}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: monospace; font-size: 12px; width: 280px; margin: auto; padding: 12px; }
        h2 { text-align:center; font-size:14px; margin-bottom:4px; }
        .sub { text-align:center; color:#666; font-size:10px; margin-bottom:12px; }
        hr { border:none; border-top:1px dashed #999; margin:8px 0; }
        .row { display:flex; justify-content:space-between; margin:3px 0; }
        .item-name { font-size:11px; margin:3px 0 1px; }
        .item-detail { color:#666; font-size:10px; }
        .total { font-size:14px; font-weight:bold; }
        .footer { text-align:center; color:#999; font-size:10px; margin-top:12px; }
      </style></head><body>
      <h2>BizKit POS</h2>
      <p class="sub">Invoice: ${receipt.invoice_number || receipt.InvoiceNumber}<br>
      Pembeli: ${customerName}<br>
      ${new Date(receipt.created_at || receipt.CreatedAt).toLocaleString('id-ID')}</p>
      <hr>
      ${(receipt.items || []).map(item => `
        <p class="item-name">${item.product?.name || item.product?.Name || '-'}</p>
        <div class="row item-detail">
          <span>${item.quantity || item.Quantity}x ${formatRp(item.base_price || item.BasePrice)}</span>
          <span>${formatRp(item.subtotal || item.Subtotal)}</span>
        </div>
      `).join('')}
      <hr>
      <div class="row"><span>Subtotal</span><span>${formatRp(receipt.subtotal || receipt.Subtotal)}</span></div>
      ${discount > 0 ? `<div class="row"><span>Diskon (${selectedPromo?.name || ''})</span><span>-${formatRp(discount)}</span></div>` : ''}
      <div class="row total"><span>TOTAL</span><span>${formatRp(receipt.grand_total || receipt.GrandTotal)}</span></div>
      <hr>
      <div class="row"><span>Kembalian</span><span>${formatRp(change)}</span></div>
      <p class="footer">Terima kasih sudah berbelanja!</p>
      </body></html>
    `)
    win.document.close(); win.focus()
    setTimeout(() => { win.print(); win.close() }, 400)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={step !== 'success' ? onClose : undefined} />
      <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col">

        {/* STEP: CART */}
        {step === 'cart' && (
          <>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-800 text-lg">Keranjang</h2>
                <p className="text-xs text-gray-400">{cart.length} produk</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-3 space-y-3">

              {/* Nama Pembeli */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Nama Pembeli <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input type="text" value={customerName}
                    onChange={e => { setCustomerName(e.target.value); setNameError('') }}
                    placeholder="Masukkan nama pembeli..."
                    className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition ${nameError ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                  />
                </div>
                {nameError && <p className="text-xs text-red-400 mt-1">⚠ {nameError}</p>}
              </div>

              {/* Item list */}
              {cart.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-gray-50 rounded-2xl p-3">
                  {item.image
                    ? <img src={item.image} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" alt="" />
                    : <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>
                    {item.variantLabel && <p className="text-xs text-gray-400">{item.variantLabel}</p>}
                    <p className="text-emerald-600 font-semibold text-sm mt-0.5">{formatRp(item.price)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button onClick={() => onRemove(idx)} className="text-red-400 hover:text-red-600 transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <div className="flex items-center gap-2">
                      <button onClick={() => onUpdateQty(idx, item.qty - 1)}
                        className="w-7 h-7 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 transition text-sm font-bold">−</button>
                      <span className="w-6 text-center text-sm font-semibold text-gray-800">{item.qty}</span>
                      <button onClick={() => onUpdateQty(idx, item.qty + 1)}
                        className="w-7 h-7 bg-emerald-500 hover:bg-emerald-600 rounded-lg flex items-center justify-center text-white transition text-sm font-bold">+</button>
                    </div>
                    <p className="text-xs font-semibold text-gray-700">{formatRp(item.price * item.qty)}</p>
                  </div>
                </div>
              ))}

              {/* Promo Otomatis */}
              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-600">🏷️ Promo Tersedia</p>
                  {loadingPromos && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-500" />}
                </div>
                {!loadingPromos && autoPromos.length === 0 ? (
                  <p className="text-xs text-gray-400 px-3 py-3">Tidak ada promo untuk keranjang ini</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {autoPromos.map(promo => {
                      const isSelected = selectedPromo?.promo_id === promo.promo_id && !voucherCode
                      return (
                        <button key={promo.promo_id}
                          onClick={() => { setSelectedPromo(isSelected ? null : promo); setVoucherCode('') }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition ${isSelected ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}>
                          <div>
                            <p className={`text-xs font-semibold ${isSelected ? 'text-emerald-700' : 'text-gray-700'}`}>{promo.name}</p>
                            <p className="text-xs text-gray-400">{promo.description}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <span className={`text-xs font-bold ${isSelected ? 'text-emerald-600' : 'text-gray-500'}`}>-{formatRp(promo.discount_amount)}</span>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition ${isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}>
                              {isSelected && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Kode Voucher */}
              <div className="border border-dashed border-gray-200 rounded-2xl p-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">🎟️ Kode Voucher</p>
                {selectedPromo && voucherCode ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 font-mono">{voucherCode}</p>
                      <p className="text-xs text-emerald-600">{selectedPromo.name} — Hemat {formatRp(selectedPromo.discount_amount)}</p>
                    </div>
                    <button onClick={removePromo} className="text-red-400 hover:text-red-600 text-xs font-medium">Hapus</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input value={voucherCode}
                      onChange={e => { setVoucherCode(e.target.value.toUpperCase()); setVoucherError('') }}
                      onKeyDown={e => e.key === 'Enter' && checkVoucher()}
                      placeholder="Masukkan kode voucher..."
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 font-mono uppercase" />
                    <button onClick={checkVoucher} disabled={voucherLoading || !voucherCode.trim()}
                      className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1">
                      {voucherLoading ? <div className="animate-spin rounded-full h-3 w-3 border-b border-white" /> : 'Pakai'}
                    </button>
                  </div>
                )}
                {voucherError && <p className="text-xs text-red-400 mt-1.5">⚠ {voucherError}</p>}
              </div>
            </div>

            {/* Summary + CTA */}
            <div className="px-5 py-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span><span>{formatRp(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Diskon ({selectedPromo?.name})</span>
                  <span>-{formatRp(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-800 text-lg pt-1 border-t border-gray-100">
                <span>Total</span><span className="text-emerald-600">{formatRp(grandTotal)}</span>
              </div>
              <button onClick={handleGoToPayment} disabled={cart.length === 0}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-2xl font-semibold text-sm transition mt-1">
                Lanjut Pembayaran →
              </button>
            </div>
          </>
        )}

        {/* STEP: PAYMENT */}
        {step === 'payment' && (
          <>
            <div className="flex items-center gap-3 px-5 pt-5 pb-3 border-b border-gray-100">
              <button onClick={() => setStep('cart')} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h2 className="font-bold text-gray-800 text-lg">Pembayaran</h2>
                <p className="text-xs text-gray-400">Atas nama: <span className="font-semibold text-gray-600">{customerName}</span></p>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              <div className="bg-emerald-50 rounded-2xl p-4 text-center">
                <p className="text-xs text-emerald-600 mb-1">Total Tagihan</p>
                <p className="text-3xl font-bold text-emerald-700">{formatRp(grandTotal)}</p>
                {discount > 0 && <p className="text-xs text-emerald-500 mt-1">Sudah termasuk diskon {formatRp(discount)}</p>}
              </div>

              {selectedPayments.map((pm, idx) => (
                <div key={idx} className="bg-gray-50 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">
                      {selectedPayments.length > 1 ? `Pembayaran ${idx + 1}` : 'Metode Pembayaran'}
                    </p>
                    {idx > 0 && <button onClick={() => removePaymentMethod(idx)} className="text-xs text-red-400 hover:text-red-600">Hapus</button>}
                  </div>
                  <select value={pm.method_id} onChange={e => updatePayment(idx, 'method_id', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white">
                    <option value="">Pilih metode pembayaran</option>
                    {paymentMethods.map(m => <option key={m.ID} value={m.ID}>{m.Name || m.name}</option>)}
                  </select>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      {idx === 0 && selectedPayments.length === 1 ? 'Nominal Dibayar' : `Nominal Pembayaran ${idx + 1}`}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                      <input type="number" value={pm.amount}
                        onChange={e => updatePayment(idx, 'amount', e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    </div>
                    {idx === 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {[grandTotal, Math.ceil(grandTotal/10000)*10000, Math.ceil(grandTotal/50000)*50000, Math.ceil(grandTotal/100000)*100000]
                          .filter((v, i, arr) => arr.indexOf(v) === i && v >= grandTotal).slice(0, 4)
                          .map(v => (
                            <button key={v} onClick={() => updatePayment(0, 'amount', v)}
                              className="px-3 py-1 bg-white border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-lg text-xs font-medium text-gray-600 transition">
                              {formatRp(v)}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {selectedPayments.length < 2 && (
                <button onClick={addPaymentMethod}
                  className="w-full py-2.5 border-2 border-dashed border-gray-200 hover:border-emerald-400 rounded-2xl text-sm text-gray-500 hover:text-emerald-600 transition">
                  + Tambah Metode Pembayaran (Split)
                </button>
              )}

              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Total Dibayar</span>
                  <span className={totalPaid >= grandTotal ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>
                    {formatRp(totalPaid)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-800 border-t border-gray-200 pt-2">
                  <span>Kembalian</span>
                  <span className="text-emerald-600">{formatRp(change)}</span>
                </div>
              </div>
              {totalPaid < grandTotal && (
                <p className="text-xs text-red-400 text-center">⚠ Nominal dibayar kurang {formatRp(grandTotal - totalPaid)}</p>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-100">
              <button onClick={handleSubmit}
                disabled={saving || !selectedPayments[0]?.method_id || totalPaid < grandTotal}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-2xl font-semibold text-sm transition flex items-center justify-center gap-2">
                {saving ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Memproses...</> : '✓ Proses Transaksi'}
              </button>
            </div>
          </>
        )}

        {/* STEP: SUCCESS */}
        {step === 'success' && receipt && (
          <div className="flex flex-col items-center px-5 py-8 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Transaksi Berhasil!</h2>
            <p className="text-sm text-gray-500 mb-0.5">{receipt.invoice_number || receipt.InvoiceNumber}</p>
            <p className="text-xs text-gray-400 mb-3">Pembeli: <span className="font-semibold">{customerName}</span></p>
            <p className="text-3xl font-bold text-emerald-600 mb-1">{formatRp(receipt.grand_total || receipt.GrandTotal)}</p>
            {change > 0 && <p className="text-sm text-gray-500 mb-6">Kembalian: <span className="font-semibold text-gray-700">{formatRp(change)}</span></p>}
            <div className="w-full space-y-3 mt-4">
              <button onClick={handlePrint}
                className="w-full py-3 border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 rounded-2xl font-semibold text-sm transition flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Cetak Struk
              </button>
              <button onClick={onSuccess}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold text-sm transition">
                Transaksi Baru
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Popup Pilih Varian ────────────────────────────────────────────────────────
function VariantPopup({ product, onClose, onAdd }) {
  const [selected, setSelected] = useState({})
  const [qty, setQty] = useState(1)

  const variants = product.variants || []

  const toggle = (variantId, option) => {
    setSelected(s => ({ ...s, [variantId]: option }))
  }

  const isComplete = variants.length === 0 || variants.every(v => selected[v.id || v.ID])

  const handleAdd = () => {
    const variantOptions = Object.values(selected)
    const extraPrice = variantOptions.reduce((s, o) => s + (o.additional_price || 0), 0)
    const variantLabel = variantOptions.map(o => o.name).join(', ')
    onAdd({
      ...product,
      price: (product.price || 0) + extraPrice,
      variantLabel: variantLabel || null,
      variantOptions: variantOptions.map(o => ({ id: o.id || o.ID })),
      qty,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl p-5">
        <div className="flex items-start gap-3 mb-4">
          {product.image
            ? <img src={product.image} className="w-16 h-16 rounded-2xl object-cover" />
            : <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl">🛍️</div>
          }
          <div>
            <h3 className="font-bold text-gray-800">{product.name}</h3>
            <p className="text-emerald-600 font-semibold text-sm">{formatRp(product.price)}</p>
            {product.stock !== undefined && (
              <p className="text-xs text-gray-400">Stok: {product.stock}</p>
            )}
          </div>
        </div>

        {variants.map(variant => (
          <div key={variant.id || variant.ID} className="mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">{variant.name}</p>
            <div className="flex flex-wrap gap-2">
              {(variant.options || []).map(opt => {
                const isSelected = selected[variant.id || variant.ID]?.id === (opt.id || opt.ID) ||
                                   selected[variant.id || variant.ID]?.ID === (opt.id || opt.ID)
                return (
                  <button key={opt.id || opt.ID}
                    onClick={() => toggle(variant.id || variant.ID, { ...opt, id: opt.id || opt.ID })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                      isSelected ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-emerald-300'
                    }`}>
                    {opt.name}
                    {opt.additional_price > 0 && <span className="ml-1 text-orange-500">+{formatRp(opt.additional_price)}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* Qty */}
        <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-3 mb-4">
          <span className="text-sm font-medium text-gray-700">Jumlah</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setQty(q => Math.max(1, q - 1))}
              className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100">−</button>
            <span className="w-8 text-center font-bold text-gray-800">{qty}</span>
            <button onClick={() => setQty(q => q + 1)}
              className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white hover:bg-emerald-600">+</button>
          </div>
        </div>

        <button onClick={handleAdd} disabled={!isComplete}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-2xl font-semibold text-sm transition">
          + Tambah ke Keranjang · {formatRp((product.price || 0) + Object.values(selected).reduce((s, o) => s + (o.additional_price || 0), 0))} × {qty}
        </button>
      </div>
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function KasirPage() {
  const [products, setProducts]           = useState([])
  const [categories, setCategories]       = useState([])
  const [brands, setBrands]               = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [loading, setLoading]             = useState(true)

  const [search, setSearch]               = useState('')
  const [filterCat, setFilterCat]         = useState('')
  const [filterBrand, setFilterBrand]     = useState('')

  const [cart, setCart]                   = useState([])
  const [showCart, setShowCart]           = useState(false)
  const [variantPopup, setVariantPopup]   = useState(null)

  const searchRef = useRef()

  useEffect(() => {
    fetchAll()
    searchRef.current?.focus()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [pRes, cRes, bRes, pmRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
        api.get('/brands'),
        api.get('/payment-methods'),
      ])
      setProducts(pRes.data.data || [])
      setCategories(cRes.data.data || [])
      setBrands(bRes.data.data || [])
      setPaymentMethods(pmRes.data.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      p.name?.toLowerCase().includes(q) ||
      p.code?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q)
    const matchCat    = !filterCat   || String(p.category_id) === String(filterCat)
    const matchBrand  = !filterBrand || String(p.brand_id)    === String(filterBrand)
    return matchSearch && matchCat && matchBrand
  })

  const handleProductClick = (product) => {
    if (product.variants?.length > 0) {
      setVariantPopup(product)
    } else {
      addToCart({ ...product, qty: 1, variantOptions: [], variantLabel: null })
    }
  }

  const addToCart = (item) => {
    setCart(c => {
      const key = `${getID(item)}_${item.variantLabel || ''}`
      const idx = c.findIndex(i => `${getID(i)}_${i.variantLabel || ''}` === key)
      if (idx >= 0) {
        const updated = [...c]
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + (item.qty || 1) }
        return updated
      }
      return [...c, { ...item, qty: item.qty || 1 }]
    })
  }

  const updateQty = (idx, qty) => {
    if (qty <= 0) setCart(c => c.filter((_, i) => i !== idx))
    else setCart(c => c.map((item, i) => i === idx ? { ...item, qty } : item))
  }

  const removeFromCart = (idx) => setCart(c => c.filter((_, i) => i !== idx))

  const clearCart = () => {
    setCart([])
    setShowCart(false)
    setSearch('')
    setFilterCat('')
    setFilterBrand('')
    searchRef.current?.focus()
  }

  const totalItems = cart.reduce((s, i) => s + i.qty, 0)
  const totalPrice = cart.reduce((s, i) => s + i.price * i.qty, 0)

  return (
    <KasirLayout title="Kasir">
      <div className="max-w-7xl mx-auto select-none">

        {/* ── Top Bar ── */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input ref={searchRef} type="text" placeholder="Cari nama / kode produk..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white" />
            </div>
          </div>

          {/* Filter Kategori */}
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white">
            <option value="">Semua Kategori</option>
            {categories.map(c => <option key={getID(c)} value={getID(c)}>{c.name}</option>)}
          </select>

          {/* Filter Brand */}
          <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white">
            <option value="">Semua Brand</option>
            {brands.map(b => <option key={getID(b)} value={getID(b)}>{b.name}</option>)}
          </select>

          {/* Tombol Keranjang */}
          <button onClick={() => setShowCart(true)} disabled={cart.length === 0}
            className="relative flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Keranjang
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </button>
        </div>

        {/* ── Bottom Bar Total (sticky) ── */}
        {cart.length > 0 && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-emerald-600 text-white rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-6 text-sm font-medium">
            <span>{totalItems} item</span>
            <span className="font-bold text-lg">{formatRp(totalPrice)}</span>
            <button onClick={() => setShowCart(true)}
              className="bg-white text-emerald-700 px-4 py-1.5 rounded-xl font-semibold text-sm hover:bg-emerald-50 transition">
              Bayar
            </button>
          </div>
        )}

        {/* ── Grid Produk ── */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-3 animate-pulse">
                <div className="w-full aspect-square bg-gray-200 rounded-xl mb-2" />
                <div className="h-3 bg-gray-200 rounded mb-1 w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-3">🔍</p>
            <p className="font-medium">Produk tidak ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-24">
            {filtered.map(product => {
              const inCart = cart.filter(i => getID(i) === getID(product)).reduce((s, i) => s + i.qty, 0)
              return (
                <button key={getID(product)} onClick={() => handleProductClick(product)}
                  className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 hover:border-emerald-300 hover:shadow-md transition text-left active:scale-95 relative">
                  {inCart > 0 && (
                    <span className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full text-white text-xs flex items-center justify-center font-bold z-10">
                      {inCart}
                    </span>
                  )}
                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-100 mb-2 flex items-center justify-center">
                    {product.image
                      ? <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
                      : <span className="text-3xl">🛍️</span>
                    }
                  </div>
                  <p className="text-xs font-semibold text-gray-800 line-clamp-2 mb-1 leading-tight">{product.name}</p>
                  {(product.code || product.sku) && (
                    <p className="text-xs text-gray-400 font-mono mb-0.5">{product.code || product.sku}</p>
                  )}
                  <p className="text-xs font-bold text-emerald-600">{formatRp(product.price)}</p>
                  {product.stock !== undefined && (
                    <p className={`text-xs mt-0.5 ${product.stock <= 5 ? 'text-red-400' : 'text-gray-400'}`}>
                      Stok: {product.stock}
                    </p>
                  )}
                  {product.variants?.length > 0 && (
                    <p className="text-xs text-blue-400 mt-0.5">Pilih varian →</p>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Popup Keranjang ── */}
      {showCart && (
        <CartPopup
          cart={cart}
          paymentMethods={paymentMethods}
          onClose={() => setShowCart(false)}
          onSuccess={clearCart}
          onUpdateQty={updateQty}
          onRemove={removeFromCart}
        />
      )}

      {/* ── Popup Varian ── */}
      {variantPopup && (
        <VariantPopup
          product={variantPopup}
          onClose={() => setVariantPopup(null)}
          onAdd={addToCart}
        />
      )}
    </KasirLayout>
  )
}