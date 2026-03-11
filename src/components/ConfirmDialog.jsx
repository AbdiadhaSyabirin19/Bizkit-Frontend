export default function ConfirmDialog({ isOpen, onClose, onConfirm, message }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm z-10 p-6">
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <p className="text-gray-700 font-medium">{message || 'Yakin ingin menghapus data ini?'}</p>
          <p className="text-gray-400 text-sm mt-1">Tindakan ini tidak dapat dibatalkan</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition text-sm font-medium"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition text-sm font-medium"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  )
}