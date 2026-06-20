import React, { useState } from 'react';
import { BarberService, WorkingConfig, Appointment, Barber } from '../types';
import LucideIcon from './LucideIcon';
import StatsTab from './admin/StatsTab';
import ServicesTab from './admin/ServicesTab';
import BarbersTab from './admin/BarbersTab';
import HoursTab from './admin/HoursTab';

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

  // If a barber is logged in, make sure they cannot open the 'barbers' tab
  React.useEffect(() => {
    if (loggedBarberId && adminTab === 'barbers') {
      setAdminTab('stats');
    }
  }, [loggedBarberId, adminTab]);

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
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-955 text-slate-950 font-black' 
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
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-955 text-slate-950 font-black' 
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
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-955 text-slate-950 font-black' 
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
        <StatsTab
          appointments={appointments}
          services={services}
          isLightTheme={isLightTheme}
        />
      )}

      {adminTab === 'services' && (
        <ServicesTab
          services={services}
          onUpdateServices={onUpdateServices}
          showToast={showToast}
          isLightTheme={isLightTheme}
        />
      )}

      {adminTab === 'hours' && (
        <HoursTab
          workingConfig={workingConfig}
          onUpdateConfig={onUpdateConfig}
          shopName={shopName}
          onUpdateShopName={onUpdateShopName}
          showToast={showToast}
          isLightTheme={isLightTheme}
        />
      )}

      {adminTab === 'barbers' && !loggedBarberId && (
        <BarbersTab
          barbers={barbers}
          onUpdateBarbers={onUpdateBarbers}
          showToast={showToast}
          isLightTheme={isLightTheme}
        />
      )}
    </div>
  );
}
