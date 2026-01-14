
import React, { useState } from 'react';
import {
  User, Globe, Wallet, DollarSign, Zap,
  Shield, Bell, Save, Trash2, CreditCard,
  ChevronRight, ArrowRight, CheckCircle2,
  Lock, Mail, Smartphone, ExternalLink,
  Flame, Award, Briefcase, Camera, Palette,
  Sun, Moon, Copy, Check, Crown, HelpCircle,
  MessageSquare, Youtube, Github, LifeBuoy, Medal
} from 'lucide-react';
import { UserProfile } from '../types';
import { APP_CONSTANTS } from '../lib/constants';
import { Select } from './Select';

// Journaler Bots (Free Tier)
const freeAvatars = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=1&backgroundColor=f1f5f9',
  'https://api.dicebear.com/7.x/bottts/svg?seed=2&backgroundColor=f1f5f9',
  'https://api.dicebear.com/7.x/bottts/svg?seed=3&backgroundColor=f1f5f9',
  'https://api.dicebear.com/7.x/bottts/svg?seed=4&backgroundColor=f1f5f9',
  'https://api.dicebear.com/7.x/bottts/svg?seed=5&backgroundColor=f1f5f9',
  'https://api.dicebear.com/7.x/bottts/svg?seed=6&backgroundColor=f1f5f9',
];

// AI Analysts (Pro Tier)
const proAvatars = [
  'https://api.dicebear.com/8.x/bottts-neutral/svg?seed=1&backgroundColor=e9d5ff&primaryColor=a855f7,c026d3,d8b4fe&backgroundType=gradientLinear',
  'https://api.dicebear.com/8.x/bottts-neutral/svg?seed=2&backgroundColor=e9d5ff&primaryColor=a855f7,c026d3,d8b4fe&backgroundType=gradientLinear',
  'https://api.dicebear.com/8.x/thumbs/svg?seed=1&backgroundColor=e9d5ff,d8b4fe,c084fc&backgroundType=gradientLinear',
  'https://api.dicebear.com/8.x/identicon/svg?seed=1&backgroundColor=fefce8,fef9c3,fef08a&backgroundType=gradientLinear',
  'https://api.dicebear.com/8.x/identicon/svg?seed=2&backgroundColor=fefce8,fef9c3,fef08a&backgroundType=gradientLinear',
  'https://api.dicebear.com/8.x/identicon/svg?seed=3&backgroundColor=fefce8,fef9c3,fef08a&backgroundType=gradientLinear',
];

// Elite AI Masters (Premium Tier)
const premiumAvatars = [
  'https://api.dicebear.com/7.x/lorelei/svg?seed=1&backgroundColor=c7d2fe',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=2&backgroundColor=c7d2fe',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=3&backgroundColor=c7d2fe',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=1&backgroundColor=c7d2fe',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=2&backgroundColor=c7d2fe',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=3&backgroundColor=c7d2fe',
];

interface SettingsProps {
  isDarkMode: boolean;
  userProfile: UserProfile;
  userEmail?: string;
  onUpdateProfile: (profile: UserProfile) => Promise<void>;
  onLogout: () => void;
  onToggleTheme: () => void;
  tradesThisMonth?: number;
  totalNotes?: number;
  totalImages?: number;
  tradesCount?: number;
  initialTab?: 'profile' | 'account' | 'appearance' | 'billing' | 'security' | 'help';
}

const Settings: React.FC<SettingsProps> = ({ 
  isDarkMode, 
  userProfile, 
  userEmail,
  onUpdateProfile, 
  onLogout, 
  onToggleTheme,
  tradesThisMonth = 0,
  totalNotes = 0,
  totalImages = 0,
  tradesCount = 0,
  initialTab = 'profile'
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'appearance' | 'billing' | 'security' | 'help'>(initialTab);
  const [formData, setFormData] = useState<UserProfile>({ ...userProfile });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveStatus] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const getTesterRank = () => {
    if (tradesCount >= 30) return { label: 'Elite Tester', level: 4, next: 'Max Level', color: 'text-amber-400', bg: 'bg-amber-400/10', bar: 'bg-amber-400' };
    if (tradesCount >= 15) return { label: 'Beta Specialist', level: 3, next: '30 trades', color: 'text-purple-400', bg: 'bg-purple-400/10', bar: 'bg-purple-400' };
    if (tradesCount >= 5) return { label: 'Active Tester', level: 2, next: '15 trades', color: 'text-indigo-400', bg: 'bg-indigo-400/10', bar: 'bg-indigo-400' };
    return { label: 'Beta Scout', level: 1, next: '5 trades', color: 'text-emerald-400', bg: 'bg-emerald-400/10', bar: 'bg-emerald-400' };
  };

  const rank = getTesterRank();

  const handleFeedbackSubmit = async () => {
    setIsSubmittingFeedback(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mark feedback as sent in profile
    const updatedProfile = { ...formData, feedbackSent: true };
    await onUpdateProfile(updatedProfile);
    setFormData(updatedProfile);
    
    setIsSubmittingFeedback(false);
    setFeedbackSuccess(true);
    setTimeout(() => setFeedbackSuccess(false), 5000);
  };

  // Update active tab when initialTab prop changes
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Live Theme Preview
  React.useEffect(() => {
    if (activeTab === 'appearance' && formData.plan === 'PREMIUM (MASTERS)') {
      document.body.classList.remove('theme-midnight');
      if (formData.themePreference && formData.themePreference !== 'default') {
        document.body.classList.add(`theme-${formData.themePreference}`);
      }
    }
    
    // Restore original theme when leaving tab or unmounting
    return () => {
      document.body.classList.remove('theme-midnight');
      if (userProfile?.themePreference && userProfile.themePreference !== 'default') {
        document.body.classList.add(`theme-${userProfile.themePreference}`);
      }
    };
  }, [formData.themePreference, activeTab, userProfile?.themePreference, formData.plan]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateProfile(formData);
      setSaveStatus('Profile updated successfully!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      setSaveStatus('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyKey = () => {
    if (formData.syncKey) {
      navigator.clipboard.writeText(formData.syncKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const inputClasses = `w-full bg-transparent border-b-2 py-3 text-lg font-bold outline-none transition-all ${isDarkMode
    ? 'border-zinc-800 focus:border-[#FF4F01] text-white'
    : 'border-zinc-200 focus:border-[#FF4F01] text-zinc-900'
    }`;

  const labelClasses = "text-[10px] font-black uppercase tracking-[0.2em] opacity-50 block mb-1";

  return (
    <div className={`w-full h-full overflow-hidden flex flex-col p-8 font-sans ${isDarkMode ? 'bg-[#09090b] text-zinc-200' : 'bg-slate-50 text-slate-900'}`}>
      <header className="mb-10">
        <h1 className="text-4xl font-black tracking-tight mb-2">Settings</h1>
        <p className="text-sm opacity-50 font-medium text-zinc-500">Manage your trading persona and application preferences.</p>
      </header>

      <div className="flex-1 flex gap-12 overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-64 flex flex-col gap-2 shrink-0">
          {[
            { id: 'profile', label: 'Trading Persona', icon: User },
            { id: 'account', label: 'Account Config', icon: Briefcase },
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'billing', label: 'Plan & Billing', icon: CreditCard },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'help', label: 'Help & Feedback', icon: HelpCircle },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id
                ? 'bg-[#FF4F01] text-white shadow-lg shadow-[#FF4F01]/20'
                : `hover:bg-black/5 dark:hover:bg-white/5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`
                }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}

          <div className="mt-auto pt-6 border-t border-dashed border-zinc-800">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-rose-500 hover:bg-rose-500/10 transition-all"
            >
              <Trash2 size={18} /> Logout Account
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className={`flex-1 rounded-3xl border overflow-y-auto custom-scrollbar ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-100 shadow-xl'}`}>
          <div className={`p-10 ${activeTab === 'profile' ? 'max-w-full' : 'max-w-2xl'}`}>
            {activeTab === 'profile' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                  {/* Left Column: Profile Info */}
                  <div className="xl:col-span-5 space-y-10">
                    <div className="flex items-center gap-6">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-2xl overflow-hidden">
                          {formData.avatarUrl ? (
                            <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <User size={48} />
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black mb-1">{formData.name}</h3>
                        <p className="text-xs font-bold text-[#FF4F01] uppercase tracking-widest">{formData.plan}</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="group">
                        <label className={labelClasses}>Full Name</label>
                        <input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className={inputClasses}
                        />
                      </div>
                      <div className="group">
                        <label className={labelClasses}>Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                          <input
                            value={userEmail || ''}
                            readOnly
                            className={inputClasses + " pl-8 opacity-60 cursor-not-allowed"}
                          />
                        </div>
                      </div>
                      <div className="group">
                        <label className={labelClasses}>Country</label>
                        <div className="relative">
                          <Globe className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                          <input
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            className={inputClasses + " pl-8"}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="group">
                          <label className={labelClasses}>Trading Style</label>
                          <Select
                            value={formData.tradingStyle}
                            onChange={(val) => setFormData({ ...formData, tradingStyle: val as any })}
                            options={['Scalper', 'Day Trader', 'Swing Trader', 'Investor'].map(s => ({ value: s, label: s }))}
                            isDarkMode={isDarkMode}
                          />
                        </div>
                        <div className="group">
                          <label className={labelClasses}>Experience Level</label>
                          <Select
                            value={formData.experienceLevel}
                            onChange={(val) => setFormData({ ...formData, experienceLevel: val as any })}
                            options={['Beginner', 'Intermediate', 'Advanced', 'Pro'].map(s => ({ value: s, label: s }))}
                            isDarkMode={isDarkMode}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Avatar Selection */}
                  <div className="xl:col-span-7 space-y-6">
                    <h3 className="text-lg font-bold mb-2">Choose Your Avatar</h3>

                    {formData.plan === 'FREE TIER (JOURNALER)' && (
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest opacity-60">Free Tier (Journaler Bots)</h4>
                        <div className="grid grid-cols-6 gap-4">
                          {freeAvatars.map((url, i) => (
                            <button
                              key={i}
                              onClick={() => setFormData({ ...formData, avatarUrl: url })}
                              className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 ${formData.avatarUrl === url ? 'border-[#FF4F01] ring-2 ring-[#FF4F01]/20' : 'border-transparent opacity-80 hover:opacity-100'}`}
                            >
                              <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {formData.plan === 'PRO TIER (ANALYSTS)' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold uppercase tracking-widest opacity-60">Pro Tier (Analysts)</h4>
                          <div className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase">Pro</div>
                        </div>
                        <div className="grid grid-cols-6 gap-4">
                          {proAvatars.map((url, i) => (
                            <button
                              key={i}
                              onClick={() => setFormData({ ...formData, avatarUrl: url })}
                              className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 ${formData.avatarUrl === url ? 'border-[#FF4F01] ring-2 ring-[#FF4F01]/20' : 'border-transparent opacity-80 hover:opacity-100'}`}
                            >
                              <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {formData.plan === 'PREMIUM (MASTERS)' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold uppercase tracking-widest opacity-60">Premium Tier (Elite Masters)</h4>
                          <div className="px-2 py-0.5 rounded bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-black uppercase">Elite</div>
                        </div>
                        <div className="grid grid-cols-6 gap-4">
                          {premiumAvatars.map((url, i) => (
                            <button
                              key={i}
                              onClick={() => setFormData({ ...formData, avatarUrl: url })}
                              className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 ${formData.avatarUrl === url ? 'border-[#FF4F01] ring-2 ring-[#FF4F01]/20' : 'border-transparent opacity-80 hover:opacity-100'}`}
                            >
                              <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 gap-10">
                  <div className="group">
                    <label className={labelClasses}>Primary Account Name</label>
                    <input
                      value={formData.accountName}
                      onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                      className={inputClasses}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-10">
                    <div className="group">
                      <label className={labelClasses}>Base Currency</label>
                      <Select
                        value={formData.currency}
                        onChange={(val) => {
                          const selected = APP_CONSTANTS.CURRENCIES.find(c => c.code === val);
                          if (selected) {
                            setFormData({ ...formData, currency: selected.code, currencySymbol: selected.symbol });
                          }
                        }}
                        options={APP_CONSTANTS.CURRENCIES.map(c => ({ value: c.code, label: `${c.code} (${c.symbol})` }))}
                        isDarkMode={isDarkMode}
                      />
                    </div>
                    <div className="group">
                      <label className={labelClasses}>Initial Balance</label>
                      <div className="relative">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[#FF4F01] font-bold text-xl">{formData.currencySymbol}</span>
                        <input
                          type="number"
                          value={formData.initialBalance}
                          onChange={(e) => setFormData({ ...formData, initialBalance: parseFloat(e.target.value) })}
                          className={inputClasses + " pl-8 font-mono"}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="group">
                    <label className={labelClasses}>Sync Method</label>
                    <div className="flex items-center gap-3 pt-3">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${formData.eaConnected ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'}`}>
                        {formData.syncMethod === 'EA_CONNECT' ? 'EA Sync Active' : 'Manual Entry'}
                      </span>
                      <button className="text-[10px] font-black text-[#FF4F01] uppercase underline">Change</button>
                    </div>
                  </div>

                  {formData.syncMethod === 'EA_CONNECT' && (
                    <div className="space-y-6">
                      <div className={`p-6 rounded-2xl border-2 border-dashed ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 block">Your Active Sync Key</label>
                        <div className="flex items-center gap-4">
                          <div className="font-mono text-xl font-black tracking-wider text-[#FF4F01]">
                            {formData.syncKey || 'NOT_GENERATED'}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleCopyKey}
                              className={`p-2 rounded-lg transition-all ${copiedKey ? 'bg-emerald-500 text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500'}`}
                              title="Copy Sync Key"
                            >
                              {copiedKey ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${formData.eaConnected ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                              {formData.eaConnected ? 'Connected' : 'Disconnected'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-sm">Auto-Journal MT5 Trades</p>
                            <p className="text-xs opacity-50">Automatically add closed trades to your journal.</p>
                          </div>
                          <button
                            onClick={() => setFormData({ ...formData, autoJournal: !formData.autoJournal })}
                            className={`w-12 h-6 rounded-full transition-all relative ${formData.autoJournal ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.autoJournal ? 'right-1' : 'left-1'}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between p-6 rounded-2xl border border-dashed border-zinc-800">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-600'}`}>
                        {isDarkMode ? <Moon size={24} /> : <Sun size={24} />}
                      </div>
                      <div>
                        <p className="text-lg font-bold">Display Mode</p>
                        <p className="text-sm opacity-50">{isDarkMode ? 'Dark mode' : 'Light mode'} is currently active.</p>
                      </div>
                    </div>
                    <button
                      onClick={onToggleTheme}
                      className={`w-14 h-8 rounded-full relative transition-all ${isDarkMode ? 'bg-indigo-600' : 'bg-amber-500'}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-lg ${isDarkMode ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  {formData.plan === 'PREMIUM (MASTERS)' && (
                    <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-3 mb-6">
                        <Crown size={20} className="text-amber-500" />
                        <h3 className="text-lg font-bold">Premium Themes</h3>
                        <div className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest border border-amber-500/20 ml-auto">Masters Exclusive</div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { id: 'default', label: 'Obsidian', desc: 'Standard dark aesthetic.', bg: 'bg-[#050505]', accent: 'bg-indigo-500' },
                          { id: 'midnight', label: 'Midnight Blue', desc: 'Deep ocean atmosphere.', bg: 'bg-[#020617]', accent: 'bg-sky-500' },
                        ].map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setFormData({ ...formData, themePreference: t.id as any })}
                            className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-3 group relative overflow-hidden ${formData.themePreference === t.id ? 'border-[#FF4F01] bg-[#FF4F01]/5' : 'border-transparent hover:border-zinc-700'}`}
                          >
                            <div className={`w-full h-20 rounded-xl ${t.bg} border border-white/10 relative overflow-hidden p-3`}>
                               <div className={`w-1/2 h-2 rounded-full ${t.accent} opacity-50 mb-2`} />
                               <div className="w-1/3 h-2 rounded-full bg-white/10 mb-2" />
                               <div className="w-2/3 h-2 rounded-full bg-white/10" />
                               {formData.themePreference === t.id && (
                                 <div className="absolute top-2 right-2 text-[#FF4F01]">
                                   <CheckCircle2 size={16} />
                                 </div>
                               )}
                            </div>
                            <div>
                              <p className="font-bold text-sm">{t.label}</p>
                              <p className="text-[10px] opacity-50 font-medium">{t.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <Zap size={20} className="text-indigo-500" />
                      <h3 className="text-lg font-bold">Performance</h3>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-black/10 dark:bg-white/5">
                      <div className="max-w-[80%]">
                        <p className="text-sm font-bold">Keep Charts Alive in Background</p>
                        <p className="text-xs opacity-50">Maintains chart state (drawings) when switching pages. Disable if the app feels slow.</p>
                      </div>
                      <button
                        onClick={() => setFormData({ ...formData, keepChartsAlive: !formData.keepChartsAlive })}
                        className={`w-12 h-6 rounded-full transition-all relative ${formData.keepChartsAlive ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.keepChartsAlive ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={`p-8 rounded-[32px] border-2 border-[#FF4F01] bg-[#FF4F01]/5 relative overflow-hidden`}>
                  <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-[#FF4F01]/20 rounded-full blur-3xl" />
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-4 opacity-60">Current Plan</h4>
                      <h3 className="text-4xl font-black mb-2">{formData.plan}</h3>
                      <p className="text-sm font-medium opacity-60 mb-8">
                        {formData.plan === 'FREE TIER (JOURNALER)' && 'Lightweight journaling for beginners.'}
                        {formData.plan === 'PRO TIER (ANALYSTS)' && 'Data-driven automated trading.'}
                        {formData.plan === 'PREMIUM (MASTERS)' && 'Full-capacity logging & advanced mapping.'}
                      </p>
                    </div>
                    <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                      <Award size={32} className="text-[#FF4F01]" />
                    </div>
                  </div>
                </div>

                {/* Detailed Usage Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="text-[10px] font-black uppercase tracking-widest opacity-40">Monthly Trades</h5>
                      <span className="text-[10px] font-bold text-indigo-500">
                        {formData.plan === 'PREMIUM (MASTERS)' ? 'Unlimited' : `${tradesThisMonth} / ${formData.plan === 'PRO TIER (ANALYSTS)' ? 500 : 50}`}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-black/10 dark:bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                        style={{ width: `${formData.plan === 'PREMIUM (MASTERS)' ? 0 : Math.min(100, (tradesThisMonth / (formData.plan === 'PRO TIER (ANALYSTS)' ? 500 : 50)) * 100)}%` }} 
                      />
                    </div>
                  </div>
                  <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="text-[10px] font-black uppercase tracking-widest opacity-40">Notebook Slots</h5>
                      <span className="text-[10px] font-bold text-purple-500">
                        {formData.plan === 'FREE TIER (JOURNALER)' ? `${totalNotes} / 1` : 'Unlimited'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-black/10 dark:bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full transition-all duration-1000" 
                        style={{ width: `${formData.plan === 'FREE TIER (JOURNALER)' ? Math.min(100, (totalNotes / 1) * 100) : 0}%` }} 
                      />
                    </div>
                  </div>
                  <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="text-[10px] font-black uppercase tracking-widest opacity-40">Images Used</h5>
                      <span className="text-[10px] font-bold text-orange-500">
                        {formData.plan === 'FREE TIER (JOURNALER)' ? '0 / 0' : (formData.plan === 'PREMIUM (MASTERS)' ? 'Unlimited' : `${totalImages} / 1000`)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-black/10 dark:bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 rounded-full transition-all duration-1000" 
                        style={{ width: `${formData.plan === 'PREMIUM (MASTERS)' ? 0 : (formData.plan === 'FREE TIER (JOURNALER)' ? 0 : Math.min(100, (totalImages / 1000) * 100))}%` }} 
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <h4 className="text-xs font-black uppercase tracking-widest opacity-40">Available Plans</h4>
                  {[
                    { 
                      id: 'FREE TIER (JOURNALER)', 
                      price: '0', 
                      desc: 'Manual trade logging & daily bias.',
                      features: ['50 trades / mo', 'Max 1 note', 'Manual Entry']
                    },
                    { 
                      id: 'PRO TIER (ANALYSTS)', 
                      price: '0', 
                      desc: 'Free for Beta Testers - EA Sync & Goals.',
                      features: ['500 trades / mo', '1 Chart Layout', 'Desktop Bridge']
                    },
                    { 
                      id: 'PREMIUM (MASTERS)', 
                      price: '0', 
                      desc: 'Free for Beta Testers - Full-capacity logging.',
                      features: ['Unlimited trades', 'Custom Chart Layouts', 'Unlimited Notes']
                    }
                  ].map((plan) => (
                    <div key={plan.id} className={`p-6 rounded-2xl border flex items-center justify-between transition-all ${formData.plan === plan.id ? 'border-[#FF4F01] bg-[#FF4F01]/5' : isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex gap-4 items-center">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.plan === plan.id ? 'bg-[#FF4F01] text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                          {plan.id === 'PREMIUM (MASTERS)' ? <Crown size={20} /> : <Zap size={20} />}
                        </div>
                        <div>
                          <h5 className="font-bold text-sm">{plan.id}</h5>
                          <p className="text-xs opacity-50">{plan.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          {plan.price === '0' && plan.id !== 'FREE TIER (JOURNALER)' ? (
                            <p className="text-sm font-black text-[#FF4F01]">FREE (BETA)</p>
                          ) : (
                            <>
                              <p className="text-lg font-black">${plan.price}</p>
                              <p className="text-[10px] font-bold uppercase opacity-40">/month</p>
                            </>
                          )}
                        </div>
                        <button 
                          onClick={() => setFormData({ ...formData, plan: plan.id })}
                          disabled={formData.plan === plan.id}
                          className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${formData.plan === plan.id ? 'bg-zinc-800 text-zinc-500 cursor-default' : 'bg-[#FF4F01] text-white hover:scale-105 shadow-lg shadow-[#FF4F01]/20'}`}
                        >
                          {formData.plan === plan.id ? 'Active' : 'Switch'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) }

            {activeTab === 'security' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 rounded-2xl border border-dashed border-zinc-800">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl"><Lock size={20} /></div>
                      <div>
                        <p className="text-sm font-bold">Two-Factor Auth</p>
                        <p className="text-xs opacity-50">Enabled via Authenticator App</p>
                      </div>
                    </div>
                    <button className="text-[10px] font-black uppercase underline text-rose-500">Disable</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'help' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Tester Progress Section */}
                <div className={`p-8 rounded-3xl border relative overflow-hidden ${isDarkMode ? 'bg-[#1a1b23] border-zinc-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Medal size={120} className={rank.color} />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`p-3 rounded-2xl ${rank.bg} ${rank.color}`}>
                        <Medal size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black tracking-tight">Tester Progress</h3>
                        <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Rank: {rank.label}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-bold">Progress to next rank</span>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Next: {rank.next}</span>
                      </div>
                      <div className="h-3 w-full bg-black/20 dark:bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${rank.bar}`} 
                          style={{ width: `${Math.min(100, (tradesCount / (rank.level === 1 ? 5 : rank.level === 2 ? 15 : 30)) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-40">
                        <span>{tradesCount} trades logged</span>
                        <span>Level {rank.level} / 4</span>
                      </div>
                    </div>

                    <div className="mt-8 flex gap-4">
                      <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${formData.feedbackSent ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'}`}>
                        {formData.feedbackSent ? '✓ Feedback Contribution' : '○ Feedback Needed'}
                      </div>
                      <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${tradesCount >= 5 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'}`}>
                        {tradesCount >= 5 ? '✓ Active Reporter' : '○ Not Enough Data'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Support Resources */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: 'Documentation', icon: HelpCircle, color: 'text-indigo-500', desc: 'Learn how to master JournalFX.', link: '#' },
                    { title: 'Video Tutorials', icon: Youtube, color: 'text-red-500', desc: 'Watch step-by-step guides.', link: '#' },
                    { title: 'Community Discord', icon: MessageSquare, color: 'text-blue-500', desc: 'Join other traders.', link: '#' },
                    { title: 'Technical Support', icon: LifeBuoy, color: 'text-emerald-500', desc: 'Get help with your account.', link: '#' },
                  ].map((item, i) => (
                    <a
                      key={i}
                      href={item.link}
                      className={`p-6 rounded-2xl border transition-all hover:scale-[1.02] ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <div className={`p-3 rounded-xl bg-black/5 dark:bg-white/5 ${item.color}`}>
                          <item.icon size={20} />
                        </div>
                        <h4 className="font-bold text-sm">{item.title}</h4>
                      </div>
                      <p className="text-xs opacity-50">{item.desc}</p>
                    </a>
                  ))}
                </div>

                {/* Feedback Form Section */}
                <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-3 mb-6">
                    <MessageSquare size={20} className="text-[#FF4F01]" />
                    <h3 className="text-lg font-bold">Send Feedback</h3>
                  </div>
                  
                  {feedbackSuccess ? (
                    <div className="py-12 flex flex-col items-center text-center animate-in fade-in zoom-in-95">
                      <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 size={32} />
                      </div>
                      <h4 className="text-xl font-bold mb-2">Feedback Received!</h4>
                      <p className="text-sm opacity-50 max-w-xs">Thank you for contributing to the JFX Beta. Your input has been logged.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="group">
                        <label className={labelClasses}>Subject</label>
                        <input
                          placeholder="Feature request, bug report, etc."
                          className={inputClasses}
                        />
                      </div>
                      <div className="group">
                        <label className={labelClasses}>Message</label>
                        <textarea
                          placeholder="Tell us what's on your mind..."
                          rows={4}
                          className={`w-full bg-transparent border-b-2 py-3 text-sm font-medium outline-none transition-all resize-none ${isDarkMode
                            ? 'border-zinc-800 focus:border-[#FF4F01] text-white'
                            : 'border-zinc-200 focus:border-[#FF4F01] text-zinc-900'
                            }`}
                        />
                      </div>
                      <button 
                        onClick={handleFeedbackSubmit}
                        disabled={isSubmittingFeedback}
                        className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2"
                      >
                        {isSubmittingFeedback ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending...
                          </>
                        ) : 'Submit Feedback'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="mt-16 pt-8 border-t border-zinc-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {saveMessage && (
                  <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold animate-in fade-in slide-in-from-left-2">
                    <CheckCircle2 size={14} /> {saveMessage}
                  </div>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-3 px-10 py-4 bg-[#FF4F01] text-white rounded-2xl font-black text-sm shadow-2xl shadow-[#FF4F01]/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSaving ? 'Saving Changes...' : 'Save Settings'} <Save size={18} />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
