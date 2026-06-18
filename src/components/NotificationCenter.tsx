import React, { useState } from 'react';
import { NotificationItem } from '../types';
import LucideIcon from './LucideIcon';

interface NotificationCenterProps {
  notifications: NotificationItem[];
  onClearNotifications: () => void;
  onMarkAllAsRead: () => void;
  showToast: (title: string, message: string, type: 'success' | 'alert' | 'info' | 'reminder') => void;
  onRequestNativePermission: () => void;
  hasNativePermission: boolean | null;
}

export default function NotificationCenter({
  notifications,
  onClearNotifications,
  onMarkAllAsRead,
  showToast,
  onRequestNativePermission,
  hasNativePermission,
}: NotificationCenterProps) {
  return (
    <div className="space-y-4">
      {/* 3. In-App Bulletin Message Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800/85">
          <h3 className="font-display font-black text-white text-sm flex items-center gap-1.5 uppercase tracking-wider">
            <LucideIcon name="Bell" size={14} className="text-amber-450" />
            Mural de Notificações
          </h3>
          {notifications.length > 0 && (
            <button
              onClick={onClearNotifications}
              className="text-[10px] uppercase font-bold tracking-wider text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
            >
              Limpar Tudo
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs italic">
            Nenhum alerta recente emitido neste dispositivo.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {notifications.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-slate-950 border border-slate-850 rounded-2xl space-y-1.5 text-xs shadow-inner"
              >
                <div className="flex justify-between items-center">
                  <span className={`font-black uppercase tracking-wider text-[8px] px-2 py-0.5 rounded-md ${
                    item.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                    item.type === 'alert' ? 'bg-red-500/10 text-red-400 border border-red-500/10' : 'bg-blue-500/10 text-blue-400 border border-blue-500/10'
                  }`}>
                    {item.type}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono font-bold">{item.time}</span>
                </div>
                <h4 className="font-bold text-white">{item.title}</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">{item.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
