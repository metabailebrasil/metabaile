import React, { useState } from 'react';
import { X, Instagram, MessageCircle, CheckCircle, Loader2, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface InfluencerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const InfluencerModal: React.FC<InfluencerModalProps> = ({ isOpen, onClose }) => {
    const [name, setName] = useState('');
    const [instagram, setInstagram] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        // Basic Validation
        if (!name.trim() || !instagram.trim() || !whatsapp.trim()) {
            setError('Por favor, preencha todos os campos.');
            setLoading(false);
            return;
        }

        // Add @ prefix to instagram if missing
        const formattedInstagram = instagram.startsWith('@') ? instagram : `@${instagram}`;

        try {
            const { error: insertError } = await supabase
                .from('influencer_leads')
                .insert([
                    {
                        name,
                        instagram: formattedInstagram,
                        whatsapp,
                        status: 'pending'
                    }
                ]);

            if (insertError) throw insertError;

            setSuccess(true);
            // Auto-close removed as per request

        } catch (err: any) {
            console.error('Error submitting lead:', err);
            // Show actual error to help debugging
            setError(err.message || 'Erro ao enviar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        onClose();
        // Reset state after animation
        setTimeout(() => {
            setSuccess(false);
            setName('');
            setInstagram('');
            setWhatsapp('');
            setError(null);
        }, 300);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/20 backdrop-blur-sm cursor-pointer"
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-white/90 backdrop-blur-xl border border-white/50 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden z-10"
                    >
                        {/* Header Image/Gradient */}
                        <div className="h-40 bg-gradient-to-br from-sky-400 via-blue-400 to-indigo-400 relative flex flex-col items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                            {/* Decorative Circles */}
                            <div className="absolute top-[-20%] left-[-20%] w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
                            <div className="absolute bottom-[-20%] right-[-20%] w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl"></div>

                            <div className="relative z-10 text-center px-6">
                                <span className="block text-blue-100 font-bold tracking-[0.2em] text-xs mb-1 uppercase">Seja Nosso</span>
                                <h2 className="text-3xl font-display font-black text-white tracking-tight drop-shadow-sm uppercase mb-2">
                                    Influencer
                                </h2>
                                <p className="text-white/90 text-[10px] sm:text-xs font-medium leading-relaxed max-w-[240px] mx-auto border-t border-white/20 pt-2 mt-1">
                                    Junte-se aos criadores que estão revolucionando a cena do ao vivo.
                                </p>
                            </div>

                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors backdrop-blur-sm"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {success ? (
                                <div className="flex flex-col items-center justify-center py-6 text-center animate-fade-in">
                                    <div className="w-16 h-16 bg-sky-100 text-sky-500 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-lg">
                                        <CheckCircle size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">Aplicação Enviada!</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed mb-6">Nossa equipe analisará seu perfil.<br />Fique de olho no WhatsApp.</p>

                                    <button
                                        onClick={handleClose}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-8 rounded-xl transition-colors text-sm"
                                    >
                                        Fechar
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <p className="text-slate-500 text-xs text-center mb-1 px-4 leading-relaxed">
                                        Preencha seus dados para aplicarmos a verificação oficial de <strong>Influencer Metabaile</strong>.
                                    </p>

                                    {/* Name */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2">Nome Completo</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Ex: Anderson Silva"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all font-medium text-sm"
                                        />
                                    </div>

                                    {/* Instagram */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2">Instagram</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                <Instagram size={16} />
                                            </div>
                                            <input
                                                type="text"
                                                value={instagram}
                                                onChange={(e) => setInstagram(e.target.value)}
                                                placeholder="@seuprofill"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all font-medium text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* WhatsApp */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2">WhatsApp</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                <MessageCircle size={16} />
                                            </div>
                                            <input
                                                type="tel"
                                                value={whatsapp}
                                                onChange={(e) => setWhatsapp(e.target.value)}
                                                placeholder="(11) 99999-9999"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all font-medium text-sm"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 px-4 rounded-lg">{error}</p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group mt-2"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" /> Enviando...
                                            </>
                                        ) : (
                                            <>
                                                Quero ser Influencer <Send size={16} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default InfluencerModal;
