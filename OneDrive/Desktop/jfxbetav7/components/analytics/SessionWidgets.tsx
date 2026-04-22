
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sunrise, Sun, Sunset, Activity, Clock, TrendingUp, TrendingDown, Target, BarChart2 } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  ReferenceLine,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { Trade } from '../../types';
import { clsx } from 'clsx';
import { ANALYTICS_TIMEZONE_LABEL, getSastHourFromTrade, getSastWeekdayFromDate } from '../../lib/timeUtils';

const safePnL = (value: unknown): number => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
};

interface WidgetProps {
  trades: Trade[];
  isDarkMode: boolean;
  currencySymbol: string;
}

const getSessionIcon = (session: string) => {
  switch (session) {
    case 'Asian': return <Sunrise size={18} className="text-amber-500" />;
    case 'London': return <Sun size={18} className="text-blue-500" />;
    case 'Overlap': return <Activity size={18} className="text-purple-500" />; 
    case 'New York': return <Sunset size={18} className="text-orange-500" />;
    default: return <Clock size={18} className="text-gray-500" />;
  }
};

const getTradeSession = (trade: Trade) => {
  const session = (trade.session && trade.session !== 'Session' ? trade.session : '') || '';
  if (session) return session;

  const hour = getSastHourFromTrade(trade);
  if (hour === null) return 'Unknown';
  if (hour >= 0 && hour < 9) return 'Asian';
  if (hour >= 9 && hour < 15) return 'London';
  if (hour >= 15 && hour < 18) return 'Overlap';
  if (hour >= 18) return 'New York';
  return 'Unknown';
};

const getTradeHour = (trade: Trade) => getSastHourFromTrade(trade);

const formatPnL = (value: number, currencySymbol: string) => {
  const sign = value >= 0 ? '+' : '-';
  return `${sign}${currencySymbol}${Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export const MarketSessionWidget: React.FC<WidgetProps> = ({ trades, isDarkMode, currencySymbol }) => {
  const data = useMemo(() => {
    const stats: Record<string, { pnl: number, wins: number, count: number }> = {
      'Asian': { pnl: 0, wins: 0, count: 0 },
      'London': { pnl: 0, wins: 0, count: 0 },
      'Overlap': { pnl: 0, wins: 0, count: 0 },
      'New York': { pnl: 0, wins: 0, count: 0 },
    };
    
    trades.forEach(trade => {
      const session = getTradeSession(trade);
      let key = 'New York';
      if (/Asia|Tokyo|Sydney/i.test(session)) key = 'Asian';
      else if (/London/i.test(session)) key = 'London';
      else if (/Overlap/i.test(session)) key = 'Overlap';
      else if (/York/i.test(session)) key = 'New York';
      
      stats[key].pnl += safePnL(trade.pnl);
      stats[key].count += 1;
      if (trade.result === 'Win') stats[key].wins += 1;
    });

    return Object.entries(stats).map(([name, d]) => ({
      name,
      pnl: d.pnl,
      winRate: d.count > 0 ? (d.wins / d.count) * 100 : 0,
      count: d.count
    }));
  }, [trades]);

  return (
    <div className={clsx(
      "p-6 rounded-[32px] border h-full flex flex-col justify-between",
      "bg-[#000000] border-zinc-900 shadow-xl"
    )}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black tracking-tight italic flex items-center gap-2 uppercase">
            <Sunrise size={20} className="text-brand" />
            Market Sessions
          </h3>
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest opacity-50 text-right">
          Timezone: {ANALYTICS_TIMEZONE_LABEL}
        </div>
      </div>

      <div className="h-[200px] min-h-[200px] w-full mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#27272a" : "#e2e8f0"} />
            <XAxis dataKey="name" stroke={isDarkMode ? "#71717a" : "#94a3b8"} fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke={isDarkMode ? "#71717a" : "#94a3b8"} fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${currencySymbol}${Math.abs(Number(v)).toFixed(2)}`} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDarkMode ? '#18181b' : '#fff', 
                borderRadius: '16px', 
                border: isDarkMode ? '1px solid #27272a' : '1px solid #e2e8f0',
                fontWeight: 'bold',
                color: isDarkMode ? '#fff' : '#000'
              }}
              itemStyle={{ 
                fontSize: '12px',
                color: isDarkMode ? '#fff' : '#000'
              }}
              cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
              formatter={(value: number) => [formatPnL(value, currencySymbol), 'PNL']}
            />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10B981' : '#EF4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2">
        {data.map(s => (
          <div key={s.name} className={clsx(
            "p-3 rounded-2xl border flex items-center justify-between",
            isDarkMode ? "bg-black/20 border-zinc-800/50" : "bg-slate-50 border-slate-100"
          )}>
            <div className="flex items-center gap-3">
              {getSessionIcon(s.name)}
              <span className="text-xs font-black uppercase tracking-tight">{s.name}</span>
            </div>
            <div className="text-right">
              <div className={clsx("text-sm font-black", s.pnl >= 0 ? "text-emerald-500" : "text-rose-500")}>
                {s.pnl >= 0 ? '+' : ''}{currencySymbol}{Math.abs(s.pnl).toLocaleString()}
              </div>
              <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{s.winRate.toFixed(0)}% WR • {s.count} trades</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const HourlyPerformanceWidget: React.FC<WidgetProps> = ({ trades, isDarkMode, currencySymbol }) => {
  const data = useMemo(() => {
    const stats: Record<number, { pnl: number, count: number }> = {};
    Array.from({ length: 24 }).forEach((_, i) => stats[i] = { pnl: 0, count: 0 });
    
    trades.forEach(t => {
      const hour = getTradeHour(t);
      if (hour !== null) {
        stats[hour].pnl += safePnL(t.pnl);
        stats[hour].count += 1;
      }
    });

    return Object.entries(stats).map(([hour, d]) => ({
      hour: parseInt(hour),
      label: `${hour}:00`,
      pnl: d.pnl,
      count: d.count
    })).filter(d => d.count > 0 || Math.abs(d.pnl) > 0);
  }, [trades]);

  return (
    <div className={clsx(
      "p-6 rounded-[32px] border h-full flex flex-col justify-between",
      "bg-[#000000] border-zinc-900 shadow-xl"
    )}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black tracking-tight italic flex items-center gap-2 uppercase">
            <Clock size={20} className="text-brand" />
            Hourly Performance
          </h3>
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest opacity-50 text-right">
          Timezone: {ANALYTICS_TIMEZONE_LABEL}
        </div>
      </div>

      <div className="h-[250px] min-h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#27272a" : "#e2e8f0"} />
            <XAxis dataKey="label" stroke={isDarkMode ? "#71717a" : "#94a3b8"} fontSize={8} tickLine={false} axisLine={false} />
            <YAxis stroke={isDarkMode ? "#71717a" : "#94a3b8"} fontSize={8} tickLine={false} axisLine={false} tickFormatter={(v) => `${currencySymbol}${Math.abs(Number(v)).toFixed(2)}`} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDarkMode ? '#18181b' : '#fff', 
                borderRadius: '16px', 
                border: isDarkMode ? '1px solid #27272a' : '1px solid #e2e8f0',
                fontWeight: 'bold',
                color: isDarkMode ? '#fff' : '#000'
              }}
              itemStyle={{ 
                fontSize: '10px',
                color: isDarkMode ? '#fff' : '#000'
              }}
              cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
              formatter={(value: number) => [formatPnL(value, currencySymbol), 'PNL']}
            />
            <ReferenceLine y={0} stroke={isDarkMode ? "#3f3f46" : "#cbd5e1"} />
            <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10B981' : '#EF4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const DailyActivityHeatmap: React.FC<WidgetProps> = ({ trades, isDarkMode, currencySymbol }) => {
  const data = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const stats: Record<string, { pnl: number, count: number }> = {};
    days.forEach(d => stats[d] = { pnl: 0, count: 0 });

    trades.forEach(t => {
      const day = getSastWeekdayFromDate(t.date);
      if (stats[day]) {
        stats[day].pnl += safePnL(t.pnl);
        stats[day].count += 1;
      }
    });

    return Object.entries(stats).map(([name, d]) => ({
      name,
      pnl: d.pnl,
      absPnl: Math.abs(d.pnl),
      count: d.count
    }));
  }, [trades]);

  const maxVal = Math.max(...data.map(x => x.absPnl), 1);

  return (
    <div className={clsx(
      "p-8 rounded-[32px] border h-full flex flex-col justify-between",
      isDarkMode ? "bg-zinc-950 border-zinc-900 shadow-2xl" : "bg-white border-slate-200 shadow-xl"
    )}>
      <div className="mb-4">
        <h3 className="text-lg font-black tracking-tight italic flex items-center gap-3 uppercase">
          <BarChart2 size={24} className="text-brand" />
          Day of Week
        </h3>
        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1 ml-9">Performance by Trading Day</p>
      </div>

      {/* CENTERED: Radar Chart */}
      <div className="flex-1 flex items-center justify-center w-full min-h-[260px] py-4">
        <div className="w-full h-full max-w-[280px] max-h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid stroke={isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"} />
              <PolarAngleAxis 
                dataKey="name" 
                tick={{ fill: isDarkMode ? '#a1a1aa' : '#64748b', fontSize: 10, fontWeight: '900' }} 
              />
              <Radar
                name="PNL"
                dataKey="absPnl"
                stroke="#8251EE"
                strokeWidth={3}
                fill="#8251EE"
                fillOpacity={0.3}
                animationDuration={1500}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#18181b' : '#fff', 
                  borderRadius: '16px', 
                  border: isDarkMode ? '1px solid #27272a' : '1px solid #e2e8f0',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: isDarkMode ? '#fff' : '#000'
                }}
                formatter={(val: number, name, props) => {
                  const original = props.payload.pnl;
                  return [formatPnL(original, currencySymbol), 'PNL'];
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4 mt-4">
        {data.map(d => (
          <div key={d.name} className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{d.name}</span>
              <span className={clsx("text-xs font-black", d.pnl >= 0 ? "text-emerald-500" : "text-rose-500")}>
                {d.pnl >= 0 ? '+' : ''}{currencySymbol}{Math.abs(d.pnl).toLocaleString()}
              </span>
            </div>
            <div className={clsx("h-1.5 w-full rounded-full overflow-hidden", isDarkMode ? "bg-zinc-800" : "bg-slate-100")}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (d.absPnl / maxVal) * 100)}%` }}
                className={clsx("h-full rounded-full transition-all duration-1000", d.pnl >= 0 ? "bg-emerald-500" : "bg-rose-500")}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
