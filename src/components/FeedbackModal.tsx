import React, { useState } from 'react';
import { X, MessageSquarePlus, Send, Bug, Lightbulb, CheckCircle2, HeartHandshake } from 'lucide-react';
import { storage } from '../services/storage';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [type, setType] = useState<'sugestao' | 'bug'>('sugestao');
  const [nome, setNome] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmitSystem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensagem.trim()) return;

    const feedbackText = `[${type.toUpperCase()}] ${nome ? `De: ${nome} - ` : ''}${mensagem}`;
    storage.addLog('FEEDBACK', feedbackText);

    // Also send to GAS if configured
    storage.sendToGas('Logs', 'insert', {
      ID: Date.now().toString(),
      Data_Hora: new Date().toISOString(),
      Acao: 'FEEDBACK',
      Detalhes: feedbackText
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setMensagem('');
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#121212] border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-[#181818]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF4D00]/10 text-[#FF4D00] border border-[#FF4D00]/20 flex items-center justify-center">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Caixa de Sugestões & Bugs</h2>
              <p className="text-xs text-slate-400">Envie ideias ou reporte falhas do sistema</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#080808] hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Obrigado pelo Feedback!</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Sua mensagem foi enviada e registrada no sistema com sucesso.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitSystem} className="space-y-4">
              {/* Type selector */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Tipo de Mensagem
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('sugestao')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      type === 'sugestao'
                        ? 'bg-[#FF4D00] text-slate-950 border-[#FF4D00] shadow-md'
                        : 'bg-[#080808] text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <Lightbulb className="w-4 h-4" />
                    <span>Sugestão / Ideia</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('bug')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      type === 'bug'
                        ? 'bg-red-500 text-white border-red-500 shadow-md'
                        : 'bg-[#080808] text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <Bug className="w-4 h-4" />
                    <span>Reportar Bug</span>
                  </button>
                </div>
              </div>

              {/* Name (Optional) */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Seu Nome / Função <span className="text-slate-500 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Gabriel (Violão)"
                  className="w-full bg-[#080808] border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#FF4D00]"
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Descreva o que aconteceu ou sua ideia <span className="text-[#FF4D00]">*</span>
                </label>
                <textarea
                  rows={4}
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder={
                    type === 'sugestao'
                      ? 'Ex: Seria legal ter uma contagem regressiva para os cultos...'
                      : 'Ex: Ao tentar abrir a cifra x no celular a tela ficou preta...'
                  }
                  required
                  className="w-full bg-[#080808] border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#FF4D00] resize-none"
                />
              </div>

              {/* Submit options */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!mensagem.trim()}
                  className="w-full py-3 px-4 rounded-xl bg-[#FF4D00] hover:bg-[#e04400] disabled:opacity-30 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar para o Registro do Sistema</span>
                </button>
              </div>

              <div className="p-3 bg-[#080808] border border-slate-800/80 rounded-xl text-[11px] text-slate-400 flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-[#FF4D00] shrink-0" />
                <span>Obrigado por ajudar a evoluir o sistema do nosso ministério!</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
