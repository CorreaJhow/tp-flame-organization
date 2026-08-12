import React, { useState } from 'react';
import { X, Code2, Copy, Check, FileSpreadsheet, ExternalLink, ShieldCheck, Database, Terminal, Eye, EyeOff } from 'lucide-react';
import { GAS_MILESTONE_1_SETUP_CODE, GAS_MILESTONE_2_3_API_CODE } from '../data/gasScript';
import { storage } from '../services/storage';

interface GasSetupModalProps {
  onClose: () => void;
  onDataChanged: () => void;
}

export const GasSetupModal: React.FC<GasSetupModalProps> = ({ onClose, onDataChanged }) => {
  const [activeTab, setActiveTab] = useState<'m1' | 'm2_3' | 'connect'>('m1');
  const [copied, setCopied] = useState(false);
  const [endpointInput, setEndpointInput] = useState(storage.getGasEndpoint());
  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState(storage.getGasSpreadsheetId());
  const [showSensitive, setShowSensitive] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const currentCode = activeTab === 'm1' ? GAS_MILESTONE_1_SETUP_CODE : GAS_MILESTONE_2_3_API_CODE;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveConnection = (e: React.FormEvent) => {
    e.preventDefault();
    storage.setGasEndpoint(endpointInput);
    storage.setGasSpreadsheetId(spreadsheetIdInput);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    onDataChanged();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl max-h-[92vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white leading-none">
                  Google Apps Script & Sheets Setup
                </h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Milestone 1
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Setup do Banco de Dados no Google Sheets e API Backend
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-slate-800 px-4 pt-3 flex items-center gap-2 bg-slate-950/50">
          <button
            onClick={() => setActiveTab('m1')}
            className={`pb-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'm1'
                ? 'border-[#FF4D00] text-[#FF4D00]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Milestone 1: Script Setup</span>
          </button>

          <button
            onClick={() => setActiveTab('m2_3')}
            className={`pb-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'm2_3'
                ? 'border-[#FF4D00] text-[#FF4D00]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Milestone 2 & 3: API Web App</span>
          </button>

          <button
            onClick={() => setActiveTab('connect')}
            className={`pb-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'connect'
                ? 'border-[#FF4D00] text-[#FF4D00]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Conectar Endpoint</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {activeTab !== 'connect' ? (
            <>
              {/* Instructions Banner */}
              <div className="bg-[#080808] border border-slate-800 rounded-2xl p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#FF4D00] flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4" />
                    {activeTab === 'm1' ? 'Como executar o Milestone 1:' : 'Como publicar a API Web App:'}
                  </span>

                  <button
                    onClick={handleCopyCode}
                    className="py-1 px-3 rounded-xl bg-[#FF4D00] hover:bg-[#e04400] text-slate-950 font-black text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
                  </button>
                </div>

                <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                  {activeTab === 'm1' ? (
                    <>
                      <li>Acesse <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-[#FF4D00] underline">script.google.com</a> e crie um "Novo projeto".</li>
                      <li>Cole o código abaixo no arquivo <code className="text-[#FF4D00]">Código.gs</code>.</li>
                      <li>Selecione a função <code className="text-[#FF4D00]">setupDatabase</code> na barra superior e clique em <strong>Executar</strong>.</li>
                      <li>Conceda as permissões solicitadas para criar o arquivo no Google Drive.</li>
                      <li>O script criará a planilha <strong>"TP Flame - Banco de Dados V1"</strong> com as 10 abas formatadas e IDs UUID!</li>
                    </>
                  ) : (
                    <>
                      <li>Substitua a variável <code className="text-[#FF4D00]">SPREADSHEET_ID</code> pelo ID da planilha gerada no Milestone 1.</li>
                      <li>Clique em <strong>Implantar &gt; Nova Implantação</strong>.</li>
                      <li>Selecione o tipo "App da Web" e configure: <em>Executar como: Eu</em>, <em>Quem tem acesso: Qualquer pessoa (Anyone)</em>.</li>
                      <li>Copie a URL da Web App gerada e insira na aba "Conectar Endpoint" nesta plataforma.</li>
                    </>
                  )}
                </ol>
              </div>

              {/* Code Viewer */}
              <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                <div className="bg-slate-900/90 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Código.gs</span>
                  <span>Google Apps Script</span>
                </div>
                <pre className="p-4 font-mono text-[11px] text-slate-200 overflow-x-auto max-h-[340px] leading-relaxed">
                  {currentCode}
                </pre>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Conexão Direta ao Google Sheets (Web App GAS)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowSensitive(!showSensitive)}
                    className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1 underline"
                  >
                    {showSensitive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showSensitive ? 'Ocultar Credenciais' : 'Exibir Credenciais'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Insira o ID da planilha gerada no Milestone 1 e a URL do Web App implantado para sincronizar diretamente em tempo real com o seu Google Sheets. A sua planilha permanece <strong className="text-white">100% Privada e Segura</strong> no Google Drive.
                </p>
              </div>

              <form onSubmit={handleSaveConnection} className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    ID da Planilha Google Sheets (Spreadsheet ID)
                  </label>
                  <input
                    type={showSensitive ? 'text' : 'password'}
                    value={spreadsheetIdInput}
                    onChange={(e) => setSpreadsheetIdInput(e.target.value)}
                    placeholder="ex: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                    className="w-full bg-[#080808] border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-[#FF4D00]"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    O ID fica na URL da planilha: docs.google.com/spreadsheets/d/<strong>[SPREADSHEET_ID]</strong>/edit
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    URL do Endpoint Google Apps Script (Web App)
                  </label>
                  <input
                    type={showSensitive ? 'text' : 'password'}
                    value={endpointInput}
                    onChange={(e) => setEndpointInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full bg-[#080808] border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-[#FF4D00]"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Gerado ao publicar a Web App no script.google.com
                  </p>
                </div>

                {saveSuccess && (
                  <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
                    ✓ Configurações salvas com sucesso!
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#FF4D00] hover:bg-[#e04400] text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all"
                  >
                    Salvar Configurações
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
