import React, { useState, useEffect } from 'react';
import { WorkingConfig } from '../../types';
import LucideIcon from '../LucideIcon';

interface HoursTabProps {
  workingConfig: WorkingConfig;
  onUpdateConfig: (updated: WorkingConfig) => void;
  shopName?: string;
  onUpdateShopName?: (name: string) => void;
  showToast: (title: string, message: string, type: 'success' | 'alert' | 'info' | 'reminder') => void;
  isLightTheme?: boolean;
}

export default function HoursTab({
  workingConfig,
  onUpdateConfig,
  shopName = 'Barbearia Premium',
  onUpdateShopName,
  showToast,
  isLightTheme = false,
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
        className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black rounded-xl text-xs hover:from-amber-400 hover:to-orange-400 transition-all cursor-pointer uppercase tracking-wider"
      >
        Aplicar Alterações
      </button>
    </form>
  );
}
