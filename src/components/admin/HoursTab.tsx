import React, { useState, useEffect } from 'react';
import { WorkingConfig, Barber, BlockedSlot } from '../../types';
import LucideIcon from '../LucideIcon';

interface HoursTabProps {
  workingConfig: WorkingConfig;
  onUpdateConfig: (updated: WorkingConfig) => void;
  shopName?: string;
  onUpdateShopName?: (name: string) => void;
  showToast: (title: string, message: string, type: 'success' | 'alert' | 'info' | 'reminder') => void;
  isLightTheme?: boolean;
  barbers?: Barber[];
  loggedBarberId?: string;
  blockedSlots: BlockedSlot[];
  onUpdateBlockedSlots: (updated: BlockedSlot[]) => void;
}

export default function HoursTab({
  workingConfig,
  onUpdateConfig,
  shopName = 'Barbearia Premium',
  onUpdateShopName,
  showToast,
  isLightTheme = false,
  barbers = [],
  loggedBarberId,
  blockedSlots = [],
  onUpdateBlockedSlots,
}: HoursTabProps) {
  // --- WORKING CONFIG LOCAL STATE ---
  const [startHour, setStartHour] = useState(workingConfig.startHour);
  const [endHour, setEndHour] = useState(workingConfig.endHour);
  const [intervalMinutes, setIntervalMinutes] = useState(workingConfig.intervalMinutes.toString());
  const [selectedDays, setSelectedDays] = useState<number[]>(workingConfig.workingDays);

  useEffect(() => {
    setStartHour(workingConfig.startHour);
    setEndHour(workingConfig.endHour);
    setIntervalMinutes(workingConfig.intervalMinutes.toString());
    setSelectedDays(workingConfig.workingDays);
  }, [workingConfig]);

  // --- HOUR BLOCKING FORM LOCAL STATE ---
  const [blockBarberId, setBlockBarberId] = useState(loggedBarberId || (barbers && barbers[0]?.id) || '');
  const [blockDate, setBlockDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = (today.getMonth() + 1).toString().padStart(2, '0');
    const d = today.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  // Calculate times based on startHour/endHour/interval
  const timeOptions = React.useMemo(() => {
    const timeToMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };
    const minutesToTime = (m: number) => {
      const h = Math.floor(m / 60);
      const min = m % 60;
      return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    };

    const startMin = timeToMinutes(workingConfig.startHour);
    const endMin = timeToMinutes(workingConfig.endHour);
    const options: string[] = [];
    for (let min = startMin; min < endMin; min += workingConfig.intervalMinutes) {
      options.push(minutesToTime(min));
    }
    return options;
  }, [workingConfig.startHour, workingConfig.endHour, workingConfig.intervalMinutes]);

  const [blockTime, setBlockTime] = useState(timeOptions[0] || '09:00');

  useEffect(() => {
    if (timeOptions.length > 0 && !timeOptions.includes(blockTime)) {
      setBlockTime(timeOptions[0]);
    }
  }, [timeOptions, blockTime]);

  useEffect(() => {
    if (loggedBarberId) {
      setBlockBarberId(loggedBarberId);
    } else if (barbers && barbers.length > 0 && !blockBarberId) {
      setBlockBarberId(barbers[0].id);
    }
  }, [loggedBarberId, barbers, blockBarberId]);

  const handleAddBlockSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockBarberId || !blockDate || !blockTime) {
      showToast('Dados Incompletos', 'Selecione barbeiro, data e horário para o bloqueio.', 'alert');
      return;
    }

    // Check if block already exists
    const exists = blockedSlots.some(
      (slot) => slot.date === blockDate && slot.time === blockTime && slot.barberId === blockBarberId
    );

    if (exists) {
      showToast('Bloqueio Já Existe', 'Este horário já está bloqueado para o profissional selecionado.', 'alert');
      return;
    }

    const newBlock: BlockedSlot = {
      id: 'bs-' + Date.now(),
      date: blockDate,
      time: blockTime,
      barberId: blockBarberId,
    };

    onUpdateBlockedSlots([...blockedSlots, newBlock]);
    showToast('Horário Bloqueado', 'O horário foi bloqueado para novos agendamentos.', 'success');
  };

  const handleRemoveBlockSlot = (id: string) => {
    const updated = blockedSlots.filter((slot) => slot.id !== id);
    onUpdateBlockedSlots(updated);
    showToast('Horário Liberado', 'O bloqueio foi removido com sucesso.', 'info');
  };

  const weekDayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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

  return (
    <div className="space-y-4">
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
                isLightTheme ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
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
                isLightTheme ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
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
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-955 text-slate-950 font-black rounded-xl text-xs hover:from-amber-400 hover:to-orange-400 transition-all cursor-pointer uppercase tracking-wider"
        >
          Aplicar Alterações
        </button>
      </form>

      {/* Block Hours Section */}
      <div className={`border rounded-3xl p-5 space-y-5 shadow-xl transition-colors duration-300 ${
        isLightTheme ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800'
      }`}>
        <h3 className={`text-sm font-display font-bold uppercase tracking-wider flex items-center gap-1.5 ${
          isLightTheme ? 'text-slate-900' : 'text-white'
        }`}>
          <LucideIcon name="CalendarOff" size={14} className="text-amber-500" />
          Bloqueio de Horários por Imprevistos
        </h3>

        <form onSubmit={handleAddBlockSlot} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Barber Selector */}
            <div>
              <label className={`block text-[11px] font-semibold mb-1.5 ${
                isLightTheme ? 'text-slate-500' : 'text-slate-400'
              }`}>Barbeiro</label>
              {loggedBarberId ? (
                <div className={`w-full text-xs px-3.5 py-2.5 border rounded-xl font-medium ${
                  isLightTheme ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}>
                  {barbers?.find(b => b.id === loggedBarberId)?.name || 'Meu Perfil'}
                </div>
              ) : (
                <select
                  value={blockBarberId}
                  onChange={(e) => setBlockBarberId(e.target.value)}
                  className={`w-full text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none ${
                    isLightTheme ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                >
                  <option value="">Selecione...</option>
                  {barbers?.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Date Selector */}
            <div>
              <label className={`block text-[11px] font-semibold mb-1.5 ${
                isLightTheme ? 'text-slate-500' : 'text-slate-400'
              }`}>Data</label>
              <input
                type="date"
                required
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
                className={`w-full text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                  isLightTheme ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              />
            </div>

            {/* Time Selector */}
            <div>
              <label className={`block text-[11px] font-semibold mb-1.5 ${
                isLightTheme ? 'text-slate-500' : 'text-slate-400'
              }`}>Horário</label>
              <select
                value={blockTime}
                onChange={(e) => setBlockTime(e.target.value)}
                className={`w-full text-xs px-3.5 py-2.5 border rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                  isLightTheme ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-red-500 to-orange-600 text-slate-955 text-slate-950 font-black rounded-xl text-[10px] hover:from-red-400 hover:to-orange-500 transition-all cursor-pointer uppercase tracking-wider"
          >
            Bloquear Horário Selecionado
          </button>
        </form>

        {/* List of blocked slots */}
        <div className="pt-4 border-t border-dashed border-slate-800/40">
          <h4 className={`text-xs font-bold mb-3 uppercase tracking-wider ${
            isLightTheme ? 'text-slate-850 text-slate-800' : 'text-slate-300'
          }`}>Horários Bloqueados</h4>

          {blockedSlots.filter(s => !loggedBarberId || s.barberId === loggedBarberId).length === 0 ? (
            <p className={`text-[11px] italic ${
              isLightTheme ? 'text-slate-400' : 'text-slate-500'
            }`}>Nenhum horário bloqueado no momento.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {blockedSlots
                .filter(s => !loggedBarberId || s.barberId === loggedBarberId)
                .map((slot) => {
                  const barberName = barbers?.find((b) => b.id === slot.barberId)?.name || 'Profissional';
                  const dateParts = slot.date.split('-');
                  const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : slot.date;

                  return (
                    <div
                      key={slot.id}
                      className={`flex justify-between items-center px-4 py-2.5 border rounded-xl shadow-sm text-xs font-mono font-bold ${
                        isLightTheme ? 'bg-slate-50 border-slate-200/60 text-slate-700' : 'bg-slate-950 border-slate-800/60 text-slate-350'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-red-400">●</span>
                        <span>{barberName}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-amber-500">{formattedDate} às {slot.time}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveBlockSlot(slot.id)}
                        className={`p-1.5 rounded-lg border border-transparent transition-colors cursor-pointer ${
                          isLightTheme ? 'hover:bg-red-50 text-red-500 hover:text-red-700' : 'hover:bg-red-950/40 text-red-400 hover:text-red-300'
                        }`}
                        title="Liberar Horário"
                      >
                        <LucideIcon name="Trash2" size={13} />
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
