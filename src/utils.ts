import { Appointment, BarberService, WorkingConfig, BlockedSlot } from './types';

// Convert "HH:MM" format to minutes since midnight
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Convert minutes since midnight back to "HH:MM"
export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Format Portuguese dates beautifully
export function formatPortugueseDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
  
  const weekDays = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado'
  ];
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return `${weekDays[dateObj.getDay()]}, ${Number(day)} de ${months[dateObj.getMonth()]}`;
}

// Generate all possible slots and mark availability based on active bookings, durations, and barber selection
export function getAvailableSlots(
  dateStr: string,
  config: WorkingConfig,
  appointments: Appointment[],
  services: BarberService[],
  selectedBarberId?: string,
  barbersList?: any[],
  blockedSlots: BlockedSlot[] = []
): { time: string; available: boolean; reason?: string; suggestedBarberId?: string }[] {
  // 1. Check if it's a working day
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday ...
  
  if (!config.workingDays.includes(dayOfWeek)) {
    return [];
  }

  const startMin = timeToMinutes(config.startHour);
  const endMin = timeToMinutes(config.endHour);
  const slots: { time: string; available: boolean; reason?: string; suggestedBarberId?: string }[] = [];

  // Get active (not canceled) appointments for this date
  const activeApts = appointments.filter(
    (apt) => apt.date === dateStr && apt.status !== 'canceled'
  );

  // We need to evaluate availability per active barber
  const activeBarbers = (barbersList && barbersList.filter((b: any) => b.active)) || [];
  const allBarbers = activeBarbers.length > 0 
    ? activeBarbers 
    : [{ id: 'b1', name: 'Barbeiro', active: true }]; // fallback if no list or empty

  // Calculate current date and time in user's timezone to check for past hours
  const now = new Date();
  const yearNow = now.getFullYear();
  const monthNow = (now.getMonth() + 1).toString().padStart(2, '0');
  const dayNow = now.getDate().toString().padStart(2, '0');
  const todayStr = `${yearNow}-${monthNow}-${dayNow}`;
  const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

  // Generate slots from start to end by configuration interval
  for (let min = startMin; min < endMin; min += config.intervalMinutes) {
    const timeStr = minutesToTime(min);
    
    let isPast = false;
    if (dateStr === todayStr) {
      if (min < currentTotalMinutes) {
        isPast = true;
      }
    } else if (dateStr < todayStr) {
      isPast = true;
    }

    if (isPast) {
      slots.push({
        time: timeStr,
        available: false,
        reason: 'Horário já passou',
      });
      continue;
    }

    if (selectedBarberId && selectedBarberId !== 'any') {
      // Check if this specific barber is booked for an overlapping range
      const barberApts = activeApts.filter(apt => apt.barberId === selectedBarberId);
      const isBooked = barberApts.some(apt => {
        const start = timeToMinutes(apt.time);
        const service = services.find((s) => s.id === apt.serviceId);
        const duration = service ? service.duration : 30;
        return min >= start && min < (start + duration);
      });

      // Check if this specific barber is blocked for this slot
      const isBlocked = blockedSlots.some(
        (slot) => slot.date === dateStr && slot.time === timeStr && slot.barberId === selectedBarberId
      );

      const isAvailable = !isBooked && !isBlocked;

      slots.push({
        time: timeStr,
        available: isAvailable,
        reason: isBooked ? 'Barbeiro ocupado' : isBlocked ? 'Horário bloqueado' : undefined,
        suggestedBarberId: selectedBarberId,
      });
    } else {
      // "Any" barber is selected.
      // We are available if AT LEAST ONE active barber is free during this slot.
      const freeBarbers = allBarbers.filter(barber => {
        const barberApts = activeApts.filter(apt => apt.barberId === barber.id);
        const isBooked = barberApts.some(apt => {
          const start = timeToMinutes(apt.time);
          const service = services.find((s) => s.id === apt.serviceId);
          const duration = service ? service.duration : 30;
          return min >= start && min < (start + duration);
        });

        const isBlocked = blockedSlots.some(
          (slot) => slot.date === dateStr && slot.time === timeStr && slot.barberId === barber.id
        );

        return !isBooked && !isBlocked;
      });

      const isAvailable = freeBarbers.length > 0;
      slots.push({
        time: timeStr,
        available: isAvailable,
        reason: !isAvailable ? 'Todos ocupados' : undefined,
        // Propose the first free barber for this slot
        suggestedBarberId: isAvailable ? freeBarbers[0].id : undefined,
      });
    }
  }

  return slots;
}

// Get next 7 business dates starting from given reference date
export function getNextSevenDays(referenceDateStr?: string): string[] {
  const refDate = referenceDateStr || (() => {
    const now = new Date();
    const yStr = now.getFullYear();
    const mStr = (now.getMonth() + 1).toString().padStart(2, '0');
    const dStr = now.getDate().toString().padStart(2, '0');
    return `${yStr}-${mStr}-${dStr}`;
  })();

  const [year, month, day] = refDate.split('-').map(Number);
  const days: string[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(year, month - 1, day + i);
    const yStr = date.getFullYear();
    const mStr = (date.getMonth() + 1).toString().padStart(2, '0');
    const dStr = date.getDate().toString().padStart(2, '0');
    days.push(`${yStr}-${mStr}-${dStr}`);
  }

  return days;
}

// Hash password using native Web Crypto API (SHA-256)
export async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
