import React, { useState, useEffect, useCallback } from 'react';
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

export default function App() {
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

  // Modals & Active Selections
  const [showGasModal, setShowGasModal] = useState(false);
  const [showNewSongModal, setShowNewSongModal] = useState(false);
  const [showNewCultoModal, setShowNewCultoModal] = useState(false);
  const [showNewMemberModal, setShowNewMemberModal] = useState(false);
  const [selectedSongForDetail, setSelectedSongForDetail] = useState<Musica | null>(null);
  const [stageModeCulto, setStageModeCulto] = useState<Culto | null>(null);

  // New Culto Form State
  const [newCultoNome, setNewCultoNome] = useState('');
  const [newCultoData, setNewCultoData] = useState('');
  const [newCultoObs, setNewCultoObs] = useState('');

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
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

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
    refreshData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header */}
      <Header
        onOpenGasModal={() => setShowGasModal(true)}
        onDataChanged={refreshData}
      />

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 pt-4">
        {currentTab === 'inicio' && (
          <DashboardView
            upcomingCulto={upcomingCulto}
            upcomingRepertorio={upcomingRepertorio}
            totalMusicas={musicas.length}
            totalVersoes={versoes.length}
            totalCultos={cultos.length}
            totalIntegrantes={integrantes.length}
            logs={logs}
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenStageMode={(culto) => setStageModeCulto(culto)}
            onOpenNewSongModal={() => setShowNewSongModal(true)}
            onOpenNewCultoModal={() => setShowNewCultoModal(true)}
            onOpenNewMemberModal={() => setShowNewMemberModal(true)}
            onOpenGasModal={() => setShowGasModal(true)}
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
          />
        )}

        {currentTab === 'integrantes' && (
          <IntegrantesView
            integrantes={integrantes}
            onOpenNewMemberModal={() => setShowNewMemberModal(true)}
            onDataChanged={refreshData}
          />
        )}

        {currentTab === 'historico' && (
          <HistoricoLogsView
            historico={historico}
            logs={logs}
            versoes={versoes}
            musicas={musicas}
            cultos={cultos}
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

      {/* New Culto Modal */}
      {showNewCultoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none"
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
                  className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
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
