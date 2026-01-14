
import React, { useState, useEffect } from 'react';
import { X, Calculator, DollarSign, Percent, TrendingUp } from 'lucide-react';

interface PositionSizeCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  initialBalance?: number;
  currencySymbol?: string;
}

import { Select } from './Select';

const PositionSizeCalculator: React.FC<PositionSizeCalculatorProps> = ({ 
  isOpen, 
  onClose, 
  isDarkMode, 
  initialBalance = 10000,
  currencySymbol = '$'
}) => {
  const [accountBalance, setAccountBalance] = useState(initialBalance);
  const [riskPercent, setRiskPercent] = useState(1);
  const [stopLossPips, setStopLossPips] = useState(10);
  const [pair, setPair] = useState('EURUSD');
  const [lotSize, setLotSize] = useState(0);
  const [riskAmount, setRiskAmount] = useState(0);

  // Sync with initialBalance when it changes (e.g. when modal opens)
  useEffect(() => {
    if (isOpen) {
      setAccountBalance(initialBalance);
    }
  }, [isOpen, initialBalance]);

  useEffect(() => {
    // Basic calculation assuming $10 per pip per lot (standard)
    // Formula: RiskAmount = Balance * (Risk% / 100)
    // Lots = RiskAmount / (StopLoss * PipValue)
    // Mock PipValue = 10 (approx for EURUSD)
    const riskAmt = accountBalance * (riskPercent / 100);
    setRiskAmount(riskAmt);

    const pipValue = 10; 
    // Adjust pip value mock logic based on pair roughly
    let adjustedPipValue = 10;
    if (pair.includes('JPY')) adjustedPipValue = 7; // rough approx
    if (pair.includes('GBP')) adjustedPipValue = 12; // rough approx
    
    if (stopLossPips > 0) {
        const lots = riskAmt / (stopLossPips * adjustedPipValue);
        setLotSize(parseFloat(lots.toFixed(2)));
    } else {
        setLotSize(0);
    }

  }, [accountBalance, riskPercent, stopLossPips, pair]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div 
        className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-[#18181b] border border-[#27272a] text-white' : 'bg-white text-slate-900'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between p-5 border-b ${isDarkMode ? 'border-[#27272a]' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                    <Calculator size={20} />
                </div>
                <h3 className="font-bold text-lg">Position Calculator</h3>
            </div>
            <button onClick={onClose} className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors`}>
                <X size={20} />
            </button>
        </div>

        <div className="p-6 space-y-6">
            <div>
                <label className="text-xs font-bold uppercase opacity-50 mb-1.5 block">Account Balance</label>
                <div className={`flex items-center px-4 py-3 rounded-xl border focus-within:ring-2 focus-within:ring-blue-500/20 ${isDarkMode ? 'bg-[#09090b] border-[#27272a]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-gray-400 mr-2 font-mono font-bold">{currencySymbol}</span>
                    <input 
                        type="number" 
                        value={accountBalance}
                        onChange={(e) => setAccountBalance(parseFloat(e.target.value) || 0)}
                        className="bg-transparent outline-none w-full font-mono font-medium"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold uppercase opacity-50 mb-1.5 block">Risk Percentage</label>
                    <div className={`flex items-center px-4 py-3 rounded-xl border focus-within:ring-2 focus-within:ring-blue-500/20 ${isDarkMode ? 'bg-[#09090b] border-[#27272a]' : 'bg-slate-50 border-slate-200'}`}>
                        <input 
                            type="number" 
                            value={riskPercent}
                            onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 0)}
                            className="bg-transparent outline-none w-full font-mono font-medium"
                        />
                        <Percent size={14} className="text-gray-400 ml-1" />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold uppercase opacity-50 mb-1.5 block">Stop Loss (Pips)</label>
                    <div className={`flex items-center px-4 py-3 rounded-xl border focus-within:ring-2 focus-within:ring-blue-500/20 ${isDarkMode ? 'bg-[#09090b] border-[#27272a]' : 'bg-slate-50 border-slate-200'}`}>
                        <input 
                            type="number" 
                            value={stopLossPips}
                            onChange={(e) => setStopLossPips(parseFloat(e.target.value) || 0)}
                            className="bg-transparent outline-none w-full font-mono font-medium"
                        />
                    </div>
                </div>
            </div>

            <div>
                 <label className="text-xs font-bold uppercase opacity-50 mb-1.5 block">Currency Pair</label>
                 <Select 
                    value={pair}
                    onChange={setPair}
                    options={[
                        { value: 'EURUSD', label: 'EURUSD' },
                        { value: 'GBPUSD', label: 'GBPUSD' },
                        { value: 'USDJPY', label: 'USDJPY' },
                        { value: 'XAUUSD', label: 'XAUUSD (Gold)' },
                        { value: 'US30', label: 'US30 (Indices)' },
                    ]}
                    isDarkMode={isDarkMode}
                 />
            </div>

            <div className={`p-5 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-blue-900/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
                 <div>
                     <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Standard Lots</p>
                     <h2 className="text-3xl font-bold font-mono tracking-tight">{lotSize}</h2>
                 </div>
                 <div className="text-right">
                     <p className="text-xs font-bold opacity-50 uppercase tracking-wider mb-1">Risk Amount</p>
                     <p className="text-lg font-bold font-mono text-rose-500">{currencySymbol}{riskAmount.toFixed(2)}</p>
                 </div>
            </div>

            <button onClick={onClose} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all">
                Close Calculator
            </button>
        </div>
      </div>
    </div>
  );
};

export default PositionSizeCalculator;
