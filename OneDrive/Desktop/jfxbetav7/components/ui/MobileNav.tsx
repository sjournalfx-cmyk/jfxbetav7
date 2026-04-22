import React from 'react';
import { 
    LayoutDashboard, PlusCircle, History, BarChart2,
    FileText
} from 'lucide-react';

interface MobileNavItem {
    id: string;
    icon: React.ElementType;
    label: string;
    onClick?: () => void;
}

interface MobileNavProps {
    isDarkMode: boolean;
    currentView: string;
    onViewChange: (view: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
    isDarkMode,
    currentView,
    onViewChange
}) => {
    const navItems: MobileNavItem[] = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
        { id: 'log-trade', icon: PlusCircle, label: 'Log' },
        { id: 'history', icon: History, label: 'Journal' },
        { id: 'analytics', icon: BarChart2, label: 'Analytics' },
        { id: 'notes', icon: FileText, label: 'Notes' },
    ];

    return (
        <nav className={`
            fixed bottom-0 left-0 right-0 z-[100] sm:hidden
            ${isDarkMode 
                ? 'bg-[#0a0a0a]/95 border-t border-zinc-800' 
                : 'bg-white/95 border-t border-slate-200'
            }
            backdrop-blur-lg
        `}>
            <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onViewChange(item.id)}
                            className={`
                                flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all
                                ${isActive
                                    ? 'text-[#FF4F01]'
                                    : isDarkMode
                                        ? 'text-zinc-500'
                                        : 'text-slate-500'
                                }
                            `}
                        >
                            <div className={`
                                p-2 rounded-xl transition-all
                                ${isActive
                                    ? 'bg-[#FF4F01]/10'
                                    : ''
                                }
                            `}>
                                <Icon 
                                    size={20} 
                                    strokeWidth={isActive ? 2.5 : 2} 
                                />
                            </div>
                            <span className={`text-[10px] font-bold ${isActive ? '' : isDarkMode ? '' : ''}`}>
                                {item.label}
                            </span>
                            {isActive && (
                                <div className="absolute bottom-0 w-8 h-0.5 bg-[#FF4F01] rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export const MobileQuickActions: React.FC<{
    isDarkMode: boolean;
    onOpenQuickLog: () => void;
}> = ({ isDarkMode, onOpenQuickLog }) => {
    return (
        <div className={`
            fixed bottom-20 right-4 z-[90] sm:hidden
            flex flex-col gap-3
        `}>
            <button
                onClick={onOpenQuickLog}
                className={`
                    w-14 h-14 rounded-full shadow-xl flex items-center justify-center
                    bg-[#FF4F01] text-white
                `}
            >
                <PlusCircle size={24} />
            </button>
        </div>
    );
};

export const MobilePageHeader: React.FC<{
    isDarkMode: boolean;
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    onBack?: () => void;
}> = ({ isDarkMode, title, subtitle, actions, onBack }) => {
    return (
        <header className={`
            sticky top-0 z-40 px-4 py-3 border-b
            ${isDarkMode 
                ? 'bg-[#09090b]/95 border-zinc-800' 
                : 'bg-white/95 border-slate-200'
            }
            backdrop-blur-lg sm:hidden
        `}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className={`
                                p-2 -ml-2 rounded-lg
                                ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}
                            `}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                        </button>
                    )}
                    <div>
                        <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {title}
                        </h1>
                        {subtitle && (
                            <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
                {actions && (
                    <div className="flex items-center gap-2">
                        {actions}
                    </div>
                )}
            </div>
        </header>
    );
};

export const MobileCard: React.FC<{
    isDarkMode: boolean;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}> = ({ isDarkMode, children, className = '', onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`
                p-4 rounded-2xl border transition-all
                ${isDarkMode 
                    ? 'bg-[#18181b] border-[#27272a]' 
                    : 'bg-white border-slate-100 shadow-sm'
                }
                ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}
                ${className}
            `}
        >
            {children}
        </div>
    );
};

export const MobileStats: React.FC<{
    isDarkMode: boolean;
    stats: Array<{
        label: string;
        value: string | number;
        trend?: number;
        color?: string;
    }>;
}> = ({ isDarkMode, stats }) => {
    return (
        <div className={`grid grid-cols-2 gap-3 ${isDarkMode ? '' : ''}`}>
            {stats.map((stat, index) => (
                <div
                    key={index}
                    className={`
                        p-4 rounded-xl border
                        ${isDarkMode 
                            ? 'bg-[#18181b] border-[#27272a]' 
                            : 'bg-white border-slate-100'
                        }
                    `}
                >
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                        isDarkMode ? 'text-zinc-500' : 'text-slate-500'
                    }`}>
                        {stat.label}
                    </p>
                    <p className={`text-xl font-bold font-mono ${
                        stat.color 
                            ? stat.color 
                            : isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}>
                        {stat.value}
                    </p>
                    {stat.trend !== undefined && (
                        <p className={`text-[10px] font-bold mt-1 ${
                            stat.trend >= 0 ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                            {stat.trend >= 0 ? '+' : ''}{stat.trend}%
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
};
