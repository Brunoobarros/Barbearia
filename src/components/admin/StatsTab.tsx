import React, { useState } from 'react';
import { Appointment, BarberService } from '../../types';
import LucideIcon from '../LucideIcon';

interface StatsTabProps {
  appointments: Appointment[];
  services: BarberService[];
  isLightTheme?: boolean;
}

export default function StatsTab({
  appointments,
  services,
  isLightTheme = false,
}: StatsTabProps) {
  const [showCompletedList, setShowCompletedList] = useState(false);
  const [statsBreakdownTab, setStatsBreakdownTab] = useState<'today' | '7days'>('7days');
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

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

  return (
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
            isLightTheme ? 'text-slate-500' : 'text-slate-550'
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
                  : (isLightTheme ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white')
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
                  : (isLightTheme ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white')
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
                      isLightTheme ? 'bg-slate-200' : 'bg-slate-900'
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
                                  ? 'bg-white border-slate-200 text-slate-800 shadow-sm' 
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
                            isLightTheme ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            <span className="font-semibold text-amber-500/90">{s ? s.name : 'Serviço'}</span>
                            <span className="mx-1.5 text-slate-400">•</span>
                            <span className="font-mono">{apt.date.split('-').reverse().join('/')} às {apt.time}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-xs font-black text-emerald-500 block">R$ {s ? s.price.toFixed(2) : '0,00'}</span>
                          <span className="font-mono text-[9px] text-slate-500 lowercase block">{s ? s.duration : 30}min</span>
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
          <span className={isLightTheme ? 'text-slate-500 font-medium' : 'text-slate-400'}>Serviço Predileto:</span>
          <span className={`font-bold truncate max-w-[200px] ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>{popularServiceName}</span>
        </div>
        <div className="flex justify-between items-center text-xs py-1">
          <span className={isLightTheme ? 'text-slate-500 font-medium' : 'text-slate-400'}>Tempo de Slot sugerido:</span>
          <span className={`font-bold font-mono ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>35 min / cliente</span>
        </div>
        <div className="flex justify-between items-center text-xs py-1">
          <span className={isLightTheme ? 'text-slate-500 font-medium' : 'text-slate-400'}>Dia de Pico Estimado:</span>
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
  );
}
