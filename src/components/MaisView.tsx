import React from 'react';
import { Users, History, Shield, Activity, Music2, FileSpreadsheet, Calendar, ChevronRight, MessageSquarePlus, Smartphone } from 'lucide-react';
import { ViewTab } from '../types';

interface MaisViewProps {
  onNavigate: (tab: ViewTab) => void;
  onOpenFeedback: () => void;
  onOpenPwaModal?: () => void;
  totalMusicas: number;
  totalVersoes: number;
  totalCultos: number;
  totalIntegrantes: number;
}

export const MaisView: React.FC<MaisViewProps> = ({
  onNavigate,
  onOpenFeedback,
  onOpenPwaModal,
  totalMusicas,
  totalVersoes,
  totalCultos,
  totalIntegrantes
}) => {
  return (
    <div className="space-y-6 pb-28">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">
          Mais Opções
        </h2>
        <p className="text-xs text-slate-400">
          Gerenciamento avançado, equipe de louvor e configurações do sistema
        </p>
      </div>

      {/* Main Sections */}
      <div className="space-y-3">
        {onOpenPwaModal && (
          <button
            onClick={onOpenPwaModal}
            className="w-full bg-gradient-to-r from-[#181818] via-[#1a1512] to-[#251508] hover:from-[#202020] hover:to-[#2c180a] border border-[#FF4D00]/40 rounded-2xl p-4 flex items-center justify-between text-left transition-all active:scale-[0.99] group shadow-lg"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#FF4D00] transition-colors flex items-center gap-2">
                  <span>Instalar App no Celular (PWA)</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    RECOMENDADO
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Adicione o ícone na tela inicial do iOS/Android para abrir em 1 toque
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
          </button>
        )}

        <button
          onClick={onOpenFeedback}
          className="w-full bg-[#121212] hover:bg-[#181818] border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between text-left transition-all active:scale-[0.99] group shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#FF4D00]/10 text-[#FF4D00] border border-[#FF4D00]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-[#FF4D00] transition-colors">
                Caixa de Sugestões & Reportar Bug
              </h3>
              <p className="text-xs text-slate-400">
                Envie ideias ou informe quando algo der problema no sistema
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
        </button>

        <button
          onClick={() => onNavigate('integrantes')}
          className="w-full bg-[#121212] hover:bg-[#181818] border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between text-left transition-all active:scale-[0.99] group shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#FF4D00]/10 text-[#FF4D00] border border-[#FF4D00]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-[#FF4D00] transition-colors">
                Equipe de Louvor
              </h3>
              <p className="text-xs text-slate-400">
                {totalIntegrantes} integrantes cadastrados (vocalistas e instrumentistas)
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
        </button>

        <button
          onClick={() => onNavigate('historico')}
          className="w-full bg-[#121212] hover:bg-[#181818] border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between text-left transition-all active:scale-[0.99] group shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                Histórico & Registros
              </h3>
              <p className="text-xs text-slate-400">
                Histórico de músicas executadas em cultos e auditoria
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
        </button>

        <button
          onClick={() => onNavigate('admin')}
          className="w-full bg-[#121212] hover:bg-[#181818] border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between text-left transition-all active:scale-[0.99] group shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#FF4D00]/10 text-[#FF4D00] border border-[#FF4D00]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-[#FF4D00] transition-colors">
                Painel de Administração (GAS)
              </h3>
              <p className="text-xs text-slate-400">
                Integração Google Apps Script e manutenção de banco de dados
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* Ministry Metrics Summary */}
      <section className="bg-[#121212] border border-slate-800/80 rounded-2xl p-4 shadow-md space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-[#FF4D00]" />
          Estatísticas do Ministério
        </h3>
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-[#080808] border border-slate-800 rounded-xl p-2.5 text-center">
            <Music2 className="w-4 h-4 text-[#FF4D00] mx-auto mb-1" />
            <span className="text-base font-extrabold text-white block leading-none">{totalMusicas}</span>
            <span className="text-[10px] text-slate-400">Músicas</span>
          </div>

          <div className="bg-[#080808] border border-slate-800 rounded-xl p-2.5 text-center">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span className="text-base font-extrabold text-white block leading-none">{totalVersoes}</span>
            <span className="text-[10px] text-slate-400">Versões</span>
          </div>

          <div className="bg-[#080808] border border-slate-800 rounded-xl p-2.5 text-center">
            <Calendar className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <span className="text-base font-extrabold text-white block leading-none">{totalCultos}</span>
            <span className="text-[10px] text-slate-400">Cultos</span>
          </div>

          <div className="bg-[#080808] border border-slate-800 rounded-xl p-2.5 text-center">
            <Users className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <span className="text-base font-extrabold text-white block leading-none">{totalIntegrantes}</span>
            <span className="text-[10px] text-slate-400">Equipe</span>
          </div>
        </div>
      </section>
    </div>
  );
};
