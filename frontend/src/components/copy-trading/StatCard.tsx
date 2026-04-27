'use client';

interface StatItem {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}

export const StatCard = ({ stat }: { stat: StatItem }) => {
  return (
    <div className="group relative bg-[#181A20] border border-white/5 p-8 rounded-[2.5rem] hover:border-[#FCD535]/30 transition-all duration-500 shadow-xl overflow-hidden">
      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-white/5 ${stat.color} group-hover:scale-110 transition-transform duration-500`}>
          <i className={`${stat.icon} text-xl`}></i>
        </div>
        <p className="text-[10px] text-[#848E9C] font-black uppercase tracking-[0.2em] mb-2">{stat.label}</p>
        <p className="text-3xl font-black text-white">{stat.value}</p>
      </div>
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-[#FCD535]/10 transition-all duration-500"></div>
    </div>
  );
};
