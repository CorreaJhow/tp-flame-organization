import React, { useState } from 'react';
import { User, Check, X, LogOut, Music, Mic, Guitar } from 'lucide-react';
import { Integrante } from '../types';
import { storage } from '../services/storage';
import { useToast } from '../context/ToastContext';

interface MemberProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileChanged: () => void;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileChanged
}) => {
  const { showToast } = useToast();
  const activeMember = storage.getActiveMember();
  const integrantes = storage.getIntegrantes();

  const [selectedId, setSelectedId] = useState<string>(activeMember?.ID || '');

  if (!isOpen) return null;

  const handleSelectMember = (member: Integrante) => {
    setSelectedId(member.ID);
  };

  const handleConfirmLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const target = integrantes.find(i => i.ID === selectedId);
    if (!target) return;

    storage.setActiveMemberId(target.ID);
    showToast(`Bem-vindo(a), ${target.Nome}! Perfil conectado.`, 'success');
    onProfileChanged();
    onClose();
  };

  const handleLogout = () => {
    storage.setActiveMemberId(null);
    showToast('Perfil desconectado.', 'info');
    onProfileChanged();
    onClose();
  };

  const getRoleIcon = (funcao: string) => {
    const f = (funcao || '').toLowerCase();
    if (f.includes('vocal') || f.includes('ministro')) return <Mic className="w-4 h-4 text-pink-400" />;
    if (f.includes('baixo') || f.includes('guitarra') || f.includes('violão')) return <Guitar className="w-4 h-4 text-[#FF4D00]" />;
    return <Music className="w-4 h-4 text-cyan-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#121212] border border-slate-800 w-full max-w-lg rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#121212]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FF4D00]/15 text-[#FF4D00] flex items-center justify-center border border-[#FF4D00]/30 shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white leading-tight">
                Perfil do Músico / Integrante
              </h2>
              <p className="text-[11px] text-slate-400">
                Acesse suas cifras personalizadas, notas e foco de voz
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Active status banner */}
          {activeMember ? (
            <div className="bg-gradient-to-r from-[#FF4D00]/15 via-orange-950/30 to-slate-900 border border-[#FF4D00]/40 rounded-2xl p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF4D00] text-slate-950 flex items-center justify-center font-black text-base shadow-lg">
                  {activeMember.Nome.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-white">{activeMember.Nome}</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Conectado
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {activeMember.Funcao}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl bg-[#181818] hover:bg-red-950/40 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/40 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </div>
          ) : (
            <div className="bg-[#161616] border border-slate-800 rounded-2xl p-3.5 text-center space-y-1">
              <p className="text-xs font-bold text-slate-300">
                Nenhum perfil selecionado
              </p>
              <p className="text-[11px] text-slate-500">
                Selecione seu nome abaixo para carregar automaticamente as cifras do seu instrumento e suas anotações técnicas.
              </p>
            </div>
          )}

          {/* Member Selection List */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Escolha seu Perfil na Equipe:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {integrantes.map((member) => {
                const isSelected = selectedId === member.ID;
                const isActive = activeMember?.ID === member.ID;

                return (
                  <button
                    key={member.ID}
                    type="button"
                    onClick={() => handleSelectMember(member)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-[#FF4D00]/15 border-[#FF4D00] shadow-md'
                        : 'bg-[#0a0a0a] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#181818] flex items-center justify-center shrink-0 border border-slate-800">
                        {getRoleIcon(member.Funcao)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {member.Nome}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {member.Funcao}
                        </p>
                      </div>
                    </div>

                    {isActive ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Ativo no momento" />
                    ) : isSelected ? (
                      <Check className="w-4 h-4 text-[#FF4D00] shrink-0" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2 bg-[#121212]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleConfirmLogin}
            disabled={!selectedId}
            className="px-4 py-2 rounded-xl bg-[#FF4D00] text-slate-950 font-extrabold text-xs shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Confirmar Perfil</span>
          </button>
        </div>
      </div>
    </div>
  );
};
