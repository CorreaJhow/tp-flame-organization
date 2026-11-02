import React, { useEffect, useRef, useState } from 'react';
import { X, MessageSquarePlus, Send, Bug, Lightbulb, CheckCircle2, Music2, ArrowLeft } from 'lucide-react';
import { storage } from '../services/storage';
import { formatBug, formatMusica, formatSugestao, normalizeMusicLink } from '../utils/feedbackLog';

export type FeedbackMode = 'menu' | 'sugestao' | 'bug' | 'musica';

interface FeedbackModalProps {
  mode: FeedbackMode | null;
  defaultName?: string;
  onClose: () => void;
}

const TITULOS: Record<FeedbackMode, { titulo: string; subtitulo: string }> = {
  menu: { titulo: 'Fale com a gente', subtitulo: 'O que você quer enviar?' },
  sugestao: { titulo: 'Enviar sugestão', subtitulo: 'Conte sua ideia para o app' },
  bug: { titulo: 'Reportar bug', subtitulo: 'Conte o que deu errado' },
  musica: { titulo: 'Sugerir música', subtitulo: 'Indique uma música para o repertório' }
};

const INPUT_CLASS =
  'w-full bg-base border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand';

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ mode, defaultName = '', onClose }) => {
  const [currentMode, setCurrentMode] = useState<FeedbackMode>('menu');
  const [tipoSugestao, setTipoSugestao] = useState<'melhoria' | 'outra'>('melhoria');
  const [nome, setNome] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [nomeMusica, setNomeMusica] = useState('');
  const [link, setLink] = useState('');
  const [linkError, setLinkError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cada abertura começa limpa, no formulário do botão que foi tocado
  useEffect(() => {
    if (!mode) return;
    setCurrentMode(mode);
    setTipoSugestao('melhoria');
    setNome(defaultName);
    setMensagem('');
    setNomeMusica('');
    setLink('');
    setLinkError(false);
    setSubmitted(false);
  }, [mode, defaultName]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  if (!mode) return null;

  const enviar = (texto: string) => {
    // addLog já grava no Firestore por baixo (ver storage.ts)
    storage.addLog('FEEDBACK', texto);
    setSubmitted(true);
    closeTimer.current = setTimeout(onClose, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (currentMode === 'musica') {
      const linkValido = normalizeMusicLink(link);
      if (!linkValido) {
        setLinkError(true);
        return;
      }
      if (!nome.trim() || !nomeMusica.trim()) return;
      enviar(formatMusica(nome, nomeMusica, linkValido));
      return;
    }

    if (!mensagem.trim()) return;
    enviar(currentMode === 'bug' ? formatBug(nome, mensagem) : formatSugestao(tipoSugestao, nome, mensagem));
  };

  const podeEnviar =
    currentMode === 'musica'
      ? Boolean(nome.trim() && nomeMusica.trim() && link.trim())
      : Boolean(mensagem.trim());

  const { titulo, subtitulo } = TITULOS[currentMode];

  const opcoesMenu = [
    { id: 'sugestao' as const, label: 'Sugestão', detalhe: 'Uma melhoria ou outra ideia', Icon: Lightbulb },
    { id: 'bug' as const, label: 'Reportar bug', detalhe: 'Algo deu errado no app', Icon: Bug },
    { id: 'musica' as const, label: 'Sugerir música', detalhe: 'Nome e link da música', Icon: Music2 }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-surface border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-surface-hover">
          <div className="flex items-center gap-3">
            {mode === 'menu' && currentMode !== 'menu' && !submitted ? (
              <button
                type="button"
                onClick={() => setCurrentMode('menu')}
                aria-label="Voltar"
                className="w-10 h-10 rounded-xl bg-brand/10 text-brand border border-brand/20 flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand border border-brand/20 flex items-center justify-center">
                <MessageSquarePlus className="w-5 h-5" />
              </div>
            )}
            <div>
              <h2 className="text-base font-extrabold text-white">{titulo}</h2>
              <p className="text-xs text-slate-400">{subtitulo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 rounded-xl bg-base hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Obrigado!</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">Recebemos sua mensagem.</p>
            </div>
          ) : currentMode === 'menu' ? (
            <div className="space-y-2">
              {opcoesMenu.map(({ id, label, detalhe, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCurrentMode(id)}
                  className="w-full bg-base hover:bg-surface-hover border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3 text-left transition-all active:scale-[0.99]"
                >
                  <Icon className="w-5 h-5 text-brand shrink-0" />
                  <span>
                    <span className="text-xs font-bold text-white block">{label}</span>
                    <span className="text-[11px] text-slate-400">{detalhe}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {currentMode === 'sugestao' && (
                <div>
                  <span className="text-xs font-bold text-slate-300 block mb-1.5">Tipo de sugestão</span>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      ['melhoria', 'Melhoria'],
                      ['outra', 'Outra ideia']
                    ] as const).map(([valor, rotulo]) => (
                      <button
                        key={valor}
                        type="button"
                        aria-pressed={tipoSugestao === valor}
                        onClick={() => setTipoSugestao(valor)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                          tipoSugestao === valor
                            ? 'bg-brand text-slate-950 border-brand shadow-md'
                            : 'bg-base text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {rotulo}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentMode === 'musica' && (
                <>
                  <div>
                    <label htmlFor="feedback-musica" className="text-xs font-bold text-slate-300 block mb-1">
                      Nome da música <span className="text-brand">*</span>
                    </label>
                    <input
                      id="feedback-musica"
                      type="text"
                      value={nomeMusica}
                      onChange={(e) => setNomeMusica(e.target.value)}
                      placeholder="Ex: Lugar Secreto"
                      required
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label htmlFor="feedback-link" className="text-xs font-bold text-slate-300 block mb-1">
                      Link do YouTube ou Spotify <span className="text-brand">*</span>
                    </label>
                    <input
                      id="feedback-link"
                      type="text"
                      inputMode="url"
                      autoCapitalize="none"
                      value={link}
                      onChange={(e) => {
                        setLink(e.target.value);
                        setLinkError(false);
                      }}
                      placeholder="https://youtu.be/..."
                      required
                      aria-invalid={linkError}
                      className={`${INPUT_CLASS} ${linkError ? 'border-red-500' : ''}`}
                    />
                    {linkError && (
                      <p role="alert" className="text-[11px] text-red-400 mt-1">
                        Cole um link válido do YouTube ou do Spotify.
                      </p>
                    )}
                  </div>
                </>
              )}

              <div>
                <label htmlFor="feedback-nome" className="text-xs font-bold text-slate-300 block mb-1">
                  {currentMode === 'musica' ? (
                    <>
                      Quem sugeriu <span className="text-brand">*</span>
                    </>
                  ) : (
                    <>
                      Seu nome <span className="text-slate-500 font-normal">(opcional)</span>
                    </>
                  )}
                </label>
                <input
                  id="feedback-nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Gabriel (Violão)"
                  required={currentMode === 'musica'}
                  className={INPUT_CLASS}
                />
              </div>

              {currentMode !== 'musica' && (
                <div>
                  <label htmlFor="feedback-mensagem" className="text-xs font-bold text-slate-300 block mb-1">
                    {currentMode === 'bug' ? 'O que aconteceu?' : 'Qual é a sua ideia?'}{' '}
                    <span className="text-brand">*</span>
                  </label>
                  <textarea
                    id="feedback-mensagem"
                    rows={4}
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    placeholder={
                      currentMode === 'bug'
                        ? 'Ex: Ao abrir a cifra no celular, a tela ficou preta...'
                        : 'Ex: Seria legal ter uma contagem regressiva para os cultos...'
                    }
                    required
                    className={`${INPUT_CLASS} resize-none`}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={!podeEnviar}
                className="w-full py-3 px-4 rounded-xl bg-brand hover:bg-brand-hover disabled:opacity-30 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Enviar</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
