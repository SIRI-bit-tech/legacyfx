'use client';

import React, { useState } from 'react';
import { MiningPlan, MiningSubscription } from '@/global';
import { X, Copy, CheckCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

interface SubscribeModalProps {
    plan: MiningPlan;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<MiningSubscription | null>;
}

export const SubscribeModal: React.FC<SubscribeModalProps> = ({ plan, isOpen, onClose, onConfirm }) => {
    const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
    const [loading, setLoading] = useState(false);
    const [subData, setSubData] = useState<MiningSubscription | null>(null);

    if (!isOpen) return null;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Wallet address copied to clipboard');
    };

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            const result = await onConfirm();
            if (result) {
                setSubData(result);
                setStep('payment');
            }
        } catch (err: any) {
            toast.error(err.message || 'Subscription failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-card border border-border/50 rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-border/30 flex justify-between items-center">
                    <h3 className="text-xl font-bold">Subscribe to {plan.name}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors"><X size={20} /></button>
                </div>

                <div className="p-6 space-y-6">
                    {step === 'details' && (
                        <>
                            <div className="bg-primary/10 rounded-xl p-4 space-y-3">
                                <p className="text-sm text-center font-medium">You are about to subscribe to the {plan.name} mining plan ($ {plan.price}).</p>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Duration</span>
                                    <span>{plan.duration_days} Days</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Est. Total Profit</span>
                                    <span className="text-green-500 font-bold">{(plan.daily_earnings * plan.duration_days).toFixed(6)} {plan.coin_symbol}</span>
                                </div>
                            </div>
                            <button 
                                onClick={handleSubscribe} 
                                disabled={loading}
                                className="w-full py-4 bg-color-primary text-black rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 uppercase tracking-wider text-sm"
                            >
                                {loading ? 'Processing...' : 'Subscribe to this plan'}
                            </button>
                        </>
                    )}

                    {step === 'payment' && subData && (
                        <div className="space-y-6 text-center">
                            <div className="flex flex-col items-center">
                                <div className="bg-white p-3 rounded-xl mb-4">
                                    <QRCodeSVG value={subData.admin_wallet_id || ''} size={150} />
                                </div>
                                <p className="text-xs text-muted-foreground mb-4">Scan QR or copy address to complete payment</p>
                                
                                <div className="w-full bg-background/50 border border-border p-3 rounded-xl flex items-center justify-between group">
                                    <code className="text-[10px] sm:text-xs font-mono truncate mr-2">{subData.admin_wallet_id}</code>
                                    <button onClick={() => handleCopy(subData.admin_wallet_id || '')} className="text-primary hover:text-primary/70 transition-colors">
                                        <Copy size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl flex items-start space-x-3 text-left">
                                <ShieldCheck size={20} className="text-orange-500 shrink-0" />
                                <p className="text-[10px] text-orange-200 uppercase leading-relaxed font-bold tracking-wider">
                                    Awaiting payment verification
                                </p>
                            </div>

                            <button onClick={onClose} className="w-full py-4 bg-color-primary text-black font-bold rounded-xl hover:opacity-90 transition-all uppercase tracking-wider text-sm">Close & Check Status</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
