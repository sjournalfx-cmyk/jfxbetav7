
import React from 'react';
import { 
  Bot,
  User,
  LayoutDashboard
} from 'lucide-react';
import { Trade, UserProfile, EASession, Goal, DailyBias } from '../types';
import AIChat from './AIChat';

interface MobileAppProps {
  isDarkMode: boolean;
  trades: Trade[];
  userProfile: UserProfile | null;
  eaSession: EASession | null;
  onLogout: () => void;
  onToggleTheme: () => void;
  goals?: Goal[];
  dailyBias?: DailyBias[];
}

const MobileApp: React.FC<MobileAppProps> = ({ 
  isDarkMode, 
  trades, 
  userProfile, 
  eaSession,
  onLogout,
  onToggleTheme,
  goals = [],
  dailyBias = []
}) => {
  return (
    <div className={`fixed inset-0 flex flex-col transition-colors duration-500 ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Main Content - Only AIChat */}
      <div className="flex-1 overflow-hidden relative">
        <AIChat 
          isDarkMode={isDarkMode} 
          trades={trades} 
          userProfile={userProfile} 
          goals={goals}
          dailyBias={dailyBias}
        />
      </div>
    </div>
  );
};

export default MobileApp;

