import React, { useState } from 'react';
import { BarberService } from '../../types';
import LucideIcon from '../LucideIcon';

interface ServicesTabProps {
  services: BarberService[];
  onUpdateServices: (updated: BarberService[]) => void;
  showToast: (title: string, message: string, type: 'success' | 'alert' | 'info' | 'reminder') => void;
  isLightTheme?: boolean;
}

const compressAndResizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 120;
        const MAX_HEIGHT = 120;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function ServicesTab({
  services,
  onUpdateServices,
  showToast,
  isLightTheme = false,
}: ServicesTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  
  // --- SERVICE CREATION FORM STATE ---
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('30');
  const [newServiceDuration, setNewServiceDuration] = useState('30');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceIcon, setNewServiceIcon] = useState('Scissors');
  const [newServiceImage, setNewServiceImage] = useState('');

  // --- SERVICE EDIT FORM STATE ---
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editServiceName, setEditServiceName] = useState('');
  const [editServicePrice, setEditServicePrice] = useState('30');
  const [editServiceDuration, setEditServiceDuration] = useState('30');
  const [editServiceDesc, setEditServiceDesc] = useState('');
  const [editServiceIcon, setEditServiceIcon] = useState('Scissors');
  const [editServiceImage, setEditServiceImage] = useState('');

  const availableIcons = ['Scissors', 'Sparkles', 'Crown', 'Eye', 'Paintbrush', 'Briefcase', 'TrendingUp', 'Bell'];

  // --- ADD NEW SERVICE FLOW ---
  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) {
      showToast('Nome em Branco', 'Por favor, digite um nome válido para o novo serviço.', 'alert');
      return;
    }

    const newService: BarberService = {
      id: 's-' + Date.now(),
      name: newServiceName.trim(),
      price: Number(newServicePrice) || 30,
      duration: Number(newServiceDuration) || 30,
      description: newServiceDesc.trim() || 'Sem descrição fornecida.',
      icon: newServiceIcon,
      image: newServiceImage || undefined,
    };

    onUpdateServices([...services, newService]);
    setNewServiceName('');
    setNewServiceDesc('');
    setNewServiceImage('');
    setShowAddForm(false);
    showToast('Serviço Criado!', `"${newService.name}" foi adicionado com sucesso.`, 'success');
  };

  // --- EDIT SERVICE FLOW ---
  const handleStartEditService = (service: BarberService) => {
    setEditingServiceId(service.id);
    setEditServiceName(service.name);
    setEditServicePrice(String(service.price));
    setEditServiceDuration(String(service.duration));
    setEditServiceDesc(service.description);
    setEditServiceIcon(service.icon);
    setEditServiceImage(service.image || '');
  };

  const handleSaveEditService = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editServiceName.trim()) {
      showToast('Nome em Branco', 'Por favor, digite um nome válido para o serviço.', 'alert');
      return;
    }

    const updated = services.map((s) => {
      if (s.id === id) {
        return {
          ...s,
          name: editServiceName.trim(),
          price: Number(editServicePrice) || 30,
          duration: Number(editServiceDuration) || 30,
          description: editServiceDesc.trim() || 'Sem descrição fornecida.',
          icon: editServiceIcon,
          image: editServiceImage || undefined,
        };
      }
      return s;
    });

    onUpdateServices(updated);
    setEditingServiceId(null);
    showToast('Serviço Atualizado', `O serviço "${editServiceName.trim()}" foi atualizado com sucesso.`, 'success');
  };

  // --- REMOVE SERVICE ---
  const handleDeleteService = (id: string, name: string) => {
    if (services.length <= 1) {
      showToast('Ação Bloqueada', 'A barbearia deve oferecer pelo menos 1 serviço cadastrado.', 'alert');
      return;
    }
    const filtered = services.filter((s) => s.id !== id);
    onUpdateServices(filtered);
    showToast('Serviço Removido', `O serviço "${name}" foi excluído.`, 'info');
  };

  return (
    <div className="space-y-4" id="services-view-content">
      <div className={`flex justify-between items-center p-3 rounded-2xl border transition-colors duration-300 ${
        isLightTheme ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
      }`}>
        <h3 className={`text-sm font-display font-black uppercase tracking-wider pl-1 ${
          isLightTheme ? 'text-slate-950 font-extrabold' : 'text-white'
        }`}>Serviços Cadastrados</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          id="toggle-add-service-form"
          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <LucideIcon name={showAddForm ? 'X' : 'Plus'} size={14} className="stroke-[2.5]" />
          {showAddForm ? 'Fechar' : 'Criar Novo'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddService} className={`p-5 border rounded-3xl space-y-4 shadow-xl transition-colors duration-300 ${
          isLightTheme ? 'bg-white border-slate-200 shadow-slate-200/30' : 'bg-slate-900 border-amber-500/20'
        }`}>
          <h4 className="text-xs font-mono uppercase tracking-widest text-amber-500 font-bold">Cadastrar Novo Serviço</h4>
          
          <div>
            <label className={`block text-[11px] font-semibold mb-1.5 ${
              isLightTheme ? 'text-slate-500' : 'text-slate-400'
            }`}>Nome do Serviço</label>
            <input
              type="text"
              required
              placeholder="Ex: Barba & Degradê Navalhado"
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              className={`w-full text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                isLightTheme ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white' : 'bg-slate-950 border-slate-800 text-white'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-[11px] font-semibold mb-1.5 ${
                isLightTheme ? 'text-slate-500' : 'text-slate-400'
              }`}>Preço (R$)</label>
              <input
                type="number"
                min="1"
                required
                value={newServicePrice}
                onChange={(e) => setNewServicePrice(e.target.value)}
                className={`w-full text-xs px-3.5 py-2.5 border rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                  isLightTheme ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              />
            </div>
            <div>
              <label className={`block text-[11px] font-semibold mb-1.5 ${
                isLightTheme ? 'text-slate-500' : 'text-slate-400'
              }`}>Duração</label>
              <select
                value={newServiceDuration}
                onChange={(e) => setNewServiceDuration(e.target.value)}
                className={`w-full text-xs px-3 py-2.5 border rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                  isLightTheme ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              >
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
                <option value="90">90 min</option>
              </select>
            </div>
          </div>

          <div>
            <label className={`block text-[11px] font-semibold mb-1.5 ${
              isLightTheme ? 'text-slate-500' : 'text-slate-400'
            }`}>Descrição Comercial</label>
            <input
              type="text"
              placeholder="Explique o que inclui o serviço..."
              value={newServiceDesc}
              onChange={(e) => setNewServiceDesc(e.target.value)}
              className={`w-full text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                isLightTheme ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white' : 'bg-slate-950 border-slate-800 text-white'
              }`}
            />
          </div>

          <div>
            <label className={`block text-[11px] font-semibold mb-1.5 ${
              isLightTheme ? 'text-slate-500' : 'text-slate-400'
            }`}>Ícone Ilustrativo</label>
            <div className={`flex gap-2 flex-wrap p-2.5 border rounded-xl ${
              isLightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800/80'
            }`}>
              {availableIcons.map((ico) => (
                <button
                  key={ico}
                  type="button"
                  onClick={() => setNewServiceIcon(ico)}
                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                    newServiceIcon === ico 
                      ? 'bg-amber-500 text-slate-950 font-bold' 
                      : `transition-colors ${isLightTheme ? 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50' : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800/60'}`
                  }`}
                >
                  <LucideIcon name={ico} size={14} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={`block text-[11px] font-semibold mb-1.5 ${
              isLightTheme ? 'text-slate-500' : 'text-slate-400'
            }`}>Imagem do Serviço (Opcional - Substitui o Ícone)</label>
            <div className={`p-3 border rounded-xl space-y-3 ${
              isLightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800/80'
            }`}>
              {newServiceImage ? (
                <div className="flex items-center gap-3">
                  <img
                    src={newServiceImage}
                    alt="Preview"
                    className="w-12 h-12 rounded-xl object-cover border border-slate-800"
                  />
                  <div className="flex-1">
                    <span className="text-[10px] text-emerald-500 font-bold block mb-1">✓ Imagem Carregada</span>
                    <button
                      type="button"
                      onClick={() => setNewServiceImage('')}
                      className="px-2.5 py-1 text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-lg border border-red-500/20 transition-all cursor-pointer"
                    >
                      Remover Imagem
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="new-service-file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressAndResizeImage(file);
                            setNewServiceImage(compressed);
                          } catch (err) {
                            showToast('Erro no Upload', 'Não foi possível processar esta imagem.', 'alert');
                          }
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="new-service-file"
                      className="flex-1 py-2 text-center border border-dashed rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border-amber-500/30 text-amber-500 hover:bg-amber-500/5 hover:border-amber-500"
                    >
                      Selecionar Arquivo
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">ou</span>
                    <input
                      type="text"
                      placeholder="Link da imagem (ex: https://...)"
                      value={newServiceImage}
                      onChange={(e) => setNewServiceImage(e.target.value)}
                      className={`flex-1 text-[10px] px-2.5 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                        isLightTheme ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            id="submit-new-service-btn"
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-955 text-slate-950 font-black rounded-xl text-xs hover:from-amber-400 hover:to-orange-400 transition-all cursor-pointer uppercase tracking-wider"
          >
            Salvar Serviço
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 gap-3">
        {services.map((srv) => {
          const isEditing = editingServiceId === srv.id;

          if (isEditing) {
            return (
              <form
                key={srv.id}
                onSubmit={(e) => handleSaveEditService(e, srv.id)}
                className={`border p-5 rounded-3xl space-y-4 shadow-xl transition-all ${
                  isLightTheme ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800/80'
                }`}
                id={`edit-service-form-${srv.id}`}
              >
                <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-800/20">
                  <span className="text-xs font-mono font-bold uppercase text-amber-500">Editar Serviço</span>
                  <button
                    type="button"
                    onClick={() => setEditingServiceId(null)}
                    className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="Cancelar"
                  >
                    <LucideIcon name="X" size={14} />
                  </button>
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold mb-1.5 ${
                    isLightTheme ? 'text-slate-500' : 'text-slate-400'
                  }`}>Nome do Serviço</label>
                  <input
                    type="text"
                    required
                    value={editServiceName}
                    onChange={(e) => setEditServiceName(e.target.value)}
                    className={`w-full text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isLightTheme ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1.5 ${
                      isLightTheme ? 'text-slate-500' : 'text-slate-400'
                    }`}>Preço (R$)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={editServicePrice}
                      onChange={(e) => setEditServicePrice(e.target.value)}
                      className={`w-full text-xs px-3.5 py-2.5 border rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                        isLightTheme ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white' : 'bg-slate-950 border-slate-800 text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1.5 ${
                      isLightTheme ? 'text-slate-500' : 'text-slate-400'
                    }`}>Duração</label>
                    <select
                      value={editServiceDuration}
                      onChange={(e) => setEditServiceDuration(e.target.value)}
                      className={`w-full text-xs px-3 py-2.5 border rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                        isLightTheme ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                      }`}
                    >
                      <option value="15">15 min</option>
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">60 min</option>
                      <option value="90">90 min</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold mb-1.5 ${
                    isLightTheme ? 'text-slate-500' : 'text-slate-400'
                  }`}>Descrição Comercial</label>
                  <input
                    type="text"
                    value={editServiceDesc}
                    onChange={(e) => setEditServiceDesc(e.target.value)}
                    className={`w-full text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isLightTheme ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold mb-1.5 ${
                    isLightTheme ? 'text-slate-500' : 'text-slate-400'
                  }`}>Ícone Ilustrativo</label>
                  <div className={`flex gap-2 flex-wrap p-2.5 border rounded-xl ${
                    isLightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800/80'
                  }`}>
                    {availableIcons.map((ico) => (
                      <button
                        key={ico}
                        type="button"
                        onClick={() => setEditServiceIcon(ico)}
                        className={`p-2 rounded-lg transition-all cursor-pointer ${
                          editServiceIcon === ico 
                            ? 'bg-amber-500 text-slate-950 font-bold' 
                            : `transition-colors ${isLightTheme ? 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50' : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800/60'}`
                        }`}
                      >
                        <LucideIcon name={ico} size={14} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold mb-1.5 ${
                    isLightTheme ? 'text-slate-500' : 'text-slate-400'
                  }`}>Imagem do Serviço (Opcional - Substitui o Ícone)</label>
                  <div className={`p-3 border rounded-xl space-y-3 ${
                    isLightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800/80'
                  }`}>
                    {editServiceImage ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={editServiceImage}
                          alt="Preview"
                          className="w-12 h-12 rounded-xl object-cover border border-slate-800"
                        />
                        <div className="flex-1">
                          <span className="text-[10px] text-emerald-500 font-bold block mb-1">✓ Imagem Carregada</span>
                          <button
                            type="button"
                            onClick={() => setEditServiceImage('')}
                            className="px-2.5 py-1 text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-lg border border-red-500/20 transition-all cursor-pointer"
                          >
                            Remover Imagem
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            id={`edit-service-file-${srv.id}`}
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const compressed = await compressAndResizeImage(file);
                                  setEditServiceImage(compressed);
                                } catch (err) {
                                  showToast('Erro no Upload', 'Não foi possível processar esta imagem.', 'alert');
                                }
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor={`edit-service-file-${srv.id}`}
                            className="flex-1 py-2 text-center border border-dashed rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border-amber-500/30 text-amber-500 hover:bg-amber-500/5 hover:border-amber-500"
                          >
                            Selecionar Arquivo
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">ou</span>
                          <input
                            type="text"
                            placeholder="Link da imagem (ex: https://...)"
                            value={editServiceImage}
                            onChange={(e) => setEditServiceImage(e.target.value)}
                            className={`flex-1 text-[10px] px-2.5 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                              isLightTheme ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingServiceId(null)}
                    className={`flex-1 py-3 border rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center ${
                      isLightTheme ? 'border-slate-300 text-slate-700 hover:bg-slate-50' : 'border-slate-800 text-slate-400 hover:bg-slate-950'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-955 text-slate-950 font-black rounded-xl text-xs hover:from-amber-400 hover:to-orange-400 transition-all cursor-pointer uppercase tracking-wider"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            );
          }

          return (
            <div key={srv.id} id={`admin-service-card-${srv.id}`} className={`border p-4 rounded-3xl flex items-center justify-between gap-3 shadow-md transition-colors duration-300 ${
              isLightTheme ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800/80'
            }`}>
              <div className="flex gap-3.5 items-start min-w-0">
                {srv.image ? (
                  <div className="w-[80px] h-[80px] rounded-2xl shrink-0 overflow-hidden border border-slate-800/40 self-center">
                    <img src={srv.image} alt={srv.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={`p-2.5 border rounded-xl text-amber-500 w-[80px] h-[80px] flex items-center justify-center shrink-0 self-center ${
                    isLightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700'
                  }`}>
                    <LucideIcon name={srv.icon} size={32} />
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className={`text-base font-bold truncate ${
                    isLightTheme ? 'text-slate-900' : 'text-white'
                  }`}>{srv.name}</h4>
                  <p className={`text-[11px] truncate max-w-[200px] mt-0.5 font-medium ${
                    isLightTheme ? 'text-slate-500' : 'text-slate-400'
                  }`}>{srv.description}</p>
                  <div className={`flex gap-1.5 text-[10px] font-mono mt-1 uppercase font-bold ${
                    isLightTheme ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    <span className="text-amber-500">R$ {srv.price.toFixed(2)}</span>
                    <span>•</span>
                    <span>{srv.duration} min</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id={`edit-service-btn-${srv.id}`}
                  onClick={() => handleStartEditService(srv)}
                  className={`p-3.5 rounded-2xl transition-colors cursor-pointer border border-transparent ${
                    isLightTheme ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-800' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Editar Serviço"
                >
                  <LucideIcon name="Edit" size={14} />
                </button>
                <button
                  type="button"
                  id={`delete-service-btn-${srv.id}`}
                  onClick={() => handleDeleteService(srv.id, srv.name)}
                  className={`p-3.5 rounded-2xl transition-colors cursor-pointer border border-transparent ${
                    isLightTheme ? 'hover:bg-red-50 text-red-500 hover:text-red-700 hover:border-red-200' : 'hover:bg-red-950/40 text-red-400 hover:text-red-300 hover:border-red-500/15'
                  }`}
                  title="Excluir Serviço"
                >
                  <LucideIcon name="Trash2" size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
