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

        if (!name.trim() || !instagram.trim() || !whatsapp.trim()) {
            setError('Por favor, preencha todos os campos.');
            setLoading(false);
            return;
        }

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
        } catch (err: any) {
            console.error('Error submitting lead:', err);
            setError(err.message || 'Erro ao enviar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        onClose();
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
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        // Main Container - Neon Deep Blue/Purple Theme
                        className="relative bg-slate-900 border border-indigo-500/50 w-full max-w-sm rounded-[2.5rem] shadow-[0_0_50px_rgba(79,70,229,0.3)] overflow-hidden z-10"
                    >
                        {/* Header Section */}
                        <div className="relative pt-10 pb-6 text-center px-6 bg-gradient-to-b from-indigo-600/20 to-transparent">
                            {/* Neon Glow Effects */}
                            <div className="absolute top-[-50%] left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px]" />
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 rounded-full blur-[60px]" />

                            <button
                                onClick={handleClose}
                                className="absolute top-5 right-5 text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full"
                            >
                                <X size={20} />
                            </button>

                            <span className="relative z-10 text-cyan-300 font-bold tracking-[0.2em] text-[10px] uppercase mb-1 block">
                                Seja Nosso
                            </span>
                            <h2 className="relative z-10 text-4xl font-display font-black text-white italic tracking-tighter uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                                Influencer
                            </h2>
                            <p className="relative z-10 text-indigo-200/80 text-xs font-medium leading-relaxed max-w-[220px] mx-auto mt-2">
                                Junte-se aos criadores que estão revolucionando a cena do ao vivo.
                            </p>
                        </div>

                        {/* Content Section */}
                        <div className="p-8 pt-2">
                            {success ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
                                    <div className="w-20 h-20 bg-gradient-to-tr from-cyan-400 to-indigo-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                                        <CheckCircle size={40} className="text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Sucesso!</h3>
                                    <p className="text-indigo-200 text-sm leading-relaxed mb-8 max-w-[200px]">
                                        Nossa equipe analisará seu perfil. Fique de olho no WhatsApp.
                                    </p>
                                    <button
                                        onClick={handleClose}
                                        className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 px-8 rounded-2xl transition-all text-sm border border-white/10"
                                    >
                                        Fechar
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <p className="text-indigo-300 text-xs text-center leading-relaxed">
                                        Preencha seus dados para aplicarmos a verificação oficial de <strong className="text-white">Influencer Metabaile</strong>.
                                    </p>

                                    {/* Name Input - Cyan Glow */}
                                    <div className="group">
                                        <label className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider ml-2 mb-1.5 block">Nome Completo</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Ex: Anderson Silva"
                                                className="w-full bg-slate-800/50 border border-cyan-500/30 rounded-2xl px-5 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all font-medium text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Instagram Input - Pink/Purple Glow */}
                                    <div className="group">
                                        <label className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider ml-2 mb-1.5 block">Instagram</label>
                                        <div className="relative">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-fuchsia-400 pointer-events-none">
                                                <Instagram size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                value={instagram}
                                                onChange={(e) => setInstagram(e.target.value)}
                                                placeholder="@ seu perfil"
                                                className="w-full bg-slate-800/50 border border-fuchsia-500/30 rounded-2xl pl-12 pr-5 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-fuchsia-400 focus:shadow-[0_0_20px_rgba(232,121,249,0.2)] transition-all font-medium text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* WhatsApp Input - Purple/Violet Glow */}
                                    <div className="group">
                                        <label className="text-[10px] font-bold text-violet-400 uppercase tracking-wider ml-2 mb-1.5 block">WhatsApp</label>
                                        <div className="relative">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-violet-400 pointer-events-none">
                                                <MessageCircle size={18} />
                                            </div>
                                            <input
                                                type="tel"
                                                value={whatsapp}
                                                onChange={(e) => setWhatsapp(e.target.value)}
                                                placeholder="(11) 99999-9999"
                                                className="w-full bg-slate-800/50 border border-violet-500/30 rounded-2xl pl-12 pr-5 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400 focus:shadow-[0_0_20px_rgba(167,139,250,0.2)] transition-all font-medium text-sm"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                                            <p className="text-red-400 text-xs font-bold text-center">{error}</p>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl shadow-[0_10px_30px_rgba(6,182,212,0.3)] hover:shadow-[0_10px_40px_rgba(6,182,212,0.5)] hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" /> Enviando...
                                            </>
                                        ) : (
                                            <>
                                                Quero ser Influencer <Send size={18} className="group-hover:translate-x-1 transition-transform" />
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
