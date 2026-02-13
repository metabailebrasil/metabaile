import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, CreditCard, Check, ShieldCheck, Lock, ChevronRight, Zap } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

interface DonationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (amount: number, message: string) => Promise<void>;
    user: any;
}

export const DonationModal: React.FC<DonationModalProps> = ({ isOpen, onClose, onConfirm, user }) => {
    const [step, setStep] = useState<'amount' | 'message' | 'processing' | 'success'>('amount');
    const [amount, setAmount] = useState<number>(5);
    const [message, setMessage] = useState('');
    const [processingStage, setProcessingStage] = useState(0);

    const handleAmountSelect = (val: number) => {
        setAmount(val);
        setStep('message');
    };

    const handlePayment = async () => {
        setStep('processing');

        const stages = [
            "Conectando ao servidor seguro...",
            "Validando destaque...",
            "Processando contribuição...",
            "Confirmando..."
        ];

        for (let i = 0; i < stages.length; i++) {
            setProcessingStage(i);
            await new Promise(r => setTimeout(r, 800 + Math.random() * 500));
        }

        await onConfirm(amount, message);
        setStep('success');

        setTimeout(() => {
            onClose();
            setTimeout(() => {
                setStep('amount');
                setMessage('');
                setProcessingStage(0);
            }, 300);
        }, 2500);
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-[#0f172a] w-full max-w-[380px] rounded-t-3xl sm:rounded-3xl border-t sm:border border-sky-500/20 shadow-2xl shadow-sky-900/20 overflow-hidden flex flex-col relative max-h-[100%] sm:max-h-[90%]"
            >
                {/* Header with Cyber Gradient */}
                <div className="bg-slate-900/50 p-4 pb-6 border-b border-white/5 text-center relative overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-sky-500/20 via-transparent to-transparent"></div>

                    {/* Close / Back Buttons */}
                    {step !== 'processing' && step !== 'success' && (
                        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-20 bg-white/5 p-1.5 rounded-full hover:bg-white/10"><X size={16} /></button>
                    )}
                    {step !== 'amount' && step !== 'processing' && step !== 'success' && (
                        <button onClick={() => setStep('amount')} className="absolute top-4 left-4 text-slate-400 hover:text-white transition-colors z-20 text-[10px] font-bold uppercase tracking-widest hover:underline">VOLTAR</button>
                    )}

                    {/* Title Only - Cleaner Aesthetic */}
                    <div className="relative z-10 flex flex-col items-center pt-2">
                        <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-200 to-white font-black text-2xl tracking-tighter uppercase drop-shadow-sm">Destaque</h3>
                        <p className="text-slate-400 text-[10px] font-bold tracking-[0.2em] uppercase mt-1">Sua mensagem no topo</p>
                    </div>
                </div>

                <div className="p-4 overflow-y-auto custom-scrollbar relative">
                    <AnimatePresence mode="wait">
                        {step === 'amount' && (
                            <motion.div
                                key="amount"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-3"
                            >
                                <div className="grid grid-cols-2 gap-2">
                                    {[5, 10, 20, 50, 100, 500].map(val => (
                                        <button
                                            key={val}
                                            onClick={() => handleAmountSelect(val)}
                                            className={cn(
                                                "relative h-20 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-0.5 group overflow-hidden",
                                                val >= 100
                                                    ? "bg-slate-900 border-amber-500/30 hover:border-amber-400/60 shadow-[0_0_15px_-5px_rgba(245,158,11,0.2)]"
                                                    : "bg-slate-900 border-white/10 hover:border-sky-500/50 hover:bg-slate-800 hover:shadow-[0_0_15px_-5px_rgba(14,165,233,0.2)]"
                                            )}
                                        >
                                            {/* Shine Effect */}
                                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>

                                            <span className={cn("text-xl font-black relative z-10 tracking-tight", val >= 100 ? "text-amber-400 group-hover:text-amber-300" : "text-white group-hover:text-sky-300")}>
                                                R$ {val}
                                            </span>

                                            <div className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider relative z-10 border flex items-center gap-1",
                                                val >= 100
                                                    ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                                    : "bg-sky-500/10 border-sky-500/20 text-sky-400"
                                            )}>
                                                {val >= 100 ? '👑 Rei' : (val >= 20 ? '⭐ VIP' : <><Zap size={8} fill="currentColor" /> Destaque</>)}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 'message' && (
                            <motion.div
                                key="message"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="bg-slate-900/50 p-3 rounded-2xl border border-sky-500/20 flex items-center justify-between mb-1 shadow-inner">
                                    <span className="text-sky-400 font-bold text-[10px] uppercase tracking-wide">Valor Escolhido</span>
                                    <span className="text-white font-black text-lg">R$ {amount},00</span>
                                </div>

                                <div className="space-y-2">
                                    <div className="relative">
                                        <textarea
                                            value={message}
                                            onChange={e => setMessage(e.target.value.slice(0, 200))}
                                            placeholder="Digite sua mensagem para a galera..."
                                            className="w-full bg-black/20 text-white text-sm rounded-2xl p-4 border border-white/10 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-all resize-none h-24 placeholder-slate-500"
                                            autoFocus
                                        />
                                        <div className="absolute bottom-2 right-3 text-[10px] text-slate-600 font-mono font-bold">{message.length}/200</div>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePayment}
                                    className="w-full py-4 bg-gradient-to-r from-sky-600 to-violet-600 text-white font-black rounded-xl hover:from-sky-500 hover:to-violet-500 transition-all shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 mt-2 group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                    <span className="relative z-10 flex items-center gap-2">
                                        <CreditCard size={18} />
                                        ENVIAR AGORA
                                        <ChevronRight size={18} className="opacity-60" />
                                    </span>
                                </button>

                                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 mt-2">
                                    <Lock size={10} /> Ambiente Seguro
                                </div>
                            </motion.div>
                        )}

                        {step === 'processing' && (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-6 space-y-8"
                            >
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full border-4 border-sky-500/10 border-t-sky-500 animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-16 h-16 bg-sky-500/10 rounded-full flex items-center justify-center animate-pulse">
                                            <ShieldCheck size={32} className="text-sky-500" />
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center space-y-3">
                                    <h4 className="text-white font-bold text-lg animate-pulse">Quase lá...</h4>
                                    <p className="text-sky-400/80 text-xs font-mono bg-sky-950/30 px-4 py-1.5 rounded-full border border-sky-500/10 inline-block">
                                        {["Conectando...", "Verificando...", "Validando...", "Finalizando..."][processingStage] || "Aguarde..."}
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {step === 'success' && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-2 space-y-3"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 animate-pulse"></div>
                                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 animate-bounce-short relative z-10">
                                        <Check size={32} className="text-white drop-shadow-md" strokeWidth={4} />
                                    </div>
                                </div>

                                <div className="text-center">
                                    <h2 className="text-lg font-black text-white mb-0.5 tracking-tight">ENVIADO!</h2>
                                    <p className="text-slate-400 text-[10px]">Sua mensagem já está no chat.</p>
                                </div>

                                <div className="w-full bg-slate-900/50 rounded-xl p-3 border border-white/5 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                        IMG
                                    </div>
                                    <div className="flex-1 overflow-hidden text-left">
                                        <p className="text-white font-bold text-xs truncate">{user?.user_metadata?.full_name || 'Você'}</p>
                                        <p className="text-slate-400 text-[10px] truncate">{message || 'Doação para o canal!'}</p>
                                    </div>
                                    <div className="text-emerald-400 font-bold text-xs">R$ {amount}</div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};
