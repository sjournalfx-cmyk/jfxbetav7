
import React, { useState, useEffect, useRef } from 'react';
import { Clock, Globe, Settings2, CheckSquare, Square } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface SessionClockProps {
  isDarkMode: boolean;
}

const ALL_SESSIONS = [
  { id: 'sydney', name: 'Sydney', start: 22, end: 7, color: 'text-amber-500', bg: 'bg-amber-500' },
  { id: 'tokyo', name: 'Tokyo', start: 0, end: 9, color: 'text-rose-500', bg: 'bg-rose-500' },
  { id: 'london', name: 'London', start: 8, end: 17, color: 'text-blue-500', bg: 'bg-blue-500' },
  { id: 'new_york', name: 'New York', start: 13, end: 22, color: 'text-emerald-500', bg: 'bg-emerald-500' },
];

const SessionClock: React.FC<SessionClockProps> = ({ isDarkMode }) => {
  const [utcTime, setUtcTime] = useState(new Date());
  const [visibleSessions, setVisibleSessions] = useLocalStorage<string[]>('jfx_visible_sessions', ALL_SESSIONS.map(s => s.id));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setUtcTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
            setIsSettingsOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSession = (id: string) => {
    if (visibleSessions.includes(id)) {
      if (visibleSessions.length > 1) {
        setVisibleSessions(visibleSessions.filter(s => s !== id));
      }
    } else {
      setVisibleSessions([...visibleSessions, id]);
    }
  };

  const getSessionStatus = (start: number, end: number) => {
    const currentHour = utcTime.getUTCHours();
    const currentMin = utcTime.getUTCMinutes();
    const currentTime = currentHour + currentMin / 60;

    let isOpen = false;
    let progress = 0;
    
    // Normalize times for calculation
    const s = start;
    const e = end;
    const c = currentTime;
    
    if (s > e) {
      // Wraps around midnight (e.g. 22:00 to 07:00)
      if (c >= s) {
        // Before midnight part
        isOpen = true;
        // Total duration is (24-s) + e
        progress = ((c - s) / (24 - s + e)) * 100;
      } else if (c < e) {
        // After midnight part
        isOpen = true;
        progress = ((24 - s + c) / (24 - s + e)) * 100;
      } else {
         // Closed
         let timeToOpen = (s - c);
         return { state: 'Closed', label: `Opens in ${Math.floor(timeToOpen)}h`, progress: 0 };
      }
    } else {
      // Standard session (e.g. 08:00 to 17:00)
      if (c >= s && c < e) {
        isOpen = true;
        progress = ((c - s) / (e - s)) * 100;
      } else {
        let timeToOpen = c < s ? s - c : (24 - c + s);
        return { state: 'Closed', label: `Opens in ${Math.floor(timeToOpen)}h`, progress: 0 };
      }
    }

    if (isOpen) {
        return { state: 'Open', label: 'Market Open', progress };
    }
    return { state: 'Closed', label: 'Closed', progress: 0 };
  };

  const sessionsToShow = ALL_SESSIONS.filter(s => visibleSessions.includes(s.id));

  return (
    <div className={`w-full p-6 rounded-2xl border mb-6 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 relative ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-100 shadow-md'}`}>
      
      {/* Settings Action */}
      <div className="absolute top-4 right-4" ref={settingsRef}>
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300' : 'hover:bg-slate-50 text-slate-400 hover:text-slate-600'}`}
          >
            <Settings2 size={16} />
          </button>

          {isSettingsOpen && (
            <div className={`absolute right-0 top-full mt-2 w-48 p-2 rounded-xl border shadow-2xl z-[50] animate-in fade-in slide-in-from-top-2 duration-200 ${isDarkMode ? 'bg-[#121215] border-[#27272a]' : 'bg-white border-slate-200'}`}>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 p-2 mb-1">Visible Sessions</p>
                <div className="space-y-1">
                    {ALL_SESSIONS.map(s => (
                        <button
                            key={s.id}
                            onClick={() => toggleSession(s.id)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-bold transition-colors ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-slate-50'}`}
                        >
                            <span>{s.name}</span>
                            {visibleSessions.includes(s.id) ? (
                                <CheckSquare size={14} className="text-violet-500" />
                            ) : (
                                <Square size={14} className="opacity-20" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
          )}
      </div>

      {/* Main UTC Clock */}
      <div className="flex flex-col gap-4 min-w-[200px]">
        <div className="flex items-center gap-4">
           <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>
              <Globe size={24} className="animate-[spin_60s_linear_infinite]" />
           </div>
           <div>
               <h3 className="text-2xl font-mono font-bold tracking-tight">
                  {utcTime.toLocaleTimeString('en-GB', { timeZone: 'Africa/Johannesburg', hour12: false })}
               </h3>
               <p className="text-xs font-bold uppercase tracking-widest opacity-50">SAST Time</p>
           </div>
        </div>
      </div>

      <div className={`h-px xl:h-12 w-full xl:w-px ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-200'}`} />

      {/* Session Bars */}
      <div className={`flex-1 w-full grid gap-4 grid-cols-2 ${sessionsToShow.length === 4 ? 'md:grid-cols-4' : sessionsToShow.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          {sessionsToShow.map(session => {
              const status = getSessionStatus(session.start, session.end);
              const isOpen = status.state === 'Open';

              return (
                  <div key={session.name} className={`relative p-3 rounded-xl border overflow-hidden ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                      {/* Progress Background */}
                      {isOpen && (
                          <div 
                            className={`absolute bottom-0 left-0 h-1 ${session.bg} transition-all duration-1000`} 
                            style={{ width: `${status.progress}%` }} 
                          />
                      )}
                      
                      <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider">{session.name}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isOpen ? `${session.bg} text-white` : 'bg-zinc-500/10 text-zinc-500'}`}>
                              {status.state.toUpperCase()}
                          </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                          <Clock size={12} className={isOpen ? session.color : 'text-zinc-500'} />
                          <span className={`text-xs font-medium ${isOpen ? 'text-white' : 'opacity-50'}`}>
                              {isOpen ? 'Active Now' : status.label}
                          </span>
                      </div>
                  </div>
              );
          })}
      </div>
    </div>
  );
};

export default SessionClock;
