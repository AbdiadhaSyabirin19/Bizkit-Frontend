export default function ConfirmDialog({ isOpen, onClose, onConfirm, message }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-950 rounded-[32px] shadow-2xl w-full max-w-sm z-10 p-8 border border-gray-100 dark:border-gray-800 transition-colors">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <p className="text-gray-800 dark:text-gray-200 font-bold text-lg">{message || 'Yakin ingin menghapus?'}</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1 font-medium">Tindakan ini tidak dapat dibatalkan</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-5 py-3 border border-gray-100 dark:border-gray-800 rounded-2xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all text-sm font-black uppercase tracking-widest"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-5 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl shadow-lg shadow-red-500/20 transition-all text-sm font-black uppercase tracking-widest active:scale-95"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  )
}