export interface BarberService {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number; // in Brazilian Reais (R$)
  description: string;
  icon: string; // lucide icon name
  image?: string; // Base64 or URL string
}

export interface DaySchedule {
  date: string; // YYYY-MM-DD
  blockedHours: string[]; // List of HH:MM blocked hours
}

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  serviceId: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'canceled' | 'completed';
  createdAt: string;
  barberId?: string; // Barber assigned to this appointment
}

export interface Barber {
  id: string;
  name: string;
  username: string;
  password?: string; // login password/pin for barber
  active: boolean;
  color?: string; // Tailwind color accent class
  phone?: string; // Barber's phone number for receiving appointment notifications
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'success' | 'alert' | 'info' | 'reminder';
  read: boolean;
}

export interface WorkingConfig {
  startHour: string; // "09:00"
  endHour: string; // "19:00"
  intervalMinutes: number; // 30, 45, 60
  workingDays: number[]; // [1, 2, 3, 4, 5, 6] (0 = Sunday, 1 = Monday ...)
}

export interface BlockedSlot {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  barberId: string; // ID of the barber
}
