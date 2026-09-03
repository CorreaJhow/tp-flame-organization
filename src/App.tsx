import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { LibraryView } from './components/LibraryView';
import { SongDetailModal } from './components/SongDetailModal';
import { SongFormModal } from './components/SongFormModal';
import { CultosView } from './components/CultosView';
import { StageModeModal } from './components/StageModeModal';
import { IntegrantesView } from './components/IntegrantesView';
import { HistoricoLogsView } from './components/HistoricoLogsView';
import { GasSetupModal } from './components/GasSetupModal';
import { AdminView } from './components/AdminView';
import { MaisView } from './components/MaisView';
import { FeedbackModal } from './components/FeedbackModal';
import { PwaInstallModal } from './components/PwaInstallModal';
import { InitialSyncOverlay } from './components/InitialSyncOverlay';
import { ToastProvider, useToast } from './context/ToastContext';

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
import { Calendar, X } from 'lucide-react';

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
  // Quantas alterações deste aparelho ainda não foram confirmadas pela
  // planilha — mostrado como badge no botão de sincronizar do Header.
  const [pendingCount, setPendingCount] = useState(0);

  // Modals & Active Selections
  const [showGasModal, setShowGasModal] = useState(false);
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
  // Verdadeiro só até a primeira sincronização desta sessão terminar. Até lá,
  // a tela mostra o que já estava salvo neste aparelho — que pode estar
  // desatualizado em relação ao que a equipe fez em outro celular.
  const [isInitialSync, setIsInitialSync] = useState(true);
  const hasSyncedOnceRef = useRef(false);
  const isSyncInFlightRef = useRef(false);
  const lastSyncAtRef = useRef(0);

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
   * A primeira sincronização de cada sessão sempre avisa na tela, mesmo
   * quando disparada automaticamente (isManual=false).
   *
   * Antes, uma sincronização automática nunca mostrava nada — nem quando
   * dava certo, nem quando falhava. Isso significava duas coisas ruins ao
   * mesmo tempo: quem abria o app via a biblioteca antiga deste aparelho por
   * alguns segundos sem saber que era um dado provisório, e se a
   * sincronização falhasse (rede ruim no ensaio, por exemplo), ninguém jamais
   * ficava sabendo que estava vendo dados possivelmente desatualizados.
   */
  const handleSync = useCallback(async (isManual = false) => {
    // Evita sincronizações sobrepostas: o botão manual, o sync periódico, o
    // de reconexão e o de foco de aba podem disparar quase ao mesmo tempo.
    if (isSyncInFlightRef.current) return;
    isSyncInFlightRef.current = true;

    const isFirstSyncOfSession = !hasSyncedOnceRef.current;

    setIsSyncing(true);
    if (isFirstSyncOfSession) {
      showToast('Sincronizando com a planilha da equipe...', 'info', 2000);
    }

    try {
      const res = await storage.syncWithGas();
      refreshData();
      hasSyncedOnceRef.current = true;
      lastSyncAtRef.current = Date.now();
      setIsInitialSync(false);

      // Conflito avisa sempre, mesmo fora do primeiro sync ou de um sync
      // manual: significa que uma edição feita NESTE aparelho foi descartada
      // porque alguém já tinha salvo uma versão mais recente do mesmo
      // registro. Quem editou precisa saber que o que digitou não "colou".
      if (res.conflictCount > 0) {
        showToast(
          res.conflictCount === 1
            ? 'Uma edição sua foi descartada: alguém já havia salvo uma versão mais recente do mesmo registro.'
            : `${res.conflictCount} edições suas foram descartadas: alguém já havia salvo versões mais recentes.`,
          'warning',
          6000
        );
      }

      if (isManual || isFirstSyncOfSession) {
        if (res.success) {
          if (res.pushedCount && res.pushedCount > 0) {
            showToast(`Sincronizado! ${res.pushedCount} alteração(ões) enviadas para o Sheets.`, 'success');
          } else if (isFirstSyncOfSession) {
            showToast('Dados atualizados com a planilha da equipe.', 'success');
          } else {
            showToast('Sincronizado com a planilha com sucesso!', 'success');
          }
        } else {
          showToast(
            res.message || 'Sem conexão com a planilha agora — mostrando os últimos dados salvos neste aparelho.',
            'warning'
          );
        }
      }
    } finally {
      // Sempre libera, mesmo se algo lançar uma exceção inesperada — senão a
      // flag fica travada em "sincronizando" e nenhum sync automático futuro
      // roda de novo até a página ser recarregada.
      setIsSyncing(false);
      isSyncInFlightRef.current = false;
    }
  }, [refreshData, showToast]);

  useEffect(() => {
    refreshData();
    handleSync(false);
  }, []);

  /**
   * Fase 2, item 2: sincronização sem depender de reabrir o app.
   *
   * Antes, só rodava no mount e no clique manual — quem deixasse o app
   * aberto no palco durante o ensaio nunca via o que os outros adicionaram, a
   * não ser que fechasse e abrisse de novo. Agora sincroniza sozinho:
   *   - periodicamente, a cada 90s, enquanto o app fica aberto
   *   - ao reconectar à internet (evento 'online')
   *   - ao voltar o foco para a aba/app (o celular volta da tela de bloqueio,
   *     ou a pessoa troca de app e volta)
   *
   * MIN_GAP_MS evita disparos redundantes quando dois desses gatilhos
   * acontecem quase juntos (ex.: destravar o celular já reconecta o wifi).
   */
  useEffect(() => {
    const MIN_GAP_MS = 20000;
    const PERIODIC_MS = 90000;

    const maybeSync = () => {
      if (!navigator.onLine) return;
      if (Date.now() - lastSyncAtRef.current < MIN_GAP_MS) return;
      handleSync(false);
    };

    const onOnline = () => maybeSync();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') maybeSync();
    };

    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisibilityChange);
    const intervalId = setInterval(maybeSync, PERIODIC_MS);

    return () => {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(intervalId);
    };
  }, [handleSync]);

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
      {/* Tela de espera da primeira sincronização: cobre a página inteira
          (já renderizada com o dado local, por trás, borrado) até os dados
          da planilha chegarem. */}
      <InitialSyncOverlay isOpen={isInitialSync && isSyncing} />

      {/* Top Header */}
      <Header
        onOpenGasModal={() => setShowGasModal(true)}
        onNavigateTab={(tab) => setCurrentTab(tab)}
        onSync={() => handleSync(true)}
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
          <HistoricoLogsView
            historico={historico}
            logs={logs}
            versoes={versoes}
            musicas={musicas}
            cultos={cultos}
            onNavigate={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'admin' && (
          <AdminView
            onOpenGasModal={() => setShowGasModal(true)}
            onDataChanged={refreshData}
            totalMusicas={musicas.length}
            totalVersoes={versoes.length}
            totalCultos={cultos.length}
            totalIntegrantes={integrantes.length}
            onNavigate={(tab) => setCurrentTab(tab)}
          />
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

      {/* GAS Setup Modal */}
      {showGasModal && (
        <GasSetupModal
          onClose={() => setShowGasModal(false)}
          onDataChanged={refreshData}
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

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
