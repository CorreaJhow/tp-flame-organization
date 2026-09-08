import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { LibraryView } from './components/LibraryView';
import { SongFormModal } from './components/SongFormModal';
import { CultosView } from './components/CultosView';
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
import { Calendar, Flame, RefreshCw, ShieldAlert, LogOut, X } from 'lucide-react';

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

/**
 * Modo Palco e a ficha de música (SongDetailModal) puxam o ChordViewer
 * junto — é o trecho mais pesado do bundle e só é usado ao abrir uma
 * música específica, nunca no primeiro carregamento do app. Viram chunks
 * separados aqui, e o efeito de pré-carregamento logo abaixo (dentro do
 * componente App) busca esses chunks em segundo plano assim que o app
 * fica ocioso — pelo Golden Rule do projeto (resiliência de palco vem
 * antes de qualquer coisa), quem abre o Modo Palco ao vivo não pode
 * depender de uma rede boa naquele instante exato; o chunk já deve estar
 * baixado e em cache do Service Worker bem antes disso.
 */
const stageModeModalImport = () => import('./components/StageModeModal');
const songDetailModalImport = () => import('./components/SongDetailModal');
const StageModeModal = lazy(() =>
  stageModeModalImport().then((m) => ({ default: m.StageModeModal }))
);
const SongDetailModal = lazy(() =>
  songDetailModalImport().then((m) => ({ default: m.SongDetailModal }))
);

/** Fallback do Suspense: mesmo padrão visual do spinner de sync do Header. */
function LazyViewFallback() {
  return (
    <div className="flex items-center justify-center py-16 text-slate-500">
      <RefreshCw className="w-5 h-5 animate-spin text-[#FF4D00]" />
    </div>
  );
}

/** Fallback do Suspense pros modais em tela cheia (Modo Palco / Ficha de
 * Música) — mesmo fundo escuro deles, pra não piscar um branco/vazio no
 * meio da troca de tela. Na prática quase nunca aparece, porque o
 * pré-carregamento em segundo plano já deixa o chunk pronto antes do
 * clique. */
function LazyFullScreenFallback() {
  return (
    <div className="fixed inset-0 z-50 bg-[#080808] flex items-center justify-center">
      <RefreshCw className="w-6 h-6 animate-spin text-[#FF4D00]" />
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

/**
 * Tela mostrada quando o login funcionou (é uma conta Google válida) mas o
 * e-mail não está na allowlist das Security Rules do Firestore — login e
 * permissão são coisas diferentes. Sem isso, a pessoa via o app inteiro
 * vazio, sem entender se era um bug ou falta de acesso.
 */
function AccessBlockedScreen({ email, onSignOut }: { email: string | null; onSignOut: () => void }) {
  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121212] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white mb-1.5">Acesso não autorizado</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            O login funcionou, mas o e-mail{' '}
            <strong className="text-slate-300">{email || 'desta conta'}</strong> ainda não tem
            permissão pra usar o TP Flame. Peça pra um administrador liberar seu e-mail, ou entre
            com a conta certa da equipe.
          </p>
        </div>
        <button
          onClick={onSignOut}
          className="w-full py-3 px-4 rounded-xl bg-[#181818] hover:bg-red-950/40 text-slate-300 hover:text-red-400 border border-slate-700 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair e tentar outra conta</span>
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const { showToast } = useToast();
  const { user, signOut } = useAuth();
  const [isBlocked, setIsBlocked] = useState(false);
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
    storage.startRealtimeSync(refreshData, () => setIsBlocked(true));
    return () => storage.stopRealtimeSync();
  }, [refreshData]);

  /**
   * Pré-carrega em segundo plano os chunks do Modo Palco e da Ficha de
   * Música assim que o app fica ocioso — antes de qualquer clique. São
   * chunks separados (ver comentário no topo do arquivo) só pelo peso do
   * bundle inicial; ninguém deveria sentir isso como demora na hora de
   * entrar numa música ao vivo. `requestIdleCallback` evita competir com o
   * carregamento inicial da tela; o timeout garante que roda mesmo se o
   * navegador não suportar a API (Safari) ou nunca ficar "ocioso" de
   * verdade.
   */
  useEffect(() => {
    const prefetch = () => {
      stageModeModalImport();
      songDetailModalImport();
    };
    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(prefetch, { timeout: 4000 });
      return () => (window as any).cancelIdleCallback?.(id);
    }
    const timeoutId = setTimeout(prefetch, 2000);
    return () => clearTimeout(timeoutId);
  }, []);

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

  if (isBlocked) {
    return <AccessBlockedScreen email={user?.email ?? null} onSignOut={signOut} />;
  }

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
        <Suspense fallback={<LazyFullScreenFallback />}>
          <SongDetailModal
            musica={selectedSongForDetail}
            versoes={versoes.filter((v) => v.ID_Musica === selectedSongForDetail.ID)}
            arquivos={arquivos}
            notas={notas}
            onClose={() => setSelectedSongForDetail(null)}
            onDataChanged={refreshData}
          />
        </Suspense>
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
        <Suspense fallback={<LazyFullScreenFallback />}>
          <StageModeModal
            culto={stageModeCulto}
            repertorio={repertorio}
            versoes={versoes}
            musicas={musicas}
            notas={notas}
            onClose={() => setStageModeCulto(null)}
          />
        </Suspense>
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
