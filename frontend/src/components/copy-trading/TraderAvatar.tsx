'use client';

import { useState } from 'react';

interface Trader {
  username?: string;
  avatar_url?: string;
}

export const TraderAvatar = ({ trader, className = "" }: { trader: Trader; className?: string }) => {
  const [imgError, setImgError] = useState(false);
  
  const defaultClassName = "w-16 h-16 rounded-3xl object-cover border border-white/10 group-hover:scale-105 transition-transform duration-500";
  const finalClassName = className || defaultClassName;

  if (trader.avatar_url && !imgError) {
    return (
      <img
        src={trader.avatar_url}
        alt={trader.username}
        onError={() => setImgError(true)}
        className={finalClassName}
      />
    );
  }

  return (
    <div className={`${finalClassName} bg-gradient-to-br from-[#1E2329] to-[#0B0E11] flex items-center justify-center text-2xl font-black text-[#FCD535] border border-white/10 group-hover:scale-105 transition-transform duration-500`}>
      {trader.username?.charAt(0).toUpperCase() || '?'}
    </div>
  );
};
