import React from 'react';
import { 
  Globe, 
  Wrench,
  AlertTriangle
} from 'lucide-react';
import { UserProfile } from '../types';

interface BrokerConnectProps {
  isDarkMode: boolean;
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => Promise<void>;
}

const BrokerConnect: React.FC<BrokerConnectProps> = ({ isDarkMode }) => {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-[#FF4F01]">
            <div className="p-2 rounded-lg bg-[#FF4F01]/10">
              <Globe size={24} />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Broker Sync <span className="text-xs font-normal opacity-40 ml-2">via MetaApi</span></h1>
          </div>
          <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
            Automate your trade journaling with MetaApi Cloud Bridge.
          </p>
        </div>

        {/* Maintenance Message */}
        <div className={`flex flex-col items-center justify-center p-12 rounded-3xl border ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200'} shadow-xl text-center space-y-6`}>
          <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Wrench size={40} />
          </div>
          
          <div className="max-w-md space-y-2">
            <h2 className="text-2xl font-bold">Under Maintenance</h2>
            <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
              We are currently upgrading our Broker Connect infrastructure to improve stability and performance. This feature will be available soon.
            </p>
          </div>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'} text-xs font-medium`}>
            <AlertTriangle size={14} />
            <span>Estimated Return: Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrokerConnect;
