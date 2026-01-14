import React from 'react';
import { Smartphone, Monitor, construction, Hammer, Timer } from 'lucide-react';

interface MobileBlockerProps {
  isDarkMode: boolean;
}

const MobileBlocker: React.FC<MobileBlockerProps> = ({ isDarkMode }) => {
  return (
    <div className={`fixed inset-0 z-[500] flex flex-col items-center justify-center p-8 text-center transition-colors duration-500 ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-[#FF4F01]/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-sm space-y-8 animate-in fade-in zoom-in-95 duration-700">
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-3xl blur-xl animate-pulse" />
          <div className={`relative w-full h-full rounded-3xl border-2 flex items-center justify-center shadow-2xl ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
            <Smartphone size={48} className="text-indigo-500" />
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center border-4 border-[#050505] animate-bounce">
              <Hammer size={14} className="text-white" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight uppercase">Desktop Only</h1>
          <div className="h-1 w-12 bg-[#FF4F01] mx-auto rounded-full" />
          <p className={`text-sm font-medium leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
            The JournalFX mobile experience is currently <span className="text-[#FF4F01] font-bold">under development</span>. To maintain the highest analytical precision, we currently support desktop browsers only.
          </p>
        </div>

        <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200'} shadow-xl`}>
          <div className="flex items-center gap-4 text-left">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Monitor size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold">Switch to Desktop</h4>
              <p className="text-[10px] opacity-50 uppercase font-black tracking-widest mt-0.5">Recommended Experience</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-30 pt-4">
          <Timer size={14} />
          <span>Mobile Beta: Q2 2026</span>
        </div>
      </div>
    </div>
  );
};

export default MobileBlocker;
