
import React, { useMemo } from 'react';
import { Quote } from 'lucide-react';
import { getQuoteOfDay } from '../lib/quotes';

interface DailyQuoteProps {
  isDarkMode: boolean;
}

const DailyQuote: React.FC<DailyQuoteProps> = ({ isDarkMode }) => {
  const quote = useMemo(() => getQuoteOfDay(), []);

  return (
    <div className={`w-full p-6 rounded-2xl border mb-8 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden transition-all ${
      isDarkMode 
        ? 'bg-[#18181b] border-[#27272a] shadow-2xl' 
        : 'bg-white border-slate-100 shadow-md'
    }`}>
      {/* Decorative Background Icon */}
      <div className={`absolute -right-4 -bottom-4 opacity-[0.03] ${isDarkMode ? 'text-white' : 'text-black'}`}>
        <Quote size={120} />
      </div>

      <div className={`flex items-center justify-center w-12 h-12 rounded-xl shrink-0 ${
        isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
      }`}>
        <Quote size={24} />
      </div>

      <div className="flex-1 text-center md:text-left">
        <div className="flex flex-col gap-1">
          <p className={`text-base font-medium italic leading-relaxed ${
            isDarkMode ? 'text-zinc-200' : 'text-slate-700'
          }`}>
            "{quote.text}"
          </p>
          <p className={`text-xs font-black uppercase tracking-widest opacity-40 ${
            isDarkMode ? 'text-zinc-500' : 'text-slate-500'
          }`}>
            — {quote.author}
          </p>
        </div>
      </div>

      <div className="hidden lg:block shrink-0 px-4 py-2 rounded-full border border-dashed border-indigo-500/30">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/60">
          Daily Insight
        </span>
      </div>
    </div>
  );
};

export default DailyQuote;
