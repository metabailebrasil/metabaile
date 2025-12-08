import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarClock, BellRing } from 'lucide-react';

interface WaitlistModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const WaitlistModal: React.FC<WaitlistModalProps> = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer"
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-brand-dark/90 backdrop-blur-xl border border-brand-primary/30 w-full max-w-md rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden z-20 text-center"
                    >
                        {/* Decorative Elements */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-brand-primary to-transparent opacity-50"></div>
                        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-brand-secondary/10 rounded-full blur-[80px]"></div>

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors z-20"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-8 md:p-10 flex flex-col items-center">
                            <div className="w-20 h-20 bg-brand-dark/50 rounded-full flex items-center justify-center mb-6 border border-brand-primary/20 shadow-[0_0_30px_rgba(167,211,255,0.1)] relative group">
                                <div className="absolute inset-0 bg-brand-primary/10 rounded-full animate-ping-slow opacity-20"></div>
                                <CalendarClock size={36} className="text-brand-primary group-hover:scale-110 transition-transform duration-500" />
                            </div>

                            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-3 tracking-wide uppercase">
                                <span className="text-brand-primary">Pista</span> Fechada
                            </h2>

                            <p className="text-brand-gray text-lg mb-8 leading-relaxed max-w-xs mx-auto">
                                Nenhum evento rolando agora. Os ingressos esgotaram ou o próximo drop ainda não foi liberado.
                            </p>

                            <div className="bg-white/5 rounded-2xl p-6 w-full mb-8 border border-white/5 hover:border-brand-primary/20 transition-colors">
                                <div className="flex items-center gap-4 text-left">
                                    <div className="bg-brand-primary/10 p-3 rounded-xl text-brand-primary">
                                        <BellRing size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-sm uppercase tracking-wider">Fique Ligado</h4>
                                        <p className="text-brand-gray text-xs">Ative as notificações no Instagram para não perder o próximo.</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full bg-brand-primary text-brand-dark font-bold text-lg py-4 rounded-xl shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40 hover:scale-[1.02] active:scale-98 transition-all uppercase tracking-widest"
                            >
                                Entendido
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default WaitlistModal;
