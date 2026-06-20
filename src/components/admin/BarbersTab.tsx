import React, { useState } from 'react';
import { Barber } from '../../types';
import LucideIcon from '../LucideIcon';
import { hashPassword } from '../../utils';

interface BarbersTabProps {
  barbers: Barber[];
  onUpdateBarbers: (updated: Barber[]) => void;
  showToast: (title: string, message: string, type: 'success' | 'alert' | 'info' | 'reminder') => void;
  isLightTheme?: boolean;
}

export default function BarbersTab({
  barbers,
  onUpdateBarbers,
  showToast,
  isLightTheme = false,
}: BarbersTabProps) {
  const [showAddBarberForm, setShowAddBarberForm] = useState(false);

  // --- BARBER CREATION FORM STATE ---
  const [newBarberName, setNewBarberName] = useState('');
  const [newBarberUsername, setNewBarberUsername] = useState('');
  const [newBarberPassword, setNewBarberPassword] = useState('');
  const [newBarberColor, setNewBarberColor] = useState<'amber' | 'emerald' | 'indigo'>('amber');

  // --- BARBER EDIT STATE ---
  const [editingBarberId, setEditingBarberId] = useState<string | null>(null);
  const [editBarberName, setEditBarberName] = useState('');
  const [editBarberUsername, setEditBarberUsername] = useState('');
  const [editBarberPassword, setEditBarberPassword] = useState('');
  const [editBarberColor, setEditBarberColor] = useState<'amber' | 'emerald' | 'indigo'>('amber');

  // --- ADD NEW BARBER FLOW ---
  const handleAddBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBarberName.trim() || !newBarberUsername.trim() || !newBarberPassword.trim()) {
      showToast('Dados Incompletos', 'Preencha o nome, usuário e senha para o novo barbeiro.', 'alert');
      return;
    }

    const usernameExists = barbers.some((b) => b.username.toLowerCase() === newBarberUsername.trim().toLowerCase());
    if (usernameExists) {
      showToast('Usuário Já Existe', 'Este nome de usuário já está sendo usado por outro barbeiro.', 'alert');
      return;
    }

    // Criptografa a senha antes de enviar para salvar
    const hashedPassword = await hashPassword(newBarberPassword);

    const newBarber: Barber = {
      id: 'b-' + Date.now(),
      name: newBarberName.trim(),
      username: newBarberUsername.trim().toLowerCase(),
      password: hashedPassword,
      active: true,
      color: newBarberColor,
    };

    onUpdateBarbers([...barbers, newBarber]);
    setNewBarberName('');
    setNewBarberUsername('');
    setNewBarberPassword('');
    setShowAddBarberForm(false);
    showToast('Barbeiro Criado!', `Acesso de "${newBarber.name}" criado com sucesso.`, 'success');
  };

  const handleToggleBarberActive = (id: string) => {
    const activeCount = barbers.filter(b => b.active).length;
    const targetBarber = barbers.find(b => b.id === id);
    if (targetBarber?.active && activeCount <= 1) {
      showToast('Ação Bloqueada', 'Deve haver pelo menos 1 barbeiro ativo para atender os clientes.', 'alert');
      return;
    }

    const updated = barbers.map((b) => {
      if (b.id === id) {
        return { ...b, active: !b.active };
      }
      return b;
    });
    onUpdateBarbers(updated);
    showToast('Status Atualizado', 'Disponibilidade do barbeiro foi alterada.', 'info');
  };

  const handleStartEditBarber = (barber: Barber) => {
    setEditingBarberId(barber.id);
    setEditBarberName(barber.name);
    setEditBarberUsername(barber.username);
    setEditBarberPassword(''); // Deixa em branco por segurança (não exibe o hash salvo)
    setEditBarberColor((barber.color || 'amber') as 'amber' | 'emerald' | 'indigo');
  };

  const handleSaveEditBarber = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editBarberName.trim() || !editBarberUsername.trim()) {
      showToast('Dados Incompletos', 'Preencha o nome e usuário para o barbeiro.', 'alert');
      return;
    }

    const usernameExists = barbers.some((b) => b.id !== id && b.username.toLowerCase() === editBarberUsername.trim().toLowerCase());
    if (usernameExists) {
      showToast('Usuário Já Existe', 'Este nome de usuário já está sendo usado por outro barbeiro.', 'alert');
      return;
    }

    const originalBarber = barbers.find((b) => b.id === id);
    let targetPassword = originalBarber?.password || '';

    // Se o usuário digitou uma nova senha, faz o hash. Senão, mantém a antiga
    if (editBarberPassword.trim() !== '') {
      targetPassword = await hashPassword(editBarberPassword.trim());
    }

    const updated = barbers.map((b) => {
      if (b.id === id) {
        return {
          ...b,
          name: editBarberName.trim(),
          username: editBarberUsername.trim().toLowerCase(),
          password: targetPassword,
          color: editBarberColor,
        };
      }
      return b;
    });

    onUpdateBarbers(updated);
    setEditingBarberId(null);
    showToast('Barbeiro Atualizado', 'Os dados do barbeiro foram salvos.', 'success');
  };

  const handleDeleteBarber = (id: string, name: string) => {
    const filtered = barbers.filter((b) => b.id !== id);
    onUpdateBarbers(filtered);
    showToast('Barbeiro Removido', `O profissional "${name}" foi excluído.`, 'info');
  };

  return (
    <div className="space-y-4" id="barbers-view-content">
      <div className="flex justify-between items-center">
        <h3 className={`text-sm font-display font-black uppercase tracking-wider flex items-center gap-1.5 ${
          isLightTheme ? 'text-slate-900' : 'text-white'
        }`}>
          <LucideIcon name="Contact" size={14} className="text-amber-500" />
          Gestão de Barbeiros ({barbers.length})
        </h3>
        <button
          onClick={() => setShowAddBarberForm(!showAddBarberForm)}
          id="toggle-add-barber-btn"
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center gap-1 cursor-pointer transition-colors"
        >
          <LucideIcon name={showAddBarberForm ? "X" : "Plus"} size={12} className="stroke-[2.5]" />
          {showAddBarberForm ? "Fechar" : "Novo Acesso"}
        </button>
      </div>

      {showAddBarberForm && (
        <form onSubmit={handleAddBarber} className={`border rounded-3xl p-5 space-y-4 shadow-xl transition-all ${
          isLightTheme ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800'
        }`} id="add-barber-form-container">
          <h4 className="text-xs font-mono font-bold uppercase text-slate-400">Cadastrar Novo Profissional</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-[11px] font-semibold mb-1.5 ${
                isLightTheme ? 'text-slate-500' : 'text-slate-400'
              }`}>Nome Completo <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                placeholder="Ex: João da Costa"
                value={newBarberName}
                onChange={(e) => setNewBarberName(e.target.value)}
                className={`w-full text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                  isLightTheme ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              />
            </div>

            <div>
              <label className={`block text-[11px] font-semibold mb-1.5 ${
                isLightTheme ? 'text-slate-500' : 'text-slate-400'
              }`}>Usuário de Login <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                placeholder="Ex: joao.barber (letras minusculas)"
                value={newBarberUsername}
                onChange={(e) => setNewBarberUsername(e.target.value)}
                className={`w-full text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                  isLightTheme ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-[11px] font-semibold mb-1.5 ${
                isLightTheme ? 'text-slate-500' : 'text-slate-400'
              }`}>Senha de Acesso <span className="text-red-500">*</span></label>
              <input
                type="password"
                required
                placeholder="Digite a senha"
                value={newBarberPassword}
                onChange={(e) => setNewBarberPassword(e.target.value)}
                className={`w-full text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                  isLightTheme ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              />
            </div>

            <div>
              <label className={`block text-[11px] font-semibold mb-1.5 ${
                isLightTheme ? 'text-slate-500' : 'text-slate-400'
              }`}>Cor de Identificação</label>
              <div className="flex gap-3 py-1">
                {['amber', 'emerald', 'indigo'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewBarberColor(color as any)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      newBarberColor === color
                        ? 'border-amber-500 bg-amber-500/10 text-amber-500 font-bold'
                        : isLightTheme
                        ? 'border-slate-200 text-slate-600 bg-white'
                        : 'border-slate-800 text-slate-400 bg-slate-900'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      color === 'emerald' ? 'bg-emerald-500' : color === 'indigo' ? 'bg-indigo-500' : 'bg-amber-500'
                    }`} />
                    <span className="capitalize">{color === 'emerald' ? 'Verde' : color === 'indigo' ? 'Azul' : 'Laranja'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            id="submit-new-barber-btn"
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-955 text-slate-950 font-black rounded-xl text-xs hover:from-amber-400 hover:to-orange-400 transition-all cursor-pointer uppercase tracking-wider"
          >
            Gerar Conta do Barbeiro
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 gap-3">
        {barbers.map((barber) => {
          const isEditing = editingBarberId === barber.id;

          if (isEditing) {
            return (
              <form
                key={barber.id}
                onSubmit={(e) => handleSaveEditBarber(e, barber.id)}
                className={`border p-5 rounded-3xl space-y-4 shadow-xl transition-all ${
                  isLightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}
                id={`edit-barber-form-${barber.id}`}
              >
                <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-800/40">
                  <span className="text-xs font-mono font-bold uppercase text-slate-400">Editar Cadastro</span>
                  <button
                    type="button"
                    onClick={() => setEditingBarberId(null)}
                    className="text-slate-400 hover:text-red-405 hover:text-red-500 transition-colors cursor-pointer"
                    title="Cancelar"
                  >
                    <LucideIcon name="X" size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1.5 ${
                      isLightTheme ? 'text-slate-500' : 'text-slate-400'
                    }`}>Nome Completo <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={editBarberName}
                      onChange={(e) => setEditBarberName(e.target.value)}
                      className={`w-full text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                        isLightTheme ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white' : 'bg-slate-950 border-slate-800 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[11px] font-semibold mb-1.5 ${
                      isLightTheme ? 'text-slate-500' : 'text-slate-400'
                    }`}>Usuário de Login <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={editBarberUsername}
                      onChange={(e) => setEditBarberUsername(e.target.value)}
                      className={`w-full text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                        isLightTheme ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white' : 'bg-slate-950 border-slate-800 text-white'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1.5 ${
                      isLightTheme ? 'text-slate-500' : 'text-slate-400'
                    }`}>Nova Senha de Acesso</label>
                    <input
                      type="password"
                      placeholder="Deixe em branco para manter a atual"
                      value={editBarberPassword}
                      onChange={(e) => setEditBarberPassword(e.target.value)}
                      className={`w-full text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                        isLightTheme ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white' : 'bg-slate-950 border-slate-800 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[11px] font-semibold mb-1.5 ${
                      isLightTheme ? 'text-slate-500' : 'text-slate-400'
                    }`}>Cor de Identificação</label>
                    <div className="flex gap-2">
                      {['amber', 'emerald', 'indigo'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setEditBarberColor(color as any)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                            editBarberColor === color
                              ? 'border-amber-500 bg-amber-500/10 text-amber-500 font-bold'
                              : isLightTheme
                              ? 'border-slate-200 text-slate-600 bg-white'
                              : 'border-slate-800 text-slate-400 bg-slate-900'
                          }`}
                        >
                          <div className={`w-2.5 h-2.5 rounded-full ${
                            color === 'emerald' ? 'bg-emerald-500' : color === 'indigo' ? 'bg-indigo-500' : 'bg-amber-500'
                          }`} />
                          <span className="capitalize">{color === 'emerald' ? 'Verde' : color === 'indigo' ? 'Azul' : 'Laranja'}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-955 text-slate-950 font-black rounded-xl text-xs hover:from-amber-400 hover:to-orange-400 transition-all cursor-pointer uppercase tracking-wider"
                  >
                    Salvar Alterações
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingBarberId(null)}
                    className={`flex-1 py-2.5 border rounded-xl text-xs font-bold transition-all cursor-pointer uppercase tracking-wider ${
                      isLightTheme
                        ? 'bg-slate-50 hover:bg-slate-105 hover:bg-slate-100 border-slate-205 border-slate-200 text-slate-600'
                        : 'bg-slate-950/40 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            );
          }

          return (
            <div key={barber.id} id={`admin-barber-card-${barber.id}`} className={`border p-4 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md transition-colors duration-300 ${
              isLightTheme ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800/80'
            }`}>
              <div className="flex gap-3.5 items-center min-w-0">
                <div className={`p-3 border rounded-full relative shrink-0 ${
                  isLightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-750 border-slate-700'
                }`}>
                  <LucideIcon name="User" size={17} className={
                    barber.color === 'emerald' ? 'text-emerald-500' : barber.color === 'indigo' ? 'text-indigo-500' : 'text-amber-500'
                  } />
                  <div className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900 ${
                    barber.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
                  }`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-base font-bold truncate ${
                      isLightTheme ? 'text-slate-900' : 'text-white'
                    }`}>{barber.name}</h4>
                    <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-mono font-bold ${
                      barber.active 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {barber.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className={`text-[11px] truncate mt-0.5 font-medium flex items-center gap-1 ${
                    isLightTheme ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    <LucideIcon name="Briefcase" size={11} className="text-slate-500" />
                    Usuário: <span className="font-mono font-bold text-amber-500">{barber.username}</span>
                  </p>
                  <p className={`text-[11px] mt-0.5 flex items-center gap-1 ${
                    isLightTheme ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    <span>Senha:</span>
                    <span className="font-mono">••••••••</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 border-t sm:border-t-0 pt-2.5 sm:pt-0">
                <button
                  type="button"
                  onClick={() => handleStartEditBarber(barber)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                    isLightTheme
                      ? 'hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800'
                      : 'hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                  title="Editar dados"
                >
                  <LucideIcon name="Edit" size={12} />
                  Editar
                </button>

                <button
                  type="button"
                  id={`toggle-barber-btn-${barber.id}`}
                  onClick={() => handleToggleBarberActive(barber.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    barber.active
                      ? isLightTheme
                        ? 'hover:bg-amber-50 border-amber-200 text-amber-600 hover:text-amber-700'
                        : 'hover:bg-amber-950/45 hover:bg-amber-950/40 border-amber-500/10 text-amber-500 hover:text-amber-300'
                      : isLightTheme
                      ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-600'
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/10 text-emerald-450 text-emerald-400'
                  }`}
                  title={barber.active ? "Desativar" : "Ativar"}
                >
                  {barber.active ? "Desativar" : "Ativar"}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteBarber(barber.id, barber.name)}
                  className={`p-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center ${
                    isLightTheme
                      ? 'hover:bg-red-50 border-red-200 text-red-600 hover:text-red-700'
                      : 'hover:bg-red-950/30 border-red-500/10 text-red-400'
                  }`}
                  title="Excluir profissional"
                >
                  <LucideIcon name="Trash2" size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
