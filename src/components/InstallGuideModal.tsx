import React from 'react';
import { motion } from 'motion/react';
import LucideIcon from './LucideIcon';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLightTheme: boolean;
}

export default function InstallGuideModal({ isOpen, onClose, isLightTheme }: InstallGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`relative w-full max-w-sm overflow-hidden rounded-3xl border p-6 shadow-2xl transition-all duration-300 ${
          isLightTheme
            ? 'bg-white border-slate-205 text-slate-800 shadow-amber-500/5'
            : 'bg-slate-900 border-slate-800 text-slate-200'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors cursor-pointer ${
            isLightTheme ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-slate-800 text-slate-500'
          }`}
        >
          <LucideIcon name="X" size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <LucideIcon name="Smartphone" size={20} />
          </div>
          <div>
            <h3 className={`font-display font-black text-lg uppercase leading-tight ${isLightTheme ? 'text-slate-950' : 'text-white'}`}>
              Instalar Aplicativo
            </h3>
            <p className="text-[10px] font-mono tracking-widest text-amber-500 uppercase font-black">
              Usar no Celular e Offline
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className={`p-4 rounded-2xl mb-5 space-y-2.5 border ${isLightTheme ? 'bg-slate-50/50 border-slate-100' : 'bg-slate-955/40 border-slate-800/60'}`}>
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <LucideIcon name="Check" size={12} />
            </div>
            <span>Suporte Offline Habilitado</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <LucideIcon name="Check" size={12} />
            </div>
            <span>Persistência Local (LocalStorage)</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <LucideIcon name="Check" size={12} />
            </div>
            <span>PWA Instalável Ativo</span>
          </div>
        </div>

        {/* Step Guides */}
        <div className="space-y-4">
          <h4 className={`text-xs font-mono uppercase tracking-wider font-extrabold ${isLightTheme ? 'text-slate-500' : 'text-slate-400'}`}>
            Como Instalar no seu Smartphone:
          </h4>

          {/* iOS Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-550">
              <LucideIcon name="Apple" size={14} className="text-amber-500" />
              <span>iPhone & iPad (Safari)</span>
            </div>
            <ol className={`text-xs pl-5 list-decimal space-y-1 ${isLightTheme ? 'text-slate-600' : 'text-slate-400'}`}>
              <li>Abra o app no navegador <strong className={isLightTheme ? 'text-slate-900' : 'text-white'}>Safari</strong>.</li>
              <li>Toque no botão de de compartilhar <strong className={isLightTheme ? 'text-slate-900 font-bold' : 'text-white font-bold'}>Compartilhar</strong> (ícone de um quadrado com uma seta para cima <span className="inline-block translate-y-0.5">⎋</span>).</li>
              <li>Role para baixo e selecione <strong className={isLightTheme ? 'text-slate-900 font-bold' : 'text-white font-bold'}>Adicionar à Tela de Início</strong> (ícone <span className="inline-block translate-y-0.5">⨁</span>).</li>
            </ol>
          </div>

          {/* Android Section */}
          <div className="space-y-2 pt-1 border-t border-dashed border-slate-800/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-550">
              <LucideIcon name="Layers" size={14} className="text-amber-500" />
              <span>Android (Chrome)</span>
            </div>
            <ol className={`text-xs pl-5 list-decimal space-y-1 ${isLightTheme ? 'text-slate-600' : 'text-slate-400'}`}>
              <li>Abra o app no navegador <strong className={isLightTheme ? 'text-slate-900' : 'text-white'}>Google Chrome</strong>.</li>
              <li>Toque no botão de menu de 3 pontos no canto superior direito.</li>
              <li>Toque em <strong className={isLightTheme ? 'text-slate-900 font-bold' : 'text-white font-bold'}>Instalar aplicativo</strong> ou <strong className={isLightTheme ? 'text-slate-900 font-bold' : 'text-white font-bold'}>Adicionar à tela inicial</strong>.</li>
            </ol>
          </div>
        </div>

        {/* Footer info banner */}
        <div className={`mt-5 p-3 rounded-2xl text-[11px] leading-relaxed text-center ${isLightTheme ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-amber-900/10 text-amber-400 border border-amber-500/10'}`}>
          💈 <strong className="font-extrabold">Dri Barbeiro</strong> rodará como um app nativo, sem barra de endereços do navegador e totalmente offline!
        </div>
      </motion.div>
    </div>
  );
}
