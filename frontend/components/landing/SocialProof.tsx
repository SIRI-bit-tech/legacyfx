'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const COINS = [
  { symbol: 'btc', name: 'Bitcoin' },
  { symbol: 'eth', name: 'Ethereum' },
  { symbol: 'sol', name: 'Solana' },
  { symbol: 'usdt', name: 'Tether' },
  { symbol: 'doge', name: 'Dogecoin' },
];

const NAMES = [
  'Alexander W.', 'Sophia M.', 'Liam D.', 'Emma S.', 'Oliver H.', 'Isabella B.', 'Noah G.', 'Ava K.',
  'Sebastian V.', 'Mia J.', 'Arjun R.', 'Yuki T.', 'Fatima A.', 'David L.', 'Elena P.', 'Carlos M.',
  'Ji-woo K.', 'Anya S.', 'Omar F.', 'Chloe B.', 'Marcus T.', 'Zoe C.', 'Lucas N.', 'Amara E.'
];

const LOCATIONS = [
  'London, UK', 'New York, USA', 'Berlin, Germany', 'Tokyo, Japan', 
  'Sydney, Australia', 'Dubai, UAE', 'Paris, France', 'Toronto, Canada',
  'Seoul, South Korea', 'Singapore', 'Mumbai, India', 'Sao Paulo, Brazil'
];

export default function SocialProof() {
  const [data, setData] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const trigger = () => {
      const randomName = NAMES[Math.floor(Math.random() * NAMES.length)];
      const randomCoin = COINS[Math.floor(Math.random() * COINS.length)];
      const randomLoc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
      const randomAmt = (Math.random() * 5 + 0.1).toFixed(randomCoin.symbol === 'usdt' ? 2 : 4);
      const actionType = Math.random() > 0.5 ? 'withdrew' : 'deposited';

      setData({
        name: randomName,
        coin: randomCoin,
        location: randomLoc,
        amount: randomAmt,
        action: actionType
      });

      setIsVisible(true);
      setTimeout(() => setIsVisible(false), 6000);
    };

    const timer = setTimeout(trigger, 2000);
    const interval = setInterval(trigger, 10000); // Every 10 seconds

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  if (!data) return null;

  return (
    <div 
      className={`fixed bottom-6 left-6 z-[120] transition-all duration-700 ease-in-out transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
      }`}
    >
      <div className="bg-[#121619] border border-white/10 rounded-xl p-4 shadow-2xl flex items-center gap-4 min-w-[320px]">
        {/* Visual Indicator */}
        <div className="relative w-12 h-12 flex-shrink-0 bg-black rounded-full p-2 border border-white/5">
          <Image 
            src={`/icons/crypto/${data.coin.symbol}.svg`}
            alt=""
            width={32}
            height={32}
            className="w-full h-full object-contain"
          />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FCD535] rounded-full animate-pulse border-2 border-[#121619]" />
        </div>

        {/* Info Block */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-bold text-[#FCD535] bg-[#FCD535]/10 px-1.5 py-0.5 rounded uppercase tracking-tighter">Live</span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Institutional Stream</span>
          </div>
          
          <div className="text-sm font-medium text-white leading-tight">
            <span className="text-[#FCD535] font-extrabold">{data.name}</span>
            <span className="text-gray-400 mx-1">from</span>
            <span className="text-gray-300">{data.location}</span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className={`text-[11px] font-bold uppercase ${data.action === 'withdrew' ? 'text-red-400' : 'text-green-400'}`}>
              {data.action}
            </span>
            <span className="bg-white/5 px-2 py-0.5 rounded text-xs font-mono font-bold text-white">
              {data.amount} {data.coin.symbol.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Dismiss */}
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 text-gray-600 hover:text-white transition-colors"
        >
          <i className="pi pi-times text-[10px]" />
        </button>
      </div>
    </div>
  );
}
