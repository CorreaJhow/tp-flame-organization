import React, { useState } from 'react';
import { History, Plus, Edit3, Trash2 } from 'lucide-react';
import { Versao } from '../types';
import { storage } from '../services/storage';
import { ALL_KEYS, formatKeyDisplay } from '../utils/chordTransposer';
import { getExecucoes, formatarData, Execucao } from '../utils/songHistory';
import { ConfirmModal } from './ConfirmModal';
import { useToast } from '../context/ToastContext';

interface Props {
  versao: Versao;
  versoes: Versao[]; // versões da música (a execução vale para a música inteira)
  onChanged: () => void;
}

interface Form {
  id?: string;
  data: string;
  tom: string;
  idCulto: string;
  evento: string;
  obs: string;
}

const VAZIO: Form = { data: '', tom: '', idCulto: '', evento: '', obs: '' };
const campo = 'w-full text-xs rounded-lg bg-canvas text-fg border border-line px-2 py-1.5';

export const HistoricoExecucoes: React.FC<Props> = ({ versao, versoes, onChanged }) => {
  const { showToast } = useToast();
  const [form, setForm] = useState<Form | null>(null);
  const [excluir, setExcluir] = useState<Execucao | null>(null);

  const cultos = storage.getCultos();
  const execs = getExecucoes(versao.ID, cultos, storage.getRepertorio(), storage.getHistorico(), versoes);
  const set = (p: Partial<Form>) => setForm((f) => (f ? { ...f, ...p } : f));

  const editar = (e: Execucao) => {
    const h = storage.getHistorico().find((x) => x.ID === e.historicoId);
    if (!h) return;
    setForm({
      id: h.ID,
      data: h.Data_Execucao.slice(0, 10),
      tom: h.Tom_Tocado || '',
      idCulto: h.ID_Culto || '',
      evento: h.Evento || '',
      obs: h.Obs || ''
    });
  };

  const salvar = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form || !form.data) return;
    // '' (e não undefined) para limpar o campo no Firestore ao editar.
    const dados = {
      Data_Execucao: form.data,
      Tom_Tocado: form.tom,
      ID_Culto: form.idCulto,
      Evento: form.idCulto ? '' : form.evento.trim(),
      Obs: form.obs.trim()
    };
    if (form.id) storage.updateHistorico(form.id, dados);
    else storage.addHistorico({ ID_Versao: versao.ID, ...dados });
    showToast(form.id ? 'Execução atualizada' : 'Execução registrada', 'success');
    setForm(null);
    onChanged();
  };

  return (
    <div className="bg-canvas border border-line/80 rounded-2xl p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase font-bold text-fg-subtle flex items-center gap-1">
          <History className="w-3 h-3 text-brand-ink" />
          Histórico de execuções
        </span>
        {!form && (
          <button
            onClick={() => setForm({ ...VAZIO, tom: '' })}
            className="text-[11px] font-bold px-2 py-1 rounded-lg bg-brand/20 text-brand-ink hover:bg-brand/30 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Registrar execução
          </button>
        )}
      </div>

      {form && (
        <form onSubmit={salvar} className="space-y-2 bg-surface border border-line rounded-xl p-2.5">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-bold text-fg-muted">
              Data (aproximada vale)
              <input type="date" required value={form.data} onChange={(e) => set({ data: e.target.value })} className={campo} />
            </label>
            <label className="text-[10px] font-bold text-fg-muted">
              Tom tocado
              <select value={form.tom} onChange={(e) => set({ tom: e.target.value })} className={campo}>
                <option value="">Tom original ({formatKeyDisplay(versao.Tom, versao.Modo)})</option>
                {ALL_KEYS.map((k) => (
                  <option key={k} value={k}>{formatKeyDisplay(k, versao.Modo)}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="text-[10px] font-bold text-fg-muted block">
            Culto (opcional)
            <select value={form.idCulto} onChange={(e) => set({ idCulto: e.target.value })} className={campo}>
              <option value="">Sem culto cadastrado</option>
              {[...cultos].sort((a, b) => b.Data.localeCompare(a.Data)).map((c) => (
                <option key={c.ID} value={c.ID}>{formatarData(c.Data)} - {c.Nome_Evento}</option>
              ))}
            </select>
          </label>
          {!form.idCulto && (
            <input
              placeholder="Evento (opcional)"
              value={form.evento}
              onChange={(e) => set({ evento: e.target.value })}
              className={campo}
            />
          )}
          <input placeholder="Observação (opcional)" value={form.obs} onChange={(e) => set({ obs: e.target.value })} className={campo} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setForm(null)} className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-line text-fg-soft">
              Cancelar
            </button>
            <button type="submit" className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-brand text-slate-950">
              Salvar
            </button>
          </div>
        </form>
      )}

      {execs.length === 0 ? (
        <p className="text-[11px] text-fg-subtle italic">Nenhuma execução registrada.</p>
      ) : (
        <ul className="space-y-1">
          {execs.map((e) => (
            <li key={e.key} className="flex items-start justify-between gap-2 text-xs bg-surface border border-line/80 rounded-lg px-2.5 py-1.5">
              <div className="min-w-0">
                <span className="font-bold text-fg">{formatarData(e.data)}</span>
                <span className="text-fg-soft"> · {e.tomOriginal ? `tom original (${e.tomFormatado})` : `em ${e.tomFormatado}`}</span>
                {e.evento && <span className="text-fg-muted"> · {e.evento}</span>}
                {e.obs && <span className="block text-[11px] text-fg-muted italic">{e.obs}</span>}
              </div>
              {e.historicoId && (
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => editar(e)} className="p-1 rounded text-fg-soft hover:text-brand-ink" title="Editar">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setExcluir(e)} className="p-1 rounded text-fg-soft hover:text-red-400" title="Excluir">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        isOpen={!!excluir}
        title="Excluir execução"
        message={excluir ? `Remover a execução de ${formatarData(excluir.data)} do histórico?` : ''}
        onClose={() => setExcluir(null)}
        onConfirm={() => {
          if (excluir?.historicoId) storage.deleteHistorico(excluir.historicoId);
          setExcluir(null);
          onChanged();
        }}
      />
    </div>
  );
};
