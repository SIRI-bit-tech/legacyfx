'use client';

import { DashboardLayout } from '../dashboard-layout';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

export default function RealEstatePage() {
   const [properties, setProperties] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      loadProperties();
   }, []);

   const loadProperties = async () => {
      try {
         const res = await api.get(API_ENDPOINTS.INVESTMENTS.PRODUCTS);
         // Filter for real estate if type exists, or use all for now
         setProperties(res || []);
      } catch (err) {
         console.error('Failed to load real estate:', err);
      } finally {
         setLoading(false);
      }
   };

   if (loading) {
      return (
         <DashboardLayout>
            <div className="flex items-center justify-center min-h-[60vh]">
               <i className="pi pi-spin pi-spinner text-4xl text-color-primary"></i>
            </div>
         </DashboardLayout>
      );
   }


   return (
      <DashboardLayout>
         <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <header className="mb-12">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="flex-1">
                     <div className="flex items-center gap-3 mb-2">
                        <span className="bg-color-primary/10 text-color-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-color-primary/20">Institutional Assets</span>
                     </div>
                     <h1 className="text-4xl font-bold text-text-primary mb-3">Tokenized Real Estate</h1>
                     <p className="text-text-secondary text-lg max-w-2xl">Invest in prime global real estate with as little as $50. Earn monthly rental yields and capital appreciation.</p>
                  </div>

                  <div className="bg-bg-secondary border border-color-border p-6 rounded-2xl flex items-center gap-8 shadow-xl">
                     <div className="text-center">
                        <p className="text-[10px] text-text-tertiary font-bold uppercase mb-1">Portfolio Value</p>
                        <p className="text-2xl font-bold text-color-primary">$0.00</p>
                     </div>
                     <div className="w-px h-10 bg-color-border"></div>
                     <div className="text-center">
                        <p className="text-[10px] text-text-tertiary font-bold uppercase mb-1">Monthly Yield</p>
                        <p className="text-2xl font-bold text-color-success">0.0%</p>
                     </div>
                  </div>
               </div>
            </header>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
               {[
                  { title: 'Tokenized Ownership', icon: 'pi-clone', desc: 'Each property is divided into unique tokens on the blockchain.' },
                  { title: 'Passive Dividends', icon: 'pi-percentage', desc: 'Rental income is distributed automatically to token holders monthly.' },
                  { title: 'High Liquidity', icon: 'pi-bolt', desc: 'Exit your position instantly by selling tokens on our platform.' },
               ].map((b, i) => (
                  <div key={i} className="flex gap-4 p-6 bg-bg-secondary border border-color-border rounded-xl">
                     <div className="w-12 h-12 rounded-lg bg-bg-tertiary flex items-center justify-center text-xl text-color-primary border border-color-border shrink-0">
                        <i className={`pi ${b.icon}`}></i>
                     </div>
                     <div>
                        <h4 className="font-bold text-text-primary mb-1">{b.title}</h4>
                        <p className="text-xs text-text-tertiary leading-relaxed">{b.desc}</p>
                     </div>
                  </div>
               ))}
            </div>

            {/* Property Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {properties.length > 0 ? properties.map((prop: any) => (
                  <div key={prop.id} className="bg-bg-secondary border border-color-border rounded-2xl overflow-hidden flex flex-col md:flex-row group hover:border-color-primary/40 transition-all shadow-lg hover:shadow-color-primary/5">
                     <div className="md:w-2/5 relative bg-bg-tertiary flex items-center justify-center text-7xl select-none group-hover:scale-105 transition-transform duration-500">
                        <div className="absolute top-4 left-4 z-10">
                           <span className="bg-bg-secondary/90 backdrop-blur-md text-[10px] text-text-primary px-3 py-1 rounded-full font-bold border border-color-border">
                              <i className="pi pi-map-marker text-color-primary"></i> {prop.location || 'Global'}
                           </span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-bg-secondary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="opacity-80 grayscale-[0.5] group-hover:grayscale-0 transition-all">
                           {prop.type === 'REAL_ESTATE' ? '🏢' : '📈'}
                        </span>
                     </div>

                     <div className="p-8 md:w-3/5 flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                           <div>
                              <h3 className="text-xl font-bold text-text-primary mb-1">{prop.name}</h3>
                              <p className="text-xs text-text-tertiary font-medium">Market Value: <span className="text-text-secondary">${(prop.total_value || 1000000).toLocaleString()}</span></p>
                           </div>
                           <div className="text-right">
                              <p className="text-2xl font-bold text-color-success">{prop.apy}%</p>
                              <p className="text-[10px] text-text-tertiary font-bold uppercase">Target Yield</p>
                           </div>
                        </div>

                        <div className="space-y-4 mb-8">
                           <div>
                              <div className="flex justify-between text-[10px] font-bold uppercase text-text-tertiary mb-2">
                                 <span>Funding Progress</span>
                                 <span>{prop.funded_percent || '85'}%</span>
                              </div>
                              <div className="w-full bg-bg-tertiary h-1.5 rounded-full overflow-hidden">
                                 <div className="bg-color-primary h-full rounded-full transition-all duration-1000" style={{ width: `${prop.funded_percent || 85}%` }}></div>
                              </div>
                           </div>

                           <div className="flex justify-between items-center py-3 border-y border-color-border/40">
                              <div className="flex flex-col">
                                 <span className="text-[10px] text-text-tertiary uppercase font-bold">Token Price</span>
                                 <span className="text-lg font-bold text-text-primary">${prop.min_investment}</span>
                              </div>
                              <div className="text-right">
                                 <span className="text-[10px] text-text-tertiary uppercase font-bold">Duration</span>
                                 <span className="text-xs block text-text-secondary font-semibold">{prop.duration_days} Days</span>
                              </div>
                           </div>
                        </div>

                        <button className="w-full bg-color-primary hover:bg-color-primary-hover text-bg-primary py-3.5 rounded-xl font-bold transition shadow-md hover:shadow-xl hover:shadow-color-primary/10">
                           Invest in Property
                        </button>
                     </div>
                  </div>
               )) : (
                  <div className="col-span-full p-12 text-center bg-bg-secondary border border-color-border rounded-2xl">
                     <i className="pi pi-building text-4xl text-text-tertiary mb-4"></i>
                     <p className="text-text-secondary">No real estate investment products available at the moment.</p>
                  </div>
               )}
            </div>
         </div>
      </DashboardLayout>
   );
}
