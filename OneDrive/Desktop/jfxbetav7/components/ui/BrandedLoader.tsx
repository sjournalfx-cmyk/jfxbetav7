import React from 'react';

interface BrandedLoaderProps {
  label?: string;
  isDarkMode?: boolean;
}

export const BrandedLoader: React.FC<BrandedLoaderProps> = ({ 
  label, 
  isDarkMode = true 
}) => {
  return (
    <div className={`flex h-dvh w-full items-center justify-center bg-[#000000] text-white`}>
      <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-700">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-zinc-800 rounded-full"></div>
          <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-[#FF4F01] rounded-full animate-spin"></div>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black tracking-tighter">JFX<span className="text-[#FF4F01]">JOURNAL</span></h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 mt-2">{label}</p>
        </div>
      </div>
    </div>
  );
};
