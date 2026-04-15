import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../api/axios'

// ── Konstanta ────────────────────────────────────────────────────────────────
const QUEUE_KEY = 'bizkit_offline_queue'
const MAX_BATCH  = 50 // kirim 50 per batch agar tidak overload

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Membuat UUID v4 sesuai format yang diterima backend.
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** Baca antrian offline dari localStorage. */
function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  } catch {
    return []
  }
}

/** Simpan antrian ke localStorage. */
function saveQueue(queue) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch (e) {
    console.error('[OfflineSync] Gagal menyimpan antrian:', e)
  }
}

// ── Hook Utama ────────────────────────────────────────────────────────────────

/**
 * useOfflineSync
 * 
 * Menyediakan:
 * - isOnline: boolean status koneksi saat ini
 * - pendingCount: jumlah transaksi yang belum tersinkronisasi
 * - isSyncing: sedang proses sinkronisasi
 * - lastSyncResult: hasil sinkronisasi terakhir
 * - submitTransaction(payload): kirim transaksi (online → API, offline → queue)
 * - syncQueue(): paksa sinkronisasi manual
 */
export function useOfflineSync() {
  const [isOnline, setIsOnline]           = useState(() => navigator.onLine)
  const [pendingCount, setPendingCount]   = useState(() => getQueue().length)
  const [isSyncing, setIsSyncing]         = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState(null)

  // Ref agar syncQueue bisa dipanggil di dalam event listener tanpa stale closure
  const isSyncingRef = useRef(false)

  // Perbarui jumlah pending dari localStorage
  const refreshCount = useCallback(() => {
    setPendingCount(getQueue().length)
  }, [])

  // ── Sinkronisasi antrian ke server ─────────────────────────────────────────
  const syncQueue = useCallback(async () => {
    if (isSyncingRef.current) return // hindari double-sync
    const queue = getQueue()
    if (queue.length === 0) return

    isSyncingRef.current = true
    setIsSyncing(true)

    try {
      // Kirim dalam batch agar tidak overload server
      const batch = queue.slice(0, MAX_BATCH)
      const res   = await api.post('/sales/sync', { transactions: batch })
      const { results = [] } = res.data

      // Hanya item dengan status 'failed' yang dipertahankan di antrian
      const failedIds = new Set(
        results.filter((r) => r.status === 'failed').map((r) => r.offline_id)
      )
      const remaining = queue.filter((t) => failedIds.has(t.offline_id))
      saveQueue(remaining)
      setPendingCount(remaining.length)
      setLastSyncResult({ ...res.data, timestamp: new Date().toISOString() })
    } catch (err) {
      // Jaringan gagal — pertahankan antrian, coba lagi nanti
      console.warn('[OfflineSync] Sync gagal, antrian dipertahankan:', err.message)
    } finally {
      isSyncingRef.current = false
      setIsSyncing(false)
    }
  }, [])

  // ── Listener online / offline ───────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Tunda sedikit agar koneksi benar-benar stabil
      setTimeout(() => syncQueue(), 1500)
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [syncQueue])

  // ── submitTransaction ───────────────────────────────────────────────────────
  /**
   * Mengirim satu transaksi.
   * - Jika online: langsung ke API POST /sales
   * - Jika offline atau jaringan gagal: simpan ke antrian localStorage
   * 
   * Return:
   *   { success: true, data: <server receipt>, offline: false }
   *   { success: true, pendingInvoice: <string>, offline: true }
   */
  const submitTransaction = useCallback(async (payload) => {
    // ─── Mode Online ──────────────────────────────────────────────────────────
    if (navigator.onLine) {
      try {
        const res = await api.post('/sales', payload)
        return { success: true, data: res.data.data, offline: false }
      } catch (err) {
        // Jika bukan error dari server (timeout / network error), simpan offline
        if (!err.response) {
          return _saveOffline(payload, setPendingCount)
        }
        // Error server (400, 422, dll) — lempar agar bisa ditangkap caller
        throw err
      }
    }

    // ─── Mode Offline ────────────────────────────────────────────────────────
    return _saveOffline(payload, setPendingCount)
  }, [])

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncResult,
    submitTransaction,
    syncQueue,
    refreshCount,
  }
}

// ── Helper Internal ───────────────────────────────────────────────────────────

/**
 * Menyimpan payload transaksi ke antrian localStorage.
 * Menghasilkan UUID sebagai offline_id dan mengembalikan "struk sementara".
 */
function _saveOffline(payload, setPendingCount) {
  const offlineId = generateUUID()
  const soldAt    = new Date().toISOString()
  const shortId   = offlineId.slice(0, 8).toUpperCase()

  const offlineEntry = {
    ...payload,
    offline_id: offlineId,
    sold_at:    soldAt,
    source:     payload.source || 'pos',
  }

  const queue = getQueue()
  queue.push(offlineEntry)
  saveQueue(queue)
  setPendingCount(queue.length)

  return {
    success:        true,
    offline:        true,
    pendingInvoice: `OFFLINE-${shortId}`,
    offlineId,
  }
}
