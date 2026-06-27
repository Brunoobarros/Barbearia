import React, { useState, useEffect } from 'react';
import { BarberService, Appointment, WorkingConfig, Barber, BlockedSlot } from '../types';
import { getAvailableSlots, getNextSevenDays, formatPortugueseDate } from '../utils';
import LucideIcon from './LucideIcon';
import { motion, AnimatePresence } from 'motion/react';

interface AppointmentFormProps {
  services: BarberService[];
  workingConfig: WorkingConfig;
  appointments: Appointment[];
  onAddAppointment: (apt: {
    clientName: string;
    clientPhone: string;
    date: string;
    time: string;
    serviceId: string;
    notes: string;
    barberId?: string;
  }) => Promise<boolean>;
  activeDate: string;
  setActiveDate: (date: string) => void;
  showToast: (title: string, message: string, type: 'success' | 'alert' | 'info' | 'reminder') => void;
  isLightTheme?: boolean;
  barbers: Barber[];
  blockedSlots?: BlockedSlot[];
}

export default function AppointmentForm({
  services,
  workingConfig,
  appointments,
  onAddAppointment,
  activeDate,
  setActiveDate,
  showToast,
  isLightTheme = false,
  barbers = [],
  blockedSlots = []
}: AppointmentFormProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || '');
  const [selectedBarberId, setSelectedBarberId] = useState<string>('any');
  const [selectedTime, setSelectedTime] = useState<string>('');

  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Steps: 1 = Service, 2 = Date & Time, 3 = Confirmation Info
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Generate date options starting from the actual current date (today) to ensure we always show 7 days starting from today!
  const dateOptions = React.useMemo(() => {
    return getNextSevenDays((() => {
      const now = new Date();
      const yStr = now.getFullYear();
      const mStr = (now.getMonth() + 1).toString().padStart(2, '0');
      const dStr = now.getDate().toString().padStart(2, '0');
      return `${yStr}-${mStr}-${dStr}`;
    })());
  }, []);

  const activeService = services.find(s => s.id === selectedServiceId);
  const slots = getAvailableSlots(activeDate, workingConfig, appointments, services, selectedBarberId, barbers, blockedSlots);

  // Auto pre-select the first available slot when date, service, or appointments change
  useEffect(() => {
    const availableSlots = getAvailableSlots(activeDate, workingConfig, appointments, services, selectedBarberId, barbers, blockedSlots);
    const firstSlot = availableSlots.find((s) => s.available);
    setSelectedTime(firstSlot ? firstSlot.time : '');
  }, [activeDate, selectedServiceId, selectedBarberId, appointments, workingConfig, services, barbers, blockedSlots]);

  // Se o dia atualmente selecionado não tiver horários disponíveis, seleciona automaticamente o próximo dia que tiver vaga
  useEffect(() => {
    if (currentStep !== 2) return;

    const currentSlots = getAvailableSlots(activeDate, workingConfig, appointments, services, selectedBarberId, barbers, blockedSlots);
    const hasAvailable = currentSlots.some((s) => s.available);

    if (!hasAvailable) {
      const currentIndex = dateOptions.indexOf(activeDate);
      if (currentIndex !== -1) {
        // Tenta os dias seguintes primeiro
        for (let i = currentIndex + 1; i < dateOptions.length; i++) {
          const nextDay = dateOptions[i];
          const nextSlots = getAvailableSlots(nextDay, workingConfig, appointments, services, selectedBarberId, barbers, blockedSlots);
          if (nextSlots.some((s) => s.available)) {
            setActiveDate(nextDay);
            return;
          }
        }
        // Se nenhum dia posterior tiver, tenta os dias anteriores a partir do início do período de 7 dias
        for (let i = 0; i < currentIndex; i++) {
          const prevDay = dateOptions[i];
          const prevSlots = getAvailableSlots(prevDay, workingConfig, appointments, services, selectedBarberId, barbers, blockedSlots);
          if (prevSlots.some((s) => s.available)) {
            setActiveDate(prevDay);
            return;
          }
        }
      }
    }
  }, [activeDate, currentStep, selectedServiceId, selectedBarberId, appointments, workingConfig, services, barbers, dateOptions, setActiveDate, blockedSlots]);

  // Auto scroll selected or pre-selected time slot into view when step 2 displays or selected time changes
  useEffect(() => {
    if (currentStep === 2 && selectedTime) {
      const timer = setTimeout(() => {
        const containerEl = document.getElementById('time-slots-container');
        const slotEl = document.getElementById(`time-slot-${selectedTime}`);
        if (containerEl && slotEl) {
          const containerRect = containerEl.getBoundingClientRect();
          const slotRect = slotEl.getBoundingClientRect();
          const relativeTop = slotRect.top - containerRect.top + containerEl.scrollTop;
          
          // Position the selected slot at the top of the container (with 8px offset for padding)
          const targetScrollTop = Math.max(0, relativeTop - 8);
          
          containerEl.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
          });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedTime, currentStep, activeDate]);

  // Rolar para o topo ao mudar de passo (Passos 1, 2 e 3)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Handle phone mask (e.g. (XX) XXXXX-XXXX)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 6) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }
    setClientPhone(value);
  };

  const handleNextStep = () => {
    if (currentStep === 1 && selectedServiceId) {
      const now = new Date();
      const yStr = now.getFullYear();
      const mStr = (now.getMonth() + 1).toString().padStart(2, '0');
      const dStr = now.getDate().toString().padStart(2, '0');
      setActiveDate(`${yStr}-${mStr}-${dStr}`);
      setCurrentStep(2);
    } else if (currentStep === 2 && selectedTime) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !selectedTime) {
      showToast('Erro no Formulário', 'Por favor, preencha o nome do cliente.', 'alert');
      return;
    }

    const cleanPhone = clientPhone.replace(/\D/g, '');
    if (cleanPhone.length > 0 && cleanPhone.length !== 10 && cleanPhone.length !== 11) {
      showToast(
        'Nº de Celular Inválido',
        'O telefone deve conter o DDD com 10 ou 11 dígitos. Ex: (11) 99999-9999',
        'alert'
      );
      return;
    }

    const chosenSlot = slots.find(s => s.time === selectedTime);
    const assignedBarberId = selectedBarberId === 'any'
      ? (chosenSlot?.suggestedBarberId || barbers[0]?.id || 'b1')
      : selectedBarberId;

    const success = await onAddAppointment({
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      date: activeDate,
      time: selectedTime,
      serviceId: selectedServiceId,
      notes: notes.trim(),
      barberId: assignedBarberId,
    });

    if (success) {
      // Reset Form
      setClientName('');
      setClientPhone('');
      setNotes('');
      setSelectedTime('');
      setCurrentStep(1);
    }
  };



  return (
    <div className="bg-slate-900 border border-slate-850 rounded-3xl p-5 sm:p-7 shadow-2xl max-w-lg mx-auto">
      {/* Header Stepper Indicator */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
        <h2 className="text-[15px] leading-[20px] font-display font-black text-white uppercase tracking-tight flex items-center gap-2" id="appointment-heading">
          Agendamento
        </h2>
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
          <span className={`px-2.5 py-1 rounded-lg font-bold ${currentStep === 1 ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 border border-slate-800/60'}`}>1</span>
          <span className="text-slate-600">➔</span>
          <span className={`px-2.5 py-1 rounded-lg font-bold ${currentStep === 2 ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 border border-slate-800/60'}`}>2</span>
          <span className="text-slate-600">➔</span>
          <span className={`px-2.5 py-1 rounded-lg font-bold ${currentStep === 3 ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 border border-slate-800/60'}`}>3</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: SERVICE CHOICE */}
        {currentStep === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2 font-bold">
              Passo 1: Selecione o Serviço
            </div>
               <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {services.map((service) => (
                <div
                  key={service.id}
                  id={`service-select-${service.id}`}
                  onClick={() => setSelectedServiceId(service.id)}
                  className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 items-start leading-[0px] ${
                    selectedServiceId === service.id
                      ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.06)] ' + (isLightTheme ? 'text-slate-900 border-2 font-bold' : 'text-white')
                      : isLightTheme
                      ? 'border-slate-250 hover:border-amber-500 bg-white text-slate-700 shadow-sm'
                      : 'border-slate-800/80 hover:border-slate-700/80 bg-slate-950/20 text-slate-300'
                  }`}
                >
                  {service.image ? (
                    <div className="w-[80px] h-[80px] rounded-2xl shrink-0 overflow-hidden border border-slate-800/40 self-center">
                      <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className={`p-2.5 rounded-2xl shrink-0 w-[80px] h-[80px] flex items-center justify-center self-center ${
                      selectedServiceId === service.id ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-slate-850 text-amber-500'
                    }`}>
                      <LucideIcon name={service.icon} size={32} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className={`font-display font-medium text-base truncate pr-6 ${isLightTheme ? 'text-slate-900 font-bold' : 'text-white'}`}>
                        {service.name}
                      </h4>
                    </div>
                    <p className={`text-xs leading-relaxed mb-2 line-clamp-2 ${isLightTheme ? 'text-slate-650' : 'text-slate-400'}`}>
                      {service.description}
                    </p>
                    <div className="flex items-center gap-2.5 text-[10px] font-mono uppercase font-bold">
                      <div className="flex items-center gap-1 text-slate-500">
                        <LucideIcon name="Clock" size={12} className="text-slate-500" />
                        <span>{service.duration} MINUTOS</span>
                      </div>
                      <span className="text-slate-600 font-normal text-xs">•</span>
                      <span className="text-amber-500 font-mono text-sm font-black">
                        R$ {service.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {selectedServiceId === service.id && (
                    <div className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-slate-950">
                      <LucideIcon name="Check" size={11} className="stroke-[3]" />
                    </div>
                  )}
                </div>
              ))}
            </div>



            <button
              type="button"
              id="next-step-button"
              disabled={!selectedServiceId}
              onClick={handleNextStep}
              className="w-full mt-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-display font-black uppercase tracking-wider py-4 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer text-sm shadow-lg shadow-amber-500/10"
            >
              Próximo Passo
              <LucideIcon name="ChevronRight" size={16} className="stroke-[2.5]" />
            </button>
          </motion.div>
        )}

        {/* STEP 2: DATE & TIME CHIP SELECTION */}
        {currentStep === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-3 font-bold">
                Passo 2: Escolha a Data
              </div>
              
              {/* Horizontal scroll dates ribbon */}
              <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-none snap-x select-none">
                {dateOptions.map((dateStr) => {
                  const [y, m, d] = dateStr.split('-').map(Number);
                  const dateObj = new Date(y, m - 1, d);
                  const active = dateStr === activeDate;
                  const weekdayShort = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).substring(0, 3).toUpperCase();

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      id={`date-button-${dateStr}`}
                      onClick={() => {
                        setActiveDate(dateStr);
                      }}
                      className={`flex flex-col items-center justify-center py-3 px-4 rounded-2xl border snap-start min-w-[76px] shrink-0 transition-all cursor-pointer ${
                        active
                          ? isLightTheme
                            ? 'border-amber-500 bg-amber-500/20 text-slate-950 font-extrabold shadow-[0_2px_8px_rgba(245,158,11,0.15)] border-2'
                            : 'border-amber-500 bg-amber-500/15 text-white font-extrabold shadow-[0_0_12px_rgba(245,158,11,0.08)]'
                          : isLightTheme
                          ? 'border-slate-200 bg-white text-slate-700 hover:border-slate-350 hover:text-slate-900 shadow-sm'
                          : 'border-slate-800 bg-slate-950/30 text-slate-400 hover:border-slate-700/80 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-[10px] font-mono tracking-widest uppercase font-bold">{weekdayShort}</span>
                      <span className="text-xl font-display font-black mt-1">{d}</span>
                      <span className="text-[9px] text-slate-500 font-mono mt-0.5 uppercase font-bold">{dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()}</span>
                    </button>
                  );
                })}
              </div>


            </div>

            <div className="pt-2">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-3 flex flex-wrap gap-2 items-center justify-between font-bold">
                <div className="flex items-center gap-2">
                  <span>Horários Disponíveis</span>
                  {selectedTime && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[9px] font-bold tracking-normal uppercase flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></span>
                      {selectedTime} selecionado
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-amber-500/80 tracking-widest uppercase font-bold">Duração: {activeService?.duration}min</span>
              </div>
              
              {slots.length === 0 ? (
                <div className={`text-center py-6 px-4 rounded-2xl border text-xs ${isLightTheme ? 'bg-slate-50 border-slate-200 text-slate-550' : 'bg-slate-955 border-slate-800 text-slate-500'}`}>
                  Sem horários de atendimento liberados para {formatPortugueseDate(activeDate)}.
                </div>
              ) : (
                <div id="time-slots-container" className="grid grid-cols-4 max-[370px]:grid-cols-3 gap-2 max-h-[190px] sm:max-h-[290px] overflow-y-auto pr-1 scroll-smooth">
                  {slots.map((slot) => {
                    const isSelected = selectedTime === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        id={`time-slot-${slot.time}`}
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`py-2 text-center rounded-xl font-mono text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md shadow-amber-500/20 scale-[1.02]'
                            : slot.available
                            ? isLightTheme
                              ? 'bg-white border border-slate-200 hover:border-amber-500 text-slate-900 font-bold hover:text-amber-600 shadow-sm font-semibold'
                              : 'bg-slate-800 border border-slate-700/60 hover:border-amber-500 text-slate-200 hover:text-white font-semibold'
                            : isLightTheme
                            ? 'bg-slate-100 border border-slate-150 text-slate-350 line-through cursor-not-allowed opacity-40'
                            : 'bg-slate-950 border border-slate-950 text-slate-650 line-through cursor-not-allowed opacity-30'
                        }`}
                        title={slot.reason || 'Livre para agendamento'}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handlePrevStep}
                className="w-1/3 border border-slate-800 hover:border-slate-700 bg-slate-950/20 text-slate-400 font-display font-medium py-3.5 px-4 rounded-2xl transition-all cursor-pointer text-sm"
              >
                Voltar
              </button>
              <button
                type="button"
                id="next-confirm-step"
                disabled={!selectedTime}
                onClick={handleNextStep}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-display font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer text-sm shadow-md uppercase tracking-wider"
              >
                Continuar
                <LucideIcon name="ChevronRight" size={15} />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: CLIENT DEMOGRAPHIC INFO */}
        {currentStep === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2 font-bold">
                Passo 3: Dados de Contato e Resumo
              </div>

              {/* Booking Recap card */}
              <div className={`p-4 border rounded-2xl space-y-2 text-xs ${isLightTheme ? 'bg-slate-50/80 border-slate-205 text-slate-700' : 'bg-slate-950/50 border-slate-800/80'}`}>
                <div className={`flex justify-between pb-1.5 border-b text-slate-400 ${isLightTheme ? 'border-slate-200' : 'border-slate-800/60'}`}>
                  <span>Opção Selecionada:</span>
                  <span className={`font-bold ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>{activeService?.name}</span>
                </div>
                <div className={`flex justify-between pb-1.5 border-b text-slate-400 ${isLightTheme ? 'border-slate-200' : 'border-slate-800/60'}`}>
                  <span>Profissional:</span>
                  <span className={`font-bold ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>
                    {barbers.find(b => b.id === (slots.find(s => s.time === selectedTime)?.suggestedBarberId))?.name || 'Distribuição Automática'}
                  </span>
                </div>
                <div className={`flex justify-between pb-1.5 border-b text-slate-400 ${isLightTheme ? 'border-slate-200' : 'border-slate-800/60'}`}>
                  <span>Horário:</span>
                  <span className="font-mono font-bold flex items-center gap-1 text-amber-500">
                    <LucideIcon name="Clock" size={11} className="text-amber-500" />
                    {selectedTime}
                  </span>
                </div>
                <div className={`flex justify-between pb-1.5 border-b text-slate-400 ${isLightTheme ? 'border-slate-200' : 'border-slate-800/60'}`}>
                  <span>Data:</span>
                  <span className={`font-bold flex items-center gap-1.25 ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>
                    <LucideIcon name="Calendar" size={11} className="text-amber-500 mr-2" />
                    {activeDate.split('-').reverse().join('/')}
                  </span>
                </div>
                <div className="flex justify-between pt-1 font-bold text-sm">
                  <span className={isLightTheme ? 'text-slate-700' : 'text-slate-300'}>Valor do atendimento:</span>
                  <span className="text-amber-500 font-mono font-extrabold">R$ {activeService?.price.toFixed(2)}</span>
                </div>
              </div>

              {/* Identity Form Inputs */}
              <div className="space-y-3.5">
                <div>
                  <label htmlFor="client-name" className={`block text-xs font-semibold mb-1.5 ${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
                    Nome do Cliente <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-505">
                      <LucideIcon name="User" size={15} />
                    </div>
                    <input
                      type="text"
                      id="client-name"
                      required
                      placeholder="Ex: João da Silva"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className={`block w-full pl-10 pr-3 py-3 border focus:border-amber-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm transition-all ${isLightTheme ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'}`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="client-phone" className={`block text-xs font-semibold mb-1.5 ${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
                    WhatsApp ou Celular do Cliente (Opcional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-505">
                      <LucideIcon name="Phone" size={15} />
                    </div>
                    <input
                      type="tel"
                      id="client-phone"
                      placeholder="Ex: (11) 99999-9999"
                      value={clientPhone}
                      onChange={handlePhoneChange}
                      className={`block w-full pl-10 pr-3 py-3 border focus:border-amber-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm font-mono transition-all ${isLightTheme ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'}`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="client-notes" className={`block text-xs font-semibold mb-1.5 ${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
                    Alguma instrução ou observação? (Opcional)
                  </label>
                  <textarea
                    id="client-notes"
                    placeholder="Ex: Cabelo seco, prefere maquina de disfarce..."
                    value={notes}
                    rows={2}
                    onChange={(e) => setNotes(e.target.value)}
                    className={`block w-full px-3 py-2 border focus:border-amber-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm transition-all ${isLightTheme ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'}`}
                  />
                </div>
              </div>

              {/* Footer navigation */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="w-1/3 border border-slate-800 hover:border-slate-700 bg-slate-950/20 text-slate-400 font-display font-medium py-3.5 px-4 rounded-2xl transition-all cursor-pointer text-sm"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  id="submit-appointment-button"
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-955 font-display font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer text-sm uppercase tracking-wider text-slate-950"
                >
                  <LucideIcon name="CheckCircle" size={17} className="stroke-[2.5]" />
                  Concluir
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
