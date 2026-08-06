import React, { useState } from 'react';
import { Users, Plus, Phone, Mail, UserCheck, X } from 'lucide-react';
import { Integrante } from '../types';
import { storage } from '../services/storage';

interface IntegrantesViewProps {
  integrantes: Integrante[];
  onOpenNewMemberModal: () => void;
  onDataChanged: () => void;
}

export const IntegrantesView: React.FC<IntegrantesViewProps> = ({
  integrantes,
  onOpenNewMemberModal,
  onDataChanged
}) => {
  const [showModal, setShowModal] = useState(false);
  const [nome, setNome] = useState('');
  const [funcao, setFuncao] = useState('Vocal');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    storage.addIntegrante({
      Nome: nome.trim(),
      Funcao: funcao,
      Email: email.trim(),
      Telefone: telefone.trim(),
      Ativo: true
    });

    setNome('');
    setEmail('');
    setTelefone('');
    setShowModal(false);
    onDataChanged();
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            Equipe de Louvor
          </h2>
          <p className="text-xs text-slate-400">
            {integrantes.length} integrantes cadastrados
          </p>
        </div>

        <button
          id="add-team-member-button"
          onClick={() => setShowModal(true)}
          className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Músico</span>
        </button>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {integrantes.map((member) => (
          <div
            key={member.ID}
            className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-bold text-sm flex items-center justify-center border border-amber-500/30">
                  {member.Nome.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">
                    {member.Nome}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 inline-block mt-0.5">
                    {member.Funcao}
                  </span>
                </div>
              </div>

              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="text-xs space-y-1 pt-1 text-slate-400 border-t border-slate-800/60">
              {member.Email && (
                <div className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="truncate">{member.Email}</span>
                </div>
              )}
              {member.Telefone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                  <span>{member.Telefone}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Member Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white">Novo Integrante</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="ex: Davi Silva"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Função Principal</label>
                <select
                  value={funcao}
                  onChange={(e) => setFuncao(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Vocal / Violão">Vocal / Violão</option>
                  <option value="Vocal Lead">Vocal Lead</option>
                  <option value="Teclado / Vocal">Teclado / Vocal</option>
                  <option value="Guitarra Principal">Guitarra Principal</option>
                  <option value="Violão Aço">Violão Aço</option>
                  <option value="Baixo">Baixo</option>
                  <option value="Bateria">Bateria</option>
                  <option value="Som / Áudio">Som / Áudio</option>
                  <option value="Mídia / Projeção">Mídia / Projeção</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: davi@tpflame.org"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
