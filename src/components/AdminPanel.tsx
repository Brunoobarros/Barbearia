import React, { useState } from 'react';
import { BarberService, WorkingConfig, Appointment, Barber } from '../types';
import LucideIcon from './LucideIcon';

interface AdminPanelProps {
  services: BarberService[];
  onUpdateServices: (updated: BarberService[]) => void;
  workingConfig: WorkingConfig;
  onUpdateConfig: (updated: WorkingConfig) => void;
  appointments: Appointment[];
  showToast: (title: string, message: string, type: 'success' | 'alert' | 'info' | 'reminder') => void;
  isLightTheme?: boolean;
  barbers: Barber[];
  onUpdateBarbers: (updated: Barber[]) => void;
  loggedBarberId?: string;
  shopName?: string;
  onUpdateShopName?: (name: string) => void;
}

export default function AdminPanel({
  services,
  onUpdateServices,
  workingConfig,
  onUpdateConfig,
  appointments,
  showToast,
  isLightTheme = false,
  barbers = [],
  onUpdateBarbers,
  loggedBarberId,
  shopName = 'Barbearia Premium',
  onUpdateShopName,
}: AdminPanelProps) {
  // Navigation tabs inside Admin
  const [adminTab, setAdminTab] = useState<'stats' | 'services' | 'hours' | 'barbers'>('stats');
  const [showCompletedList, setShowCompletedList] = useState(false);
  const [statsBreakdownTab, setStatsBreakdownTab] = useState<'today' | '7days'>('7days');
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  // --- BARBER CREATION FORM STATE ---
  const [newBarberName, setNewBarberName] = useState('');
  const [newBarberUsername, setNewBarberUsername] = useState('');
  const [newBarberPassword, setNewBarberPassword] = useState('');
  const [newBarberColor, setNewBarberColor] = useState<'amber' | 'emerald' | 'indigo'>('amber');
  const [showAddBarberForm, setShowAddBarberForm] = useState(false);

  // --- BARBER EDIT STATE ---
  const [editingBarberId, setEditingBarberId] = useState<string | null>(null);
  const [editBarberName, setEditBarberName] = useState('');
  const [editBarberUsername, setEditBarberUsername] = useState('');
  const [editBarberPassword, setEditBarberPassword] = useState('');
  const [editBarberColor, setEditBarberColor] = useState<'amber' | 'emerald' | 'indigo'>('amber');

  // --- SERVICE CREATION FORM STATE ---
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('30');
  const [newServiceDuration, setNewServiceDuration] = useState('30');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceIcon, setNewServiceIcon] = useState('Scissors');
  const [showAddForm, setShowAddForm] = useState(false);

  // --- WORKING CONFIG LOCAL STATE ---
  const [startHour, setStartHour] = useState(workingConfig.startHour);
  const [endHour, setEndHour] = useState(workingConfig.endHour);
  const [intervalMinutes, setIntervalMinutes] = useState(workingConfig.intervalMinutes.toString());
  const [selectedDays, setSelectedDays] = useState<number[]>(workingConfig.workingDays);

  React.useEffect(() => {
    setStartHour(workingConfig.startHour);
    setEndHour(workingConfig.endHour);
    setIntervalMinutes(workingConfig.intervalMinutes.toString());
    setSelectedDays(workingConfig.workingDays);
  }, [workingConfig]);

  const availableIcons = ['Scissors', 'Sparkles', 'Crown', 'Eye', 'Paintbrush', 'Briefcase', 'TrendingUp', 'Bell'];

  // --- WORKDAY SELECTION TOGGLE ---
  const handleDayToggle = (day: number) => {
    const updated = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day].sort((a, b) => a - b);
    
    setSelectedDays(updated);
  };

  // --- SUBMIT COMPLETED WORKING HOURS ---
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDays.length === 0) {
      showToast('Nenhum dia ativo', 'Selecione pelo menos um dia útil para a barbearia.', 'alert');
      return;
    }

    onUpdateConfig({
      startHour,
      endHour,
      intervalMinutes: Number(intervalMinutes),
      workingDays: selectedDays,
    });
    showToast('Configurações Salvas', 'Os horários de atendimento da barbearia foram atualizados.', 'success');
  };

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
    };

    onUpdateServices([...services, newService]);
    setNewServiceName('');
    setNewServiceDesc('');
    setShowAddForm(false);
    showToast('Serviço Criado!', `"${newService.name}" foi adicionado com sucesso.`, 'success');
  };

  // --- REMOVE SERVICE ACCORDINGLY ---
  const handleDeleteService = (id: string, name: string) => {
    if (services.length <= 1) {
      showToast('Ação Bloqueada', 'A barbearia deve oferecer pelo menos 1 serviço cadastrado.', 'alert');
      return;
    }
    const filtered = services.filter((s) => s.id !== id);
    onUpdateServices(filtered);
    showToast('Serviço Removido', `O serviço "${name}" foi excluído.`, 'info');
  };

  // --- BARBER MANAGEMENT FLOW ---
  const handleAddBarber = (e: React.FormEvent) => {
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

    const newBarber: Barber = {
      id: 'b-' + Date.now(),
      name: newBarberName.trim(),
      username: newBarberUsername.trim().toLowerCase(),
      password: newBarberPassword,
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
    setEditBarberPassword(barber.password || '');
    setEditBarberColor((barber.color || 'amber') as 'amber' | 'emerald' | 'indigo');
  };

  const handleSaveEditBarber = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editBarberName.trim() || !editBarberUsername.trim() || !editBarberPassword.trim()) {
      showToast('Dados Incompletos', 'Preencha o nome, usuário e senha para o barbeiro.', 'alert');
      return;
    }

    const usernameExists = barbers.some((b) => b.id !== id && b.username.toLowerCase() === editBarberUsername.trim().toLowerCase());
    if (usernameExists) {
      showToast('Usuário Já Existe', 'Este nome de usuário já está sendo usado por outro barbeiro.', 'alert');
      return;
    }

    const updated = barbers.map((b) => {
      if (b.id === id) {
        return {
          ...b,
          name: editBarberName.trim(),
          username: editBarberUsername.trim().toLowerCase(),
          password: editBarberPassword,
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
    // Permite excluir qualquer profissional cadastrado
    const filtered = barbers.filter((b) => b.id !== id);
    onUpdateBarbers(filtered);
    showToast('Barbeiro Removido', `O profissional "${name}" foi excluído.`, 'info');
  };

  // --- STATISTICS ENGINE ---
  const TODAY_STR = (() => {
    const now = new Date();
    const yStr = now.getFullYear();
    const mStr = (now.getMonth() + 1).toString().padStart(2, '0');
    const dStr = now.getDate().toString().padStart(2, '0');
    return `${yStr}-${mStr}-${dStr}`;
  })();

  const completedAppointments = appointments.filter((a) => a.status === 'completed' && a.date === TODAY_STR);
  const activeAppointments = appointments.filter((a) => a.status === 'confirmed' || a.status === 'pending');
  
  const completedRevenue = completedAppointments.reduce((acc, apt) => {
    const s = services.find((srv) => srv.id === apt.serviceId);
    return acc + (s ? s.price : 0);
  }, 0);

  const totalRevenue = activeAppointments.reduce((acc, apt) => {
    const s = services.find((srv) => srv.id === apt.serviceId);
    return acc + (s ? s.price : 0);
  }, 0);

  // Helper to get the last 7 date strings (inclusive of today)
  const getLastSevenDaysList = (): string[] => {
    const days: string[] = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const yStr = d.getFullYear();
      const mStr = (d.getMonth() + 1).toString().padStart(2, '0');
      const dStr = d.getDate().toString().padStart(2, '0');
      days.push(`${yStr}-${mStr}-${dStr}`);
    }
    return days;
  };

  const formatPortugueseDayLabel = (dateStr: string, index: number) => {
    if (index === 0) return 'Hoje';
    if (index === 1) return 'Ontem';
    
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return `${weekDays[dateObj.getDay() || 0]}, ${d.toString().padStart(2, '0')}/${m.toString().padStart(2, '0')}`;
  };

  const last7Days = getLastSevenDaysList();
  const dailyStats = last7Days.map((dStr, idx) => {
    const dayCompleted = appointments.filter((a) => a.status === 'completed' && a.date === dStr);
    const revenue = dayCompleted.reduce((acc, apt) => {
      const s = services.find((srv) => srv.id === apt.serviceId);
      return acc + (s ? s.price : 0);
    }, 0);
    return {
      date: dStr,
      label: formatPortugueseDayLabel(dStr, idx),
      appointmentsCount: dayCompleted.length,
      revenue,
      appointments: dayCompleted,
    };
  });

  const maxRevenue = Math.max(...dailyStats.map((d) => d.revenue), 1);

  // Compute most popular service item
  const serviceCounters: { [key: string]: number } = {};
  activeAppointments.forEach((a) => {
    serviceCounters[a.serviceId] = (serviceCounters[a.serviceId] || 0) + 1;
  });

  let popularServiceName = 'Misto / Diversos';
  let maxCount = 0;
  Object.entries(serviceCounters).forEach(([srvId, count]) => {
    if (count > maxCount) {
      maxCount = count;
      const srv = services.find((s) => s.id === srvId);
      if (srv) popularServiceName = `${srv.name} (${count}x)`;
    }
  });

  const weekDayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="space-y-4">
      {/* Sub menu inside panel */}
      <div className={`flex border rounded-2xl p-1 overflow-hidden shadow-md transition-colors duration-300 ${
        isLightTheme ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <button
          onClick={() => setAdminTab('stats')}
          className={`flex-1 py-2.5 text-xs font-display font-bold rounded-xl transition-all cursor-pointer flex justify-center items-center gap-1.5 uppercase tracking-wider text-[10px] ${
            adminTab === 'stats' 
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black' 
              : (isLightTheme ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white')
          }`}
          id="admin-tab-stats"
        >
          <LucideIcon name="TrendingUp" size={13} />
          Métricas
        </button>
        {!loggedBarberId && (
          <button
            onClick={() => setAdminTab('barbers')}
            className={`flex-1 py-2.5 text-xs font-display font-bold rounded-xl transition-all cursor-pointer flex justify-center items-center gap-1.5 uppercase tracking-wider text-[10px] ${
              adminTab === 'barbers' 
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black' 
                : (isLightTheme ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white')
            }`}
            id="admin-tab-barbers"
          >
            <LucideIcon name="Contact" size={13} />
            Barbeiros
          </button>
        )}
        <button
          onClick={() => setAdminTab('services')}
          className={`flex-1 py-2.5 text-xs font-display font-bold rounded-xl transition-all cursor-pointer flex justify-center items-center gap-1.5 uppercase tracking-wider text-[10px] ${
            adminTab === 'services' 
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black' 
              : (isLightTheme ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white')
          }`}
          id="admin-tab-services"
        >
          <LucideIcon name="Scissors" size={13} />
          Serviços
        </button>
        <button
          onClick={() => setAdminTab('hours')}
          className={`flex-1 py-2.5 text-xs font-display font-bold rounded-xl transition-all cursor-pointer flex justify-center items-center gap-1.5 uppercase tracking-wider text-[10px] ${
            adminTab === 'hours' 
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black' 
              : (isLightTheme ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white')
          }`}
          id="admin-tab-hours"
        >
          <LucideIcon name="Settings" size={13} />
          Horários
        </button>
      </div>

      {/* ADMIN STATE CONTAINER */}
      {adminTab === 'stats' && (
        <div className="space-y-4" id="stats-view-content">
          <div className="grid grid-cols-2 gap-3.5">
            <button
              onClick={() => setShowCompletedList(!showCompletedList)}
              className={`border text-left rounded-3xl p-5 flex flex-col justify-between shadow-lg transition-all cursor-pointer select-none group relative overflow-hidden ${
                showCompletedList 
                  ? 'border-amber-500 ring-1 ring-amber-500/20' 
                  : (isLightTheme ? 'border-slate-200 hover:border-amber-500/30' : 'border-slate-800 hover:border-amber-500/50')
              } ${
                isLightTheme ? 'bg-white hover:bg-slate-50/60' : 'bg-slate-900 hover:bg-slate-900/85'
              }`}
            >
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full pointer-events-none" />
              
              <div className="flex justify-between items-start w-full">
                <span className={`text-[10px] uppercase font-mono tracking-widest font-bold group-hover:text-amber-500 transition-colors ${
                  isLightTheme ? 'text-slate-500' : 'text-slate-400'
                }`}>Faturamento de Hoje</span>
                <LucideIcon name={showCompletedList ? "ChevronUp" : "ChevronDown"} size={14} className="text-slate-500 group-hover:text-amber-500 transition-colors" />
              </div>
              
              <span className="text-2xl font-display font-black text-emerald-400 mt-2 font-mono leading-none py-1 block">
                R$ {completedRevenue.toFixed(2)}
              </span>
              <span className={`text-[9px] mt-1 uppercase tracking-wider font-bold flex items-center gap-1.5 ${
                isLightTheme ? 'text-slate-500' : 'text-slate-500'
              }`}>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                {completedAppointments.length} Concluído{completedAppointments.length !== 1 ? 's' : ''}
              </span>
            </button>
            
            <div className={`border rounded-3xl p-5 flex flex-col justify-between shadow-lg transition-colors duration-300 ${
              isLightTheme ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}>
              <span className={`text-[10px] uppercase font-mono tracking-widest font-bold ${
                isLightTheme ? 'text-slate-500' : 'text-slate-400'
              }`}>Total Reservado</span>
              <span className="text-2xl font-display font-black text-amber-500 mt-2 leading-none py-1 block">
                {activeAppointments.length} Clientes
              </span>
              <span className={`text-[9px] mt-1 uppercase tracking-wider font-bold ${
                isLightTheme ? 'text-slate-500' : 'text-slate-400'
              }`}>Atendimentos Ativos</span>
            </div>
          </div>

          {/* Completed lists collapse section */}
          {showCompletedList && (
            <div className={`border rounded-3xl p-5 space-y-4 shadow-2xl relative animate-none transition-colors duration-300 ${
              isLightTheme ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-slate-900/95 border-amber-500/25'
            }`}>
              <div className="flex justify-between items-center pb-1">
                <h4 className="text-xs font-display font-black uppercase tracking-wider text-amber-500 flex items-center gap-2">
                  <LucideIcon name="TrendingUp" size={14} className="text-amber-500" />
                  Métricas de Atendimento
                </h4>
                <button
                  onClick={() => setShowCompletedList(false)}
                  className="text-slate-500 hover:text-white transition-colors cursor-pointer p-1"
                >
                  <LucideIcon name="X" size={13} />
                </button>
              </div>

              {/* Segmented Tab Controls */}
              <div className={`flex p-1 rounded-2xl border text-[10px] uppercase font-bold tracking-wider transition-colors duration-300 ${
                isLightTheme ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <button
                  type="button"
                  onClick={() => setStatsBreakdownTab('7days')}
                  className={`flex-1 py-2 text-center rounded-xl transition-all cursor-pointer ${
                    statsBreakdownTab === '7days'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md'
                      : (isLightTheme ? 'text-slate-500 hover:text-slate-950' : 'text-slate-400 hover:text-white')
                  }`}
                >
                  Lucro (Últimos 7 dias)
                </button>
                <button
                  type="button"
                  onClick={() => setStatsBreakdownTab('today')}
                  className={`flex-1 py-2 text-center rounded-xl transition-all cursor-pointer ${
                    statsBreakdownTab === 'today'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md'
                      : (isLightTheme ? 'text-slate-500 hover:text-slate-950' : 'text-slate-400 hover:text-white')
                  }`}
                >
                  De Hoje ({completedAppointments.length})
                </button>
              </div>

              {/* TAB 1: 7 DAYS RETROSPECTIVE OVERVIEW */}
              {statsBreakdownTab === '7days' && (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                  {dailyStats.map((day) => {
                    const pct = (day.revenue / maxRevenue) * 100;
                    const isExpanded = expandedDay === day.date;
                    return (
                      <div 
                        key={day.date} 
                        onClick={() => setExpandedDay(isExpanded ? null : day.date)}
                        className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                          isLightTheme 
                            ? (isExpanded ? 'bg-slate-50 border-amber-500/55 shadow-sm' : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 hover:bg-slate-50')
                            : (isExpanded ? 'border-amber-500/40 bg-slate-950' : 'bg-slate-950/80 border-slate-850 hover:border-slate-800')
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className={`font-display font-bold text-xs leading-none block ${
                              isLightTheme ? 'text-slate-900 font-extrabold' : 'text-white'
                            }`}>{day.label}</span>
                            <span className={`text-[10px] mt-1 block ${
                              isLightTheme ? 'text-slate-500' : 'text-slate-500'
                            }`}>
                              {day.appointmentsCount} atendimento{day.appointmentsCount !== 1 ? 's' : ''} concluído{day.appointmentsCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <span className="font-mono text-xs font-black text-emerald-500 block">
                                R$ {day.revenue.toFixed(2)}
                              </span>
                            </div>
                            <LucideIcon 
                              name={isExpanded ? "ChevronUp" : "ChevronDown"} 
                              size={12} 
                              className="text-slate-500" 
                            />
                          </div>
                        </div>

                        {/* Sparkline Progress Indicator */}
                        <div className={`w-full h-1.5 rounded-full overflow-hidden mt-2.5 ${
                          isLightTheme ? 'bg-slate-250/50 bg-slate-200' : 'bg-slate-900'
                        }`}>
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${day.revenue > 0 ? Math.max(pct, 5) : 0}%` }}
                          />
                        </div>

                        {/* Day clients sub-list */}
                        {isExpanded && (
                          <div className={`mt-3 pt-2.5 border-t space-y-1.5 ${isLightTheme ? 'border-slate-200/70' : 'border-slate-900'}`} onClick={(e) => e.stopPropagation()}>
                            {day.appointments.length === 0 ? (
                              <p className={`text-[10px] py-1 text-center font-mono ${
                                isLightTheme ? 'text-slate-400' : 'text-slate-500'
                              }`}>Nenhum atendimento realizado neste dia.</p>
                            ) : (
                              day.appointments.map((apt) => {
                                const s = services.find((srv) => srv.id === apt.serviceId);
                                return (
                                  <div key={apt.id} className={`p-2.5 rounded-xl flex justify-between items-center text-[11px] border ${
                                    isLightTheme 
                                      ? 'bg-white border-slate-250/70 border-slate-200 text-slate-800 shadow-sm' 
                                      : 'bg-slate-900/60 border-slate-850/30 text-slate-200'
                                  }`}>
                                    <div className="min-w-0 pr-2">
                                      <span className={`font-bold block truncate ${
                                        isLightTheme ? 'text-slate-900' : 'text-slate-200'
                                      }`}>{apt.clientName}</span>
                                      <span className="text-[9px] text-amber-500/90 font-semibold block mt-0.5 truncate">
                                        {s ? s.name : 'Serviço'} • {apt.time}
                                      </span>
                                    </div>
                                    <span className="font-mono font-black text-emerald-500 shrink-0">
                                      R$ {s ? s.price.toFixed(2) : '0,00'}
                                    </span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: TODAY'S LIST (ORIGINAL VIEW) */}
              {statsBreakdownTab === 'today' && (
                <div>
                  {completedAppointments.length === 0 ? (
                    <div className={`border p-6 rounded-2xl text-center ${
                      isLightTheme ? 'bg-slate-50 border-slate-200/60' : 'bg-slate-950/40 border-slate-850'
                    }`}>
                      <LucideIcon name="Check" size={24} className="text-slate-600 mx-auto opacity-40 mb-1.5" />
                      <p className={`text-xs ${
                        isLightTheme ? 'text-slate-500' : 'text-slate-500'
                      }`}>Nenhum atendimento concluído hoje.</p>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {completedAppointments.map((apt) => {
                        const s = services.find((srv) => srv.id === apt.serviceId);
                        return (
                          <div key={apt.id} className={`p-3 rounded-2xl border flex justify-between items-center transition-colors ${
                            isLightTheme 
                              ? 'bg-slate-50 border-slate-200 hover:bg-slate-100/50 text-slate-800' 
                              : 'bg-slate-950/80 border-slate-850 hover:border-slate-800'
                          }`}>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className={`font-display font-bold text-xs leading-none ${
                                  isLightTheme ? 'text-slate-950 font-black' : 'text-white'
                                }`}>{apt.clientName}</span>
                                <span className="bg-emerald-500/10 text-emerald-500 font-mono text-[8.5px] uppercase font-bold px-1.5 py-0.5 rounded-md">
                                  Concluído
                                </span>
                              </div>
                              <div className={`text-[10px] mt-1 ${
                                isLightTheme ? 'text-slate-500' : 'text-slate-450 text-slate-400'
                              }`}>
                                <span className="font-semibold text-amber-500/90">{s ? s.name : 'Serviço'}</span>
                                <span className="mx-1.5 text-slate-400">•</span>
                                <span className="font-mono">{apt.date.split('-').reverse().join('/')} às {apt.time}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-mono text-xs font-black text-emerald-550 text-emerald-500 block">R$ {s ? s.price.toFixed(2) : '0,00'}</span>
                              <span className="font-mono text-[9px] text-slate-550 text-slate-500 lowercase block">{s ? s.duration : 30}min</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className={`border rounded-3xl p-5 space-y-3.5 shadow-lg transition-colors duration-300 ${
            isLightTheme ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800'
          }`}>
            <h3 className={`text-sm font-display font-bold uppercase tracking-wider flex items-center gap-2 pb-2.5 border-b ${
              isLightTheme ? 'text-slate-900 border-slate-200' : 'text-white border-slate-800'
            }`}>
              <LucideIcon name="Crown" size={14} className="text-amber-500" />
              Destaques de Atendimento
            </h3>
            
            <div className="flex justify-between items-center text-xs py-1">
              <span className={isLightTheme ? 'text-slate-500 font-medium' : 'text-slate-450 text-slate-400'}>Serviço Predileto:</span>
              <span className={`font-bold truncate max-w-[200px] ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>{popularServiceName}</span>
            </div>
            <div className="flex justify-between items-center text-xs py-1">
              <span className={isLightTheme ? 'text-slate-500 font-medium' : 'text-slate-450 text-slate-400'}>Tempo de Slot sugerido:</span>
              <span className={`font-bold font-mono ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>35 min / cliente</span>
            </div>
            <div className="flex justify-between items-center text-xs py-1">
              <span className={isLightTheme ? 'text-slate-500 font-medium' : 'text-slate-450 text-slate-400'}>Dia de Pico Estimado:</span>
              <span className="font-bold text-amber-500 uppercase tracking-wide">Sábado à Tarde</span>
            </div>
          </div>

          <div className={`p-4 border rounded-2xl text-center transition-colors duration-300 ${
            isLightTheme ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800/80 text-white'
          }`}>
            <p className={`text-[11px] leading-relaxed font-medium ${
              isLightTheme ? 'text-slate-600' : 'text-slate-400'
            }`}>
              💡 Deseja maximizar os lucros? Envie links de WhatsApp ou lance pequenos mimos na barbearia para preencher os slots vagos no meio de semana!
            </p>
          </div>
        </div>
      )}

      {adminTab === 'services' && (
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
                  isLightTheme ? 'bg-slate-50 border-slate-205 border-slate-200' : 'bg-slate-950 border-slate-808 border-slate-800/80'
                }`}>
                  {availableIcons.map((ico) => (
                    <button
                      key={ico}
                      type="button"
                      onClick={() => setNewServiceIcon(ico)}
                      className={`p-2 rounded-lg transition-all cursor-pointer ${
                        newServiceIcon === ico 
                          ? 'bg-amber-500 text-slate-950 font-bold' 
                          : `transition-colors ${isLightTheme ? 'text-slate-600 hover:text-slate-955 bg-white border border-slate-200 hover:bg-slate-50' : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800/60'}`
                      }`}
                    >
                      <LucideIcon name={ico} size={14} />
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                id="submit-new-service-btn"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 text-slate-955 text-slate-950 font-black rounded-xl text-xs hover:from-amber-400 hover:to-orange-400 transition-all cursor-pointer uppercase tracking-wider"
              >
                Salvar Serviço
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 gap-3">
            {services.map((srv) => (
              <div key={srv.id} id={`admin-service-card-${srv.id}`} className={`border p-4 rounded-3xl flex items-center justify-between gap-3 shadow-md transition-colors duration-300 ${
                isLightTheme ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800/80'
              }`}>
                <div className="flex gap-3.5 items-start min-w-0">
                  <div className={`p-2.5 border rounded-xl text-amber-500 mt-0.5 ${
                    isLightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-705'
                  }`}>
                    <LucideIcon name={srv.icon} size={16} />
                  </div>
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

                <button
                  type="button"
                  id={`delete-service-btn-${srv.id}`}
                  onClick={() => handleDeleteService(srv.id, srv.name)}
                  className={`p-3.5 rounded-2xl transition-colors cursor-pointer border border-transparent ${
                    isLightTheme ? 'hover:bg-red-50 text-red-500 hover:text-red-650 hover:border-red-200' : 'hover:bg-red-950/40 text-red-400 hover:text-red-300 hover:border-red-500/15'
                  }`}
                  title="Excluir Serviço"
                >
                  <LucideIcon name="Trash2" size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {adminTab === 'hours' && (
        <form onSubmit={handleSaveConfig} className={`border rounded-3xl p-5 space-y-5 shadow-xl transition-colors duration-300 ${
          isLightTheme ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800'
        }`} id="hours-view-content">
          <h3 className={`text-sm font-display font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            isLightTheme ? 'text-slate-900' : 'text-white'
          }`}>
            <LucideIcon name="Settings" size={14} className="text-amber-500" />
            Configuração de Funcionamento
          </h3>

          <div>
            <label className={`block text-[11px] font-semibold mb-1.5 ${
              isLightTheme ? 'text-slate-500' : 'text-slate-400'
            }`}>Nome da Barbearia</label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => onUpdateShopName && onUpdateShopName(e.target.value)}
              className={`w-full text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                isLightTheme ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white' : 'bg-slate-950 border-slate-800 text-white'
              }`}
              placeholder="Ex: Barbearia Premium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-[11px] font-semibold mb-1.5 ${
                isLightTheme ? 'text-slate-500' : 'text-slate-400'
              }`}>Início do Turno</label>
              <select
                value={startHour}
                onChange={(e) => setStartHour(e.target.value)}
                className={`w-full text-xs px-3.5 py-2.5 border rounded-xl font-mono focus:outline-none ${
                  isLightTheme ? 'bg-slate-50 border-slate-200 text-slate- 950 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              >
                <option value="06:00">06:00</option>
                <option value="07:00">07:00</option>
                <option value="08:00">08:00</option>
                <option value="09:00">09:00</option>
                <option value="10:00">10:00</option>
              </select>
            </div>
            <div>
              <label className={`block text-[11px] font-semibold mb-1.5 ${
                isLightTheme ? 'text-slate-500' : 'text-slate-400'
              }`}>Fim do Turno</label>
              <select
                value={endHour}
                onChange={(e) => setEndHour(e.target.value)}
                className={`w-full text-xs px-3.5 py-2.5 border rounded-xl font-mono focus:outline-none ${
                  isLightTheme ? 'bg-slate-50 border-slate-205 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              >
                <option value="17:00">17:00</option>
                <option value="18:00">18:00</option>
                <option value="19:00">19:00</option>
                <option value="20:00">20:00</option>
                <option value="21:00">21:00</option>
                <option value="22:00">22:00</option>
              </select>
            </div>
          </div>

          <div>
            <label className={`block text-[11px] font-semibold mb-1.5 ${
              isLightTheme ? 'text-slate-500' : 'text-slate-400'
            }`}>Intervalo entre Agendamentos</label>
            <select
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(e.target.value)}
              className={`w-full text-xs px-3 py-2.5 border rounded-xl font-mono focus:outline-none ${
                isLightTheme ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
              }`}
            >
              <option value="15">A cada 15 minutos</option>
              <option value="30">A cada 30 minutos (Padrão)</option>
              <option value="45">A cada 45 minutos</option>
              <option value="60">A cada 60 minutos</option>
            </select>
          </div>

          <div>
            <label className={`block text-[11px] font-semibold mb-2 ${
              isLightTheme ? 'text-slate-500' : 'text-slate-400'
            }`}>Dias Ativos para Atendimento</label>
            <div className="grid grid-cols-7 gap-1.5">
              {weekDayLabels.map((label, index) => {
                const isActive = selectedDays.includes(index);
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDayToggle(index)}
                    className={`py-2 px-1 text-center rounded-xl font-mono text-[10px] font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500/10 border border-amber-500/70 text-amber-500'
                        : (isLightTheme ? 'bg-slate-50 border border-slate-200 text-slate-400' : 'bg-slate-950 border border-slate-800/80 text-slate-500')
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            id="save-working-hours"
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black rounded-xl text-xs hover:from-amber-400 hover:to-orange-400 transition-all cursor-pointer uppercase tracking-wider"
          >
            Aplicar Alterações
          </button>
        </form>
      )}

      {adminTab === 'barbers' && !loggedBarberId && (
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
                        className="text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
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
                        }`}>Senha de Acesso <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
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
                            ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                            : 'bg-slate-950/40 hover:bg-slate-800 border-slate-800 text-slate-350 text-slate-300'
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
                      isLightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-750'
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
                            ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20' 
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
                        <span className="font-mono">{barber.password}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 border-t sm:border-t-0 pt-2.5 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleStartEditBarber(barber)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                        isLightTheme
                          ? 'hover:bg-slate-50 border-slate-200 text-slate-650 hover:text-slate-800'
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
                            ? 'hover:bg-amber-50 border-amber-250 text-amber-600 hover:text-amber-700'
                            : 'hover:bg-amber-950/40 border-amber-500/10 text-amber-500 hover:text-amber-300'
                          : isLightTheme
                          ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-250 text-emerald-600'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/10 text-emerald-400'
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
                          : 'hover:bg-red-950/30 border-red-500/10 text-red-400 hover:text-red-300'
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
      )}
    </div>
  );
}
