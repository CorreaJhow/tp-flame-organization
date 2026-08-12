import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = 'Confirmar Ação',
  message,
  confirmText = 'Sim, Excluir',
  cancelText = 'Cancelar',
  isDanger = true,
  onConfirm,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#121212] border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
        {/* Top Accent Line */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${isDanger ? 'bg-red-500' : 'bg-[#FF4D00]'}`} />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${
              isDanger 
                ? 'bg-red-950/50 text-red-400 border-red-500/30' 
                : 'bg-[#FF4D00]/10 text-[#FF4D00] border-[#FF4D00]/20'
            }`}>
              {isDanger ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white leading-tight">
                {title}
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#181818] hover:bg-[#222] text-slate-400 hover:text-white transition-colors border border-slate-800 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800/80">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-[#181818] hover:bg-[#222] text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all active:scale-95"
          >
            {cancelText}
          </button>

          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2.5 rounded-xl font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 ${
              isDanger
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-[#FF4D00] hover:bg-[#e04400] text-slate-950'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
