export default function ConfirmModal({ title, message, confirmLabel = 'Confirm', confirmDanger = false, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-dark-900/70 animate-fadeIn">
      <div className="glass-panel w-full max-w-sm rounded-[2rem] p-7 animate-slideIn shadow-2xl border border-white/10">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-light-300/60 mb-7 leading-relaxed">{message}</p>
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-white/5 text-light-300 hover:text-white hover:bg-white/10 transition-all font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 ${
              confirmDanger
                ? 'bg-red-500/80 hover:bg-red-500 text-white shadow-lg shadow-red-500/20'
                : 'bg-brand-primary text-white shadow-brand'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
