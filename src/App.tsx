import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { LibraryView } from './components/LibraryView';
import { SongDetailModal } from './components/SongDetailModal';
import { SongFormModal } from './components/SongFormModal';
import { CultosView } from './components/CultosView';
import { StageModeModal } from './components/StageModeModal';
import { IntegrantesView } from './components/IntegrantesView';
import { MaisView } from './components/MaisView';
import { FeedbackModal } from './components/FeedbackModal';
import { PwaInstallModal } from './components/PwaInstallModal';
import { LoginScreen } from './components/LoginScreen';
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';

import { storage } from './services/storage';
import {
  Musica,
  Versao,
  Arquivo,
  Nota,
  Culto,
  RepertorioItem,
  Integrante,
  HistoricoItem,
  LogItem,
  ViewTab
} from './types';
import { Calendar, Flame, RefreshCw, X } from 'lucide-react';

/**
 * Code-splitting das telas de admin/config (backlog item 4 do
 * ESTADO-ATUAL.md): quem só abre uma cifra no palco não precisa baixar o
 * painel de administração nem o histórico/logs — telas de uso esporádico,
 * não do fluxo crítico de palco. Cada uma vira um chunk separado, baixado
 * só quando a aba é aberta pela primeira vez.
 */
const HistoricoLogsView = lazy(() =>
  import('./components/HistoricoLogsView').then((m) => ({ default: m.HistoricoLogsView }))
);
const AdminView = lazy(() =>
  import('./components/AdminView').then((m) => ({ default: m.AdminView }))
);

/** Fallback do Suspense: mesmo padrão visual do spinner de sync do Header. */
function LazyViewFallback() {
  return (
    <div className="flex items-center justify-center py-16 text-slate-500">
      <RefreshCw className="w-5 h-5 animate-spin text-[#FF4D00]" />
    </div>
  );
}

/** Tela cheia enquanto o Firebase resolve se já existe uma sessão salva. */
function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="w-16 h-16 rounded-2xl bg-[#FF4D00]/10 text-[#FF4D00] border border-[#FF4D00]/20 flex items-center justify-center shadow-inner animate-pulse">
        <Flame className="w-8 h-8" />
      </div>
    </div>
  );
}

function AppContent() {
  const { showToast } = useToast();
  const [currentTab, setCurrentTab] = useState<ViewTab>('inicio');

  // Database State
  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [versoes, setVersoes] = useState<Versao[]>([]);
  const [arquivos, setArquivos] = useState<Arquivo[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [cultos, setCultos] = useState<Culto[]>([]);
  const [repertorio, setRepertorio] = useState<RepertorioItem[]>([]);
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  // Quantas tabelas têm escrita local ainda não confirmada pelo Firestore —
  // mostrado como badge no botão de sincronizar do Header.
  const [pendingCount, setPendingCount] = useState(0);

  // Modals & Active Selections
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [showNewSongModal, setShowNewSongModal] = useState(false);
  const [showNewCultoModal, setShowNewCultoModal] = useState(false);
  const [showNewMemberModal, setShowNewMemberModal] = useState(false);
  const [selectedSongForDetail, setSelectedSongForDetail] = useState<Musica | null>(null);
  const [stageModeCulto, setStageModeCulto] = useState<Culto | null>(null);

  // New Culto Form State
  const [newCultoNome, setNewCultoNome] = useState('');
  const [newCultoData, setNewCultoData] = useState('');
  const [newCultoObs, setNewCultoObs] = useState('');

  // Sync State
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshData = useCallback(() => {
    setMusicas(storage.getMusicas());
    setVersoes(storage.getVersoes());
    setArquivos(storage.getArquivos());
    setNotas(storage.getNotas());
    setCultos(storage.getCultos());
    setRepertorio(storage.getRepertorio());
    setIntegrantes(storage.getIntegrantes());
    setHistorico(storage.getHistorico());
    setLogs(storage.getLogs());
    setPendingCount(storage.getPendingCount());
  }, []);

  /**
   * Liga os listeners em tempo real do Firestore assim que o app monta (já
   * autenticado — ver AuthGate). Cada mudança em qualquer tabela, feita
   * neste aparelho ou em qualquer outro da equipe, chama `refreshData()`
   * automaticamente. Desliga ao desmontar (logout, por exemplo) — os
   * listeners não podem continuar depois que a sessão termina.
   */
  useEffect(() => {
    storage.startRealtimeSync(refreshData);
    return () => storage.stopRealtimeSync();
  }, [refreshData]);

  /**
   * Botão manual de "sincronizar": como o Firestore já mantém tudo
   * atualizado sozinho, isso só confirma que a conexão está de pé — não é
   * mais um "pull" de verdade.
   */
  const handleManualSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await storage.syncWithGas();
      refreshData();
      if (res.success) {
        showToast('Conectado! Dados atualizados em tempo real.', 'success');
      } else {
        showToast('Sem conexão agora — mostrando os últimos dados salvos neste aparelho.', 'warning');
      }
    } finally {
      setIsSyncing(false);
    }
  }, [refreshData, showToast]);

  // Compute upcoming Culto
  const upcomingCulto = cultos.find(
    (c) => c.Status === 'Em Preparação' || c.Status === 'Agendado'
  ) || cultos[0];

  const upcomingRepertorio = upcomingCulto
    ? repertorio
        .filter((r) => r.ID_Culto === upcomingCulto.ID)
        .sort((a, b) => a.Ordem - b.Ordem)
        .map((r) => {
          const versao = versoes.find((v) => v.ID === r.ID_Versao);
          const musica = versao ? musicas.find((m) => m.ID === versao.ID_Musica) : undefined;
          return { item: r, versao, musica };
        })
    : [];

  const handleCreateCultoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCultoNome.trim()) return;

    storage.addCulto({
      Nome_Evento: newCultoNome.trim(),
      Data: newCultoData || new Date().toISOString(),
      Status: 'Em Preparação',
      Observacoes: newCultoObs.trim()
    });

    setNewCultoNome('');
    setNewCultoData('');
    setNewCultoObs('');
    setShowNewCultoModal(false);
    showToast('Culto agendado com sucesso!', 'success');
    refreshData();
  };

  return (
    <div className="min-h-screen bg-[#080808] text-slate-100 font-sans selection:bg-[#FF4D00] selection:text-slate-950">
      {/* Top Header */}
      <Header
        onNavigateTab={(tab) => setCurrentTab(tab)}
        onSync={handleManualSync}
        isSyncing={isSyncing}
        pendingCount={pendingCount}
      />

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 pt-4">
        {currentTab === 'inicio' && (
          <DashboardView
            upcomingCulto={upcomingCulto}
            upcomingRepertorio={upcomingRepertorio}
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenStageMode={(culto) => setStageModeCulto(culto)}
            onOpenNewCultoModal={() => setShowNewCultoModal(true)}
            onSelectSong={(musica) => setSelectedSongForDetail(musica)}
            onOpenFeedback={() => setShowFeedbackModal(true)}
          />
        )}

        {currentTab === 'biblioteca' && (
          <LibraryView
            musicas={musicas}
            versoes={versoes}
            arquivos={arquivos}
            notas={notas}
            onSelectSong={(musica) => setSelectedSongForDetail(musica)}
            onOpenNewSongModal={() => setShowNewSongModal(true)}
          />
        )}

        {currentTab === 'cultos' && (
          <CultosView
            cultos={cultos}
            repertorio={repertorio}
            versoes={versoes}
            musicas={musicas}
            onOpenStageMode={(culto) => setStageModeCulto(culto)}
            onOpenNewCultoModal={() => setShowNewCultoModal(true)}
            onDataChanged={refreshData}
            onSelectSong={(musica) => setSelectedSongForDetail(musica)}
            onNavigate={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'mais' && (
          <MaisView
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenFeedback={() => setShowFeedbackModal(true)}
            onOpenPwaModal={() => setShowPwaModal(true)}
            totalMusicas={musicas.length}
            totalVersoes={versoes.length}
            totalCultos={cultos.length}
            totalIntegrantes={integrantes.length}
          />
        )}

        {currentTab === 'integrantes' && (
          <IntegrantesView
            integrantes={integrantes}
            onOpenNewMemberModal={() => setShowNewMemberModal(true)}
            onDataChanged={refreshData}
            onNavigate={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'historico' && (
          <Suspense fallback={<LazyViewFallback />}>
            <HistoricoLogsView
              historico={historico}
              logs={logs}
              versoes={versoes}
              musicas={musicas}
              cultos={cultos}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          </Suspense>
        )}

        {currentTab === 'admin' && (
          <Suspense fallback={<LazyViewFallback />}>
            <AdminView
              onDataChanged={refreshData}
              totalMusicas={musicas.length}
              totalVersoes={versoes.length}
              totalCultos={cultos.length}
              totalIntegrantes={integrantes.length}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          </Suspense>
        )}
      </main>

      {/* Bottom Mobile Navigation */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        nextCultoSongCount={upcomingRepertorio.length}
      />

      {/* MODALS */}

      {/* Song Detail Modal */}
      {selectedSongForDetail && (
        <SongDetailModal
          musica={selectedSongForDetail}
          versoes={versoes.filter((v) => v.ID_Musica === selectedSongForDetail.ID)}
          arquivos={arquivos}
          notas={notas}
          onClose={() => setSelectedSongForDetail(null)}
          onDataChanged={refreshData}
        />
      )}

      {/* Song Form Modal */}
      {showNewSongModal && (
        <SongFormModal
          onClose={() => setShowNewSongModal(false)}
          onDataChanged={refreshData}
        />
      )}

      {/* Stage Mode Modal */}
      {stageModeCulto && (
        <StageModeModal
          culto={stageModeCulto}
          repertorio={repertorio}
          versoes={versoes}
          musicas={musicas}
          notas={notas}
          onClose={() => setStageModeCulto(null)}
        />
      )}

      {/* Feedback & Bug Report Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />

      {/* PWA Install Modal */}
      <PwaInstallModal
        isOpen={showPwaModal}
        onClose={() => setShowPwaModal(false)}
      />

      {/* New Culto Modal */}
      {showNewCultoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#FF4D00]" />
                Agendar Novo Culto
              </h3>
              <button onClick={() => setShowNewCultoModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCultoSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nome do Culto / Evento *
                </label>
                <input
                  type="text"
                  value={newCultoNome}
                  onChange={(e) => setNewCultoNome(e.target.value)}
                  placeholder="ex: Culto de Domingo - Celebração"
                  className="w-full bg-[#080808] border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Data e Horário
                </label>
                <input
                  type="datetime-local"
                  value={newCultoData}
                  onChange={(e) => setNewCultoData(e.target.value)}
                  className="w-full bg-[#080808] border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Observações Gerais
                </label>
                <textarea
                  value={newCultoObs}
                  onChange={(e) => setNewCultoObs(e.target.value)}
                  placeholder="ex: Culto com momento especial de Ceia..."
                  rows={2}
                  className="w-full bg-[#080808] border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCultoModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#FF4D00] hover:bg-[#e04400] text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all"
                >
                  Agendar Culto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Gate de autenticação: só renderiza o app de verdade depois de confirmar
 * login (Google ou e-mail/senha, ver LoginScreen). Quem não estiver na
 * allowlist de e-mail configurada nas Security Rules do Firestore consegue
 * logar, mas todo `onSnapshot`/leitura volta vazio/negado — a proteção de
 * verdade mora lá, não aqui.
 */
function AuthGate() {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (!user) return <LoginScreen />;
  return <AppContent />;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ToastProvider>
  );
}
