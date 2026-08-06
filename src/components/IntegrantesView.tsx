import React, { useState } from 'react';
import { Users, Plus, Phone, Mail, X, Trash2, Edit2, Check, ArrowLeft } from 'lucide-react';
import { Integrante, ViewTab } from '../types';
import { storage } from '../services/storage';

interface IntegrantesViewProps {
  integrantes: Integrante[];
  onOpenNewMemberModal: () => void;
  onDataChanged: () => void;
  onNavigate?: (tab: ViewTab) => void;
}

const AVAILABLE_ROLES = [
  'Ministro / Vocal',
  'Vocal Lead',
  'Violão',
  'Guitarra',
  'Baixo',
  'Teclado',
  'Bateria',
  'Som / Áudio',
  'Mídia / Projeção'
];

export const IntegrantesView: React.FC<IntegrantesViewProps> = ({
  integrantes,
  onDataChanged,
  onNavigate
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Integrante | null>(null);
  
  const [nome, setNome] = useState('');
  const [selectedFuncoes, setSelectedFuncoes] = useState<string[]>(['Vocal Lead']);
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');

  const handleOpenAdd = () => {
    setEditingMember(null);
    setNome('');
    setSelectedFuncoes(['Ministro / Vocal']);
    setEmail('');
    setTelefone('');
    setShowModal(true);
  };

  const handleOpenEdit = (member: Integrante) => {
    setEditingMember(member);
    setNome(member.Nome);
    const roles = member.Funcao.split(',').map((r) => r.trim()).filter(Boolean);
    setSelectedFuncoes(roles.length > 0 ? roles : ['Ministro / Vocal']);
    setEmail(member.Email || '');
    setTelefone(member.Telefone || '');
    setShowModal(true);
  };

  const toggleRole = (role: string) => {
    if (selectedFuncoes.includes(role)) {
      if (selectedFuncoes.length > 1) {
        setSelectedFuncoes(selectedFuncoes.filter((r) => r !== role));
      }
    } else {
      setSelectedFuncoes([...selectedFuncoes, role]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    const funcaoStr = selectedFuncoes.join(', ');

    if (editingMember) {
      storage.updateIntegrante(editingMember.ID, {
        Nome: nome.trim(),
        Funcao: funcaoStr,
        Email: email.trim(),
        Telefone: telefone.trim()
      });
    } else {
      storage.addIntegrante({
        Nome: nome.trim(),
        Funcao: funcaoStr,
        Email: email.trim(),
        Telefone: telefone.trim(),
        Ativo: true
      });
    }

    setShowModal(false);
    onDataChanged();
  };

  const handleDeleteMember = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja remover ${name} da equipe?`)) {
      storage.deleteIntegrante(id);
      onDataChanged();
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Top Mobile Back Navigation */}
      {onNavigate && (
        <button
          onClick={() => onNavigate('mais')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF4D00] hover:underline bg-[#121212] border border-slate-800/80 px-3 py-2 rounded-xl transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Mais</span>
        </button>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-[#FF4D00]" />
            Equipe de Louvor
          </h2>
          <p className="text-xs text-slate-400">
            {integrantes.length} integrantes com funções flexíveis e multi-instrumentistas
          </p>
        </div>

        <button
          id="add-team-member-button"
          onClick={handleOpenAdd}
          className="py-2.5 px-3.5 rounded-xl bg-[#FF4D00] hover:bg-[#e04400] text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Músico</span>
        </button>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {integrantes.map((member) => {
          const roles = member.Funcao.split(',').map((r) => r.trim()).filter(Boolean);

          return (
            <div
              key={member.ID}
              className="bg-[#121212] border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-md relative group hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF4D00]/10 text-[#FF4D00] font-black text-sm flex items-center justify-center border border-[#FF4D00]/20 shrink-0">
                    {member.Nome.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">
                      {member.Nome}
                    </h3>

                    {/* Roles Badges / Multi-Instrument Tags */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {roles.map((r) => (
                        <span
                          key={r}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FF4D00]/10 text-[#FF4D00] border border-[#FF4D00]/20 inline-block"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(member)}
                    className="p-1.5 text-slate-400 hover:text-[#FF4D00] hover:bg-[#1f1f1f] rounded-lg transition-colors"
                    title="Editar Integrante"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member.ID, member.Nome)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
                    title="Remover Integrante"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-xs space-y-1 pt-2 text-slate-400 border-t border-slate-800/60">
                {member.Email && (
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{member.Email}</span>
                  </div>
                )}
                {member.Telefone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{member.Telefone}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New / Edit Member Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white">
                {editingMember ? 'Editar Integrante' : 'Novo Integrante'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="ex: Davi Silva"
                  className="w-full bg-[#080808] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  required
                />
              </div>

              {/* Multi-Instrument Selection Chips */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Funções & Instrumentos (Selecione todas que se aplicam)
                </label>
                <div className="flex flex-wrap gap-1.5 bg-[#080808] p-3 rounded-xl border border-slate-800">
                  {AVAILABLE_ROLES.map((role) => {
                    const isSelected = selectedFuncoes.includes(role);
                    return (
                      <button
                        type="button"
                        key={role}
                        onClick={() => toggleRole(role)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-[#FF4D00] text-slate-950 font-extrabold shadow-sm'
                            : 'bg-[#181818] text-slate-400 border border-slate-800 hover:text-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{role}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Selecione múltiplos instrumentos para o mesmo integrante (ex: Ministro + Baixo + Violão).
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: davi@tpflame.org"
                  className="w-full bg-[#080808] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full bg-[#080808] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 text-xs text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#FF4D00] text-slate-950 font-black text-xs shadow-md"
                >
                  {editingMember ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
