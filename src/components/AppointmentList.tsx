import React, { useState } from 'react';
import { Appointment, BarberService, Barber } from '../types';
import { formatPortugueseDate } from '../utils';
import LucideIcon from './LucideIcon';
import { motion, AnimatePresence } from 'motion/react';

interface AppointmentListProps {
  appointments: Appointment[];
  services: BarberService[];
  onRemoveAppointment: (id: string) => void;
  onCompleteAppointment?: (id: string) => void;
  showToast: (title: string, message: string, type: 'success' | 'alert' | 'info' | 'reminder') => void;
  isLightTheme?: boolean;
  isAdmin?: boolean;
  barbers?: Barber[];
  loggedBarberId?: string;
  shopName?: string;
}

const TODAY_STR = (() => {
  const now = new Date();
  const yStr = now.getFullYear();
  const mStr = (now.getMonth() + 1).toString().padStart(2, '0');
  const dStr = now.getDate().toString().padStart(2, '0');
  return `${yStr}-${mStr}-${dStr}`;
})(); // Dynamic today's date anchor

function getRelativeDateDetails(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const aptDateObj = new Date(Date.UTC(y, m - 1, d));
  
  const [ty, tm, td] = TODAY_STR.split('-').map(Number);
  const todayDateObj = new Date(Date.UTC(ty, tm - 1, td));
  
  const diffTime = aptDateObj.getTime() - todayDateObj.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  const weekdayNames = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado'
  ];
  
  const weekdayName = weekdayNames[aptDateObj.getUTCDay()];
  const formattedDate = dateStr.split('-').reverse().join('/'); // DD/MM/YYYY
  
  const isToday = diffDays === 0;
  
  if (isToday) {
    return {
      label: 'Hoje',
      isToday: true,
      text: `Hoje (${formattedDate.slice(0, 5)})`
    };
  }
  
  if (diffDays === 1) {
    return {
      label: 'Amanhã',
      isToday: false,
      text: `Amanhã (${weekdayName})`
    };
  }
  
  if (diffDays > 1 && diffDays <= 7) {
    return {
      label: weekdayName,
      isToday: false,
      text: `${weekdayName} (${formattedDate.slice(0, 5)})`
    };
  }
  
  if (diffDays < 0 && diffDays >= -7) {
    return {
      label: weekdayName,
      isToday: false,
      text: `${weekdayName} (${formattedDate.slice(0, 5)})`
    };
  }
  
  return {
    label: formattedDate,
    isToday: false,
    text: formattedDate
  };
}

export default function AppointmentList({
  appointments,
  services,
  onRemoveAppointment,
  onCompleteAppointment,
  showToast,
  isLightTheme = false,
  isAdmin = false,
  barbers = [],
  loggedBarberId,
  shopName = 'Barbearia Premium',
}: AppointmentListProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'upcoming'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filter appointments that either match the logged-in barber's ID or do not belong to another active barber
  const barberAppointments = appointments.filter((apt) => {
    if (loggedBarberId) {
      const belongsToOtherActiveBarber = barbers.some(
        (b) => b.active && b.id !== loggedBarberId && apt.barberId === b.id
      );
      return apt.barberId === loggedBarberId || !belongsToOtherActiveBarber;
    }
    return true;
  });

  // Filter list
  const filteredAppointments = barberAppointments.filter((apt) => {
    // 1. Text Search
    const matchesSearch =
      apt.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.clientPhone.includes(searchTerm);

    // 2. Date Filter
    let matchesDate = true;
    if (dateFilter === 'today') {
      matchesDate = apt.date === TODAY_STR;
    } else if (dateFilter === 'upcoming') {
      matchesDate = apt.date >= TODAY_STR;
    }

    return matchesSearch && matchesDate && apt.status !== 'canceled' && apt.status !== 'completed';
  });

  // Sort by date and then by time
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return a.time.localeCompare(b.time);
  });

  const handleDeleteClick = (id: string, clientName: string) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = (id: string, name: string) => {
    onRemoveAppointment(id);
    setConfirmDeleteId(null);
    showToast('Agendamento Removido', `O horário de ${name} foi desmarcado com sucesso.`, 'info');
  };

  const triggerMockReminder = (apt: Appointment) => {
    const service = services.find((s) => s.id === apt.serviceId);
    const serviceName = service ? service.name : 'Serviço';
    const dateDetails = getRelativeDateDetails(apt.date);
    const dateLabel = dateDetails.isToday ? 'Hoje' : dateDetails.text;

    const message = `Olá, ${apt.clientName}! Passando para lembrar do seu agendamento de *${serviceName}* na ${shopName}. 💈✂️\n\n📅 *Data:* ${dateLabel}\n⏰ *Horário:* às ${apt.time}\n\nEstamos te aguardando! Caso precise reagendar ou cancelar, por favor nos avise com antecedência.`;

    // Strip non-digits from phone number
    let cleanPhone = apt.clientPhone.replace(/\D/g, '');

    // Add Brazilian country code (55) if it looks like a national number (10 or 11 digits) and doesn't already start with 55
    if (cleanPhone.length > 0 && !cleanPhone.startsWith('55') && (cleanPhone.length === 10 || cleanPhone.length === 11)) {
      cleanPhone = '55' + cleanPhone;
    }

    if (cleanPhone) {
      const waUrl = `https://wa.me/${cleanPhone}/?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      showToast(
        'WhatsApp Enviado',
        `Abrindo o WhatsApp para lembrar ${apt.clientName} do horário às ${apt.time}.`,
        'success'
      );
    } else {
      showToast(
        'Sem Telefone',
        `Não foi possível enviar pois ${apt.clientName} não informou um telefone com WhatsApp.`,
        'alert'
      );
    }
  };

  return (
    <div className="space-y-3">
      {/* Search & Tabs Controls */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-3.5 shadow-xl space-y-3">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <LucideIcon name="Search" size={13} />
          </div>
          <input
            type="text"
            placeholder="Buscar por cliente ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs transition-all animate-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white cursor-pointer"
            >
              <LucideIcon name="X" size={13} />
            </button>
          )}
        </div>

        {/* Date Filter Tabs Buttons */}
        <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setDateFilter('all')}
            className={`flex-1 py-1.5 text-center rounded-lg font-bold uppercase tracking-wider text-[9px] transition-all cursor-pointer ${
              dateFilter === 'all'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({barberAppointments.filter((a) => a.status !== 'canceled' && a.status !== 'completed').length})
          </button>
          <button
            onClick={() => setDateFilter('today')}
            className={`flex-1 py-1.5 text-center rounded-lg font-bold uppercase tracking-wider text-[9px] transition-all cursor-pointer ${
              dateFilter === 'today'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hoje ({barberAppointments.filter((a) => a.date === TODAY_STR && a.status !== 'canceled' && a.status !== 'completed').length})
          </button>
          <button
            onClick={() => setDateFilter('upcoming')}
            className={`flex-1 py-1.5 text-center rounded-lg font-bold uppercase tracking-wider text-[9px] transition-all cursor-pointer ${
              dateFilter === 'upcoming'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Futuros ({barberAppointments.filter((a) => a.date >= TODAY_STR && a.status !== 'canceled' && a.status !== 'completed').length})
          </button>
        </div>
      </div>

      {/* Appointment Listings */}
      <div className="space-y-2.5">
        {sortedAppointments.length === 0 ? (
          <div className="text-center py-8 px-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
            <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-amber-500/85 mx-auto mb-2.5 border border-slate-800">
              <LucideIcon name="Calendar" size={16} />
            </div>
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-slate-300">Nenhum agendamento ativo</h3>
            <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs mx-auto">
              Nenhum cliente agendado atende aos filtros de busca aplicados atualmente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {sortedAppointments.map((apt) => {
              const service = services.find((s) => s.id === apt.serviceId);
              const barber = barbers.find((b) => b.id === apt.barberId);
              const isToday = apt.date === TODAY_STR;
              const isConfirmingDelete = confirmDeleteId === apt.id;
              const dateDetails = getRelativeDateDetails(apt.date);

              return (
                <div
                  key={apt.id}
                  id={`appointment-card-${apt.id}`}
                  className="bg-slate-905 bg-slate-900 border border-slate-805 transition-all rounded-2xl p-3.5 relative shadow-md hover:scale-[1.005] duration-200"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      {/* Time and date ribbon */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {dateDetails.isToday ? (
                          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-mono font-black text-[9px] px-2 py-0.5 rounded-md border border-amber-400 tracking-wider uppercase animate-pulse">
                            <LucideIcon name="Calendar" size={10} className="text-slate-950 font-black animate-none" />
                            Hoje
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] text-slate-200 font-bold uppercase bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 font-mono">
                            <LucideIcon name="Calendar" size={10} className="text-slate-450" />
                            {dateDetails.text}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 font-mono font-black text-xs px-2 py-0.5 rounded-md border border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.25)]">
                          <LucideIcon name="Clock" size={11} className="text-slate-950 stroke-[2.5]" />
                          {apt.time}
                        </span>
                        {barber && (
                          <span className="inline-flex items-center gap-1 bg-slate-950 text-slate-300 font-mono font-bold text-[9px] px-2 py-0.5 rounded-md border border-slate-800 uppercase tracking-wider">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              barber.color === 'emerald' ? 'bg-emerald-500' : barber.color === 'indigo' ? 'bg-indigo-500' : 'bg-amber-500'
                            }`} />
                            {barber.name.split(' ')[0]}
                          </span>
                        )}
                      </div>

                      {/* Header details */}
                      <div className="flex items-center gap-1.5 my-1">
                        <div className="w-1 h-3.5 bg-amber-500 rounded-full shrink-0"></div>
                        <span className={`font-display font-black text-sm leading-tight truncate ${
                          isLightTheme ? 'text-slate-905' : 'text-white'
                        }`}>
                          {apt.clientName}
                        </span>
                      </div>

                      {/* Service info */}
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-500 py-0.5 italic font-medium flex-wrap">
                        <span className="font-bold text-amber-400">{service ? service.name : 'Serviço'}</span>
                        <span className="text-slate-700 not-italic">•</span>
                        <span className="font-mono text-slate-300 font-bold">R$ {service ? service.price.toFixed(2) : '0,00'}</span>
                        <span className="text-slate-700 not-italic">•</span>
                        <span className="text-slate-500 font-mono lowercase">{service ? service.duration : 30}min</span>
                      </div>
                    </div>

                    {/* Action status tag */}
                    <div className="flex flex-col gap-1 items-end shrink-0">
                      <span className="bg-emerald-500/10 text-emerald-450 text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/15">
                        Confirmado
                      </span>
                    </div>
                  </div>

                    {/* Confirm Delete state or General controls - Only visible to admin / logged-in barber */}
                    {(isAdmin || loggedBarberId) && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/40 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => triggerMockReminder(apt)}
                            className="cursor-pointer text-[9px] uppercase tracking-wider text-slate-450 hover:text-amber-450 transition-colors flex items-center gap-1 font-bold"
                          >
                            <LucideIcon name="Bell" size={11} className="text-amber-500/50" />
                            Lembrar
                          </button>

                          {onCompleteAppointment && (
                            <button
                              onClick={() => onCompleteAppointment(apt.id)}
                              className="cursor-pointer text-[9px] uppercase tracking-wider text-emerald-450 hover:text-emerald-400 transition-colors flex items-center gap-1 font-bold"
                            >
                              <LucideIcon name="CheckCircle2" size={11} className="text-emerald-500/80" />
                              Concluir
                            </button>
                          )}
                        </div>

                        <AnimatePresence mode="wait">
                          {!isConfirmingDelete ? (
                            <button
                              onClick={() => handleDeleteClick(apt.id, apt.clientName)}
                              className="cursor-pointer text-[9px] uppercase tracking-wider text-red-400 hover:text-red-350 font-bold transition-colors flex items-center gap-1"
                              id={`cancel-btn-${apt.id}`}
                            >
                              <LucideIcon name="Trash2" size={10} />
                              Desmarcar Horário
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                              <span className="text-[8px] uppercase tracking-wider text-red-400 font-bold px-1">Confirma?</span>
                              <button
                                onClick={() => handleConfirmDelete(apt.id, apt.clientName)}
                                id={`confirm-cancel-btn-${apt.id}`}
                                className="bg-red-650 hover:bg-red-500 text-white font-mono font-bold text-[9px] px-2 py-0.5 rounded cursor-pointer animate-none"
                              >
                                Sim
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[9px] px-2 py-0.5 rounded cursor-pointer"
                              >
                                Não
                              </button>
                            </div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
