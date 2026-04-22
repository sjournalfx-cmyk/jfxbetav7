import React from 'react';
import { motion } from 'motion/react';
import { 
  Target, AlertCircle, Clock, LayoutGrid, Zap, 
  BarChart3, CheckCircle2, TrendingUp, Brain, 
  Timer, Clock3, ListChecks, BrainCircuit, 
  TrendingDown, Goal as GoalIcon 
} from 'lucide-react';

interface WizardData {
  tradingStyle: string;
  goals: string;
  riskTolerance: string;
  challenges: string[];
  timeCommitment: string;
  experience: string;
  preferredPairs: string[];
  markets: string[];
  analysisTimeframe: string;
  entryTimeframe: string;
  tradingSessions: string[];
  dailyTradeLimit: string;
  exitMechanics: string;
  tradeManagement: string;
  profitTarget: string;
  lossCap: string;
  whyITrade: string;
}

interface StepProps {
  isDarkMode: boolean;
  data: WizardData;
  onChange: (newData: Partial<WizardData>) => void;
}

export const IdentityStep: React.FC<StepProps> = ({ isDarkMode, data, onChange }) => (
  <div className="space-y-6">
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-4">
        <Target size={32} className="text-white" />
      </div>
      <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Trader Identity & Markets</h2>
      <p className={`mt-2 ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Define your style and market focus</p>
    </div>
    
    <div className="space-y-6">
      <div>
        <label className={`block mb-3 text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Trading Style</label>
        <div className="grid grid-cols-2 gap-3">
          {['Scalper', 'Day Trader', 'Swing Trader', 'Position Trader'].map((style) => (
            <button
              key={style}
              onClick={() => onChange({ tradingStyle: style })}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                data.tradingStyle === style
                  ? 'border-amber-500 bg-amber-500/10'
                  : isDarkMode ? 'border-zinc-800 hover:border-zinc-700' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{style}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={`block mb-3 text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Asset Classes</label>
        <div className="flex flex-wrap gap-2">
          {['Forex', 'Crypto', 'Stocks', 'Options', 'Futures', 'Indices', 'Commodities'].map((market) => (
            <button
              key={market}
              onClick={() => {
                const next = data.markets.includes(market)
                  ? data.markets.filter(m => m !== market)
                  : [...data.markets, market];
                onChange({ markets: next });
              }}
              className={`px-4 py-2 rounded-full border-2 transition-all ${
                data.markets.includes(market)
                  ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                  : isDarkMode ? 'border-zinc-800 text-zinc-400' : 'border-slate-200 text-slate-600'
              }`}
            >
              {market}
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const GoalsStep: React.FC<StepProps> = ({ isDarkMode, data, onChange }) => (
  <div className="space-y-6">
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
        <GoalIcon size={32} className="text-white" />
      </div>
      <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Goals & Motivation</h2>
      <p className={`mt-2 ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>What drives your trading performance?</p>
    </div>
    
    <div className="space-y-4">
      <div>
        <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-zinc-400' : 'text-slate-700'}`}>Your 'Why' (Core Motivation)</label>
        <textarea
          value={data.whyITrade}
          onChange={(e) => onChange({ whyITrade: e.target.value })}
          placeholder="e.g., Financial freedom for my family, building a legacy, or master technical analysis..."
          className={`w-full h-24 p-4 rounded-xl border-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
          }`}
        />
      </div>
      <div>
        <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-zinc-400' : 'text-slate-700'}`}>Specific Performance Goals</label>
        <textarea
          value={data.goals}
          onChange={(e) => onChange({ goals: e.target.value })}
          placeholder="e.g., Target 5% monthly return, grow account to $50k, maintain < 3% drawdown..."
          className={`w-full h-24 p-4 rounded-xl border-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
          }`}
        />
      </div>
    </div>
  </div>
);

export const RiskStep: React.FC<StepProps> = ({ isDarkMode, data, onChange }) => (
  <div className="space-y-6">
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center mx-auto mb-4">
        <AlertCircle size={32} className="text-white" />
      </div>
      <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Risk & Volume Caps</h2>
      <p className={`mt-2 ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Protecting your capital with hard limits</p>
    </div>

    <div className="space-y-6">
      <div>
        <label className={`block mb-3 text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Risk Per Trade</label>
        <div className="grid grid-cols-3 gap-3">
          {['Conservative (0.5%)', 'Moderate (1%)', 'Aggressive (2%)'].map((risk) => (
            <button
              key={risk}
              onClick={() => onChange({ riskTolerance: risk })}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                data.riskTolerance === risk
                  ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                  : isDarkMode ? 'border-zinc-800 text-zinc-400' : 'border-slate-200 text-slate-600'
              }`}
            >
              <span className="text-sm font-medium">{risk.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={`block mb-3 text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Daily Trade Limit</label>
        <div className="grid grid-cols-3 gap-3">
          {['1-2 Trades', '3-5 Trades', 'Unlimited'].map((limit) => (
            <button
              key={limit}
              onClick={() => onChange({ dailyTradeLimit: limit })}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                data.dailyTradeLimit === limit
                  ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                  : isDarkMode ? 'border-zinc-800 text-zinc-400' : 'border-slate-200 text-slate-600'
              }`}
            >
              <span className="text-sm font-medium">{limit}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={`block mb-2 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Daily Loss Cap</label>
          <input
            type="text"
            value={data.lossCap}
            onChange={(e) => onChange({ lossCap: e.target.value })}
            placeholder="e.g., -2% or -$500"
            className={`w-full p-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-rose-500/20 ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>
        <div>
          <label className={`block mb-2 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Profit Target</label>
          <input
            type="text"
            value={data.profitTarget}
            onChange={(e) => onChange({ profitTarget: e.target.value })}
            placeholder="e.g., +4% or +$1000"
            className={`w-full p-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>
      </div>
    </div>
  </div>
);

export const ChallengesStep: React.FC<StepProps & { challengeOptions: any[] }> = ({ isDarkMode, data, onChange, challengeOptions }) => {
  const toggleChallenge = (id: string) => {
    const exists = data.challenges.includes(id);
    const next = exists ? data.challenges.filter(v => v !== id) : [...data.challenges, id];
    onChange({ challenges: next });
  };
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} className="text-white" />
        </div>
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>What challenges hold you back?</h2>
        <p className={`mt-2 ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Select all that apply</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {challengeOptions.map((challenge) => (
          <button
            key={challenge.id}
            onClick={() => toggleChallenge(challenge.id)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              data.challenges.includes(challenge.id)
                ? 'border-violet-500 bg-violet-500/10'
                : isDarkMode 
                  ? 'border-zinc-700 hover:border-zinc-600' 
                  : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className={`flex items-center gap-2 mb-1 ${data.challenges.includes(challenge.id) ? 'text-violet-500' : isDarkMode ? 'text-zinc-400' : 'text-slate-400'}`}>
              {challenge.icon}
              <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{challenge.label}</div>
            </div>
            <div className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>{challenge.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export const LogisticsStep: React.FC<StepProps> = ({ isDarkMode, data, onChange }) => (
  <div className="space-y-6">
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mx-auto mb-4">
        <Clock size={32} className="text-white" />
      </div>
      <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Logistics & Timing</h2>
      <p className={`mt-2 ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>When and how long will you trade?</p>
    </div>

    <div className="space-y-6">
      <div>
        <label className={`block mb-3 text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Preferred Sessions</label>
        <div className="grid grid-cols-2 gap-3">
          {['London Open', 'New York Open', 'Asian Session', 'NY/London Overlap'].map((session) => (
            <button
              key={session}
              onClick={() => {
                const next = data.tradingSessions.includes(session)
                  ? data.tradingSessions.filter(s => s !== session)
                  : [...data.tradingSessions, session];
                onChange({ tradingSessions: next });
              }}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                data.tradingSessions.includes(session)
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500'
                  : isDarkMode ? 'border-zinc-800 hover:border-zinc-700' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{session}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={`block mb-3 text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Daily Screen Time</label>
        <div className="grid grid-cols-2 gap-3">
          {['Minimal (<1hr)', 'Part-Time (1-3hr)', 'Full-Time (3-5hr)', 'Intense (5hr+)'].map((time) => (
            <button
              key={time}
              onClick={() => onChange({ timeCommitment: time })}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                data.timeCommitment === time
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500'
                  : isDarkMode ? 'border-zinc-800 hover:border-zinc-700' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{time}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const TechnicalStep: React.FC<StepProps & { preferredPairOptions: string[] }> = ({ isDarkMode, data, onChange, preferredPairOptions }) => (
  <div className="space-y-6">
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
        <LayoutGrid size={32} className="text-white" />
      </div>
      <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Technical Framework</h2>
      <p className={`mt-2 ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Map your structure and execution pairs</p>
    </div>

    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={`block mb-2 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>HTF (Structure)</label>
          <select
            value={data.analysisTimeframe}
            onChange={(e) => onChange({ analysisTimeframe: e.target.value })}
            className={`w-full p-3 rounded-xl border-2 focus:outline-none ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {['Monthly', 'Weekly', 'Daily', 'H4', 'H1'].map(tf => <option key={tf} value={tf}>{tf}</option>)}
          </select>
        </div>
        <div>
          <label className={`block mb-2 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>LTF (Entry)</label>
          <select
            value={data.entryTimeframe}
            onChange={(e) => onChange({ entryTimeframe: e.target.value })}
            className={`w-full p-3 rounded-xl border-2 focus:outline-none ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {['H1', 'M15', 'M5', 'M1', 'Seconds'].map(tf => <option key={tf} value={tf}>{tf}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={`block mb-3 text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Primary Watchlist</label>
        <div className="flex flex-wrap gap-2">
          {preferredPairOptions.map((pair) => (
            <button
              key={pair}
              onClick={() => {
                const next = data.preferredPairs.includes(pair)
                  ? data.preferredPairs.filter(p => p !== pair)
                  : [...data.preferredPairs, pair].slice(0, 4);
                onChange({ preferredPairs: next });
              }}
              className={`px-4 py-2 rounded-full border-2 transition-all ${
                data.preferredPairs.includes(pair)
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500'
                  : isDarkMode ? 'border-zinc-800 text-zinc-400' : 'border-slate-200 text-slate-600'
              }`}
            >
              {pair}
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const ExecutionStep: React.FC<StepProps> = ({ isDarkMode, data, onChange }) => (
  <div className="space-y-6">
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center mx-auto mb-4">
        <Zap size={32} className="text-white" />
      </div>
      <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Execution Protocols</h2>
      <p className={`mt-2 ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>How do you manage active trades?</p>
    </div>

    <div className="space-y-6">
      <div>
        <label className={`block mb-3 text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Exit Mechanic</label>
        <div className="grid grid-cols-2 gap-3">
          {['Fixed TP/SL', 'Trailing Stop', 'Tiered Targets (TP1/2)', 'Time-Based Exit'].map((mech) => (
            <button
              key={mech}
              onClick={() => onChange({ exitMechanics: mech })}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                data.exitMechanics === mech
                  ? 'border-violet-500 bg-violet-500/10'
                  : isDarkMode ? 'border-zinc-800 hover:border-zinc-700' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{mech}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={`block mb-3 text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Trade Management (BE)</label>
        <div className="grid grid-cols-2 gap-3">
          {['Move to BE at 1R', 'Move to BE after TP1', 'No Break Even (Hard SL)', 'Dynamic Discretion'].map((mgmt) => (
            <button
              key={mgmt}
              onClick={() => onChange({ tradeManagement: mgmt })}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                data.tradeManagement === mgmt
                  ? 'border-violet-500 bg-violet-500/10'
                  : isDarkMode ? 'border-zinc-800 hover:border-zinc-700' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{mgmt}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const ReviewStep: React.FC<StepProps & { onEdit: (step: number) => void }> = ({ isDarkMode, data, onEdit }) => (
  <div className="space-y-6">
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-500 to-zinc-600 flex items-center justify-center mx-auto mb-4">
        <BarChart3 size={32} className="text-white" />
      </div>
      <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Architect Review</h2>
      <p className={`mt-2 ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Verify your trading plan parameters</p>
    </div>

    <div className={`rounded-2xl border p-5 space-y-4 ${isDarkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-slate-200 bg-slate-50'}`}>
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Style', value: data.tradingStyle, step: 0 },
          { label: 'Risk', value: data.riskTolerance, step: 2 },
          { label: 'Limit', value: data.dailyTradeLimit, step: 2 },
          { label: 'HTF/LTF', value: `${data.analysisTimeframe}/${data.entryTimeframe}`, step: 5 }
        ].map(item => (
          <div key={item.label} className={`p-3 rounded-xl border ${isDarkMode ? 'border-zinc-800 bg-black/20' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] uppercase tracking-widest text-zinc-500">{item.label}</div>
              <button onClick={() => onEdit(item.step)} className="text-[10px] text-amber-500 hover:underline">Edit</button>
            </div>
            <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.value}</div>
          </div>
        ))}
      </div>
      <div className={`p-3 rounded-xl border ${isDarkMode ? 'border-zinc-800 bg-black/20' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">Core Motivation</div>
          <button onClick={() => onEdit(1)} className="text-[10px] text-amber-500 hover:underline">Edit</button>
        </div>
        <div className={`text-sm italic ${isDarkMode ? 'text-zinc-300' : 'text-slate-700'}`}>"{data.whyITrade || 'Not provided'}"</div>
      </div>
    </div>

  </div>
);
