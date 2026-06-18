import { BarberService, Appointment, WorkingConfig, Barber } from './types';

export const DEFAULT_SERVICES: BarberService[] = [
  {
    id: 's1',
    name: 'Corte Degradê / Moderno',
    duration: 30,
    price: 45,
    description: 'Corte personalizado moderno, degradê clássico ou social com acabamento fino e lavagem.',
    icon: 'Scissors',
  },
  {
    id: 's2',
    name: 'Barboterapia & Toalha Quente',
    duration: 30,
    price: 35,
    description: 'Barba desenhada com uso de navalhetas esterilizadas, toalhas quentes e óleos essenciais para acalmar a pele.',
    icon: 'Sparkles',
  },
  {
    id: 's3',
    name: 'Combo Completo (Cabelo + Barba)',
    duration: 60,
    price: 75,
    description: 'O combo ideal para quem preza por máxima conveniência. Limpeza, corte, barba e finalização especial.',
    icon: 'Crown',
  },
  {
    id: 's4',
    name: 'Design de Sobrancelha',
    duration: 15,
    price: 15,
    description: 'Desenho de sobrancelha premium alinhado ao formato do seu rosto na pinça ou navalete.',
    icon: 'Eye',
  },
  {
    id: 's5',
    name: 'Pigmentação de Cabelo ou Barba',
    duration: 45,
    price: 40,
    description: 'Disfarce profissional de falhas capilares ou fios brancos, mantendo o aspecto altamente natural.',
    icon: 'Paintbrush',
  },
];

export const DEFAULT_BARBERS: Barber[] = [];

export const DEFAULT_CONFIG: WorkingConfig = {
  startHour: '07:00',
  endHour: '22:00',
  intervalMinutes: 30,
  workingDays: [0, 1, 2, 3, 4, 5, 6], // Domingo a Sábado
};

// Setup initial state matching Saturday 2026-05-23
export const INITIAL_APPOINTMENTS: Appointment[] = [];
