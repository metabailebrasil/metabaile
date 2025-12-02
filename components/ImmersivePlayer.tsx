import React, { useState, useRef, useEffect } from 'react';
import {
    Maximize2,
    Heart,
    Play,
    Pause,
    Lock,
    User,
    LogOut
} from 'lucide-react';
import Chat from './Chat';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

const ImmersivePlayer: React.FC = () => {
    const [isHovered, setIsHovered] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isPlaying, setIsPlaying] = useState(true);

    // --- AUTH STATE ---
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);



    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    // Reference for the container to go full screen
    const containerRef = useRef<HTMLDivElement>(null);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    // Placeholder Video ID (Replace with actual Unlisted Live ID)
    const VIDEO_ID = "jfKfPfyJRdk"; // Lofi Girl as placeholder

    return (
        <div className="w-[95%] md:w-[98%] max-w-[1800px] mx-auto flex flex-col lg:flex-row gap-6 h-auto lg:h-[85vh]">

            {/* --- VIDEO CONTAINER --- */}
            <div
                ref={containerRef}
                className="relative flex-1 bg-black rounded-[2rem] overflow-hidden shadow-2xl shadow-brand-primary/10 ring-1 ring-white/10 group select-none transition-all aspect-video lg:aspect-auto flex flex-col"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* 
                    --- AUTH GUARD --- 
                    If logged in: Show YouTube Iframe
                    If NOT logged in: Show Login CTA
                */}
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black">
                        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : session ? (
                    <div className="absolute inset-0 w-full h-full bg-black">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${VIDEO_ID}?modestbranding=1&rel=0&showinfo=0&autoplay=1&controls=0`}
                            title="Metabaile Live"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="w-full h-full object-cover"
                        ></iframe>
                        {/* Overlay to prevent direct interaction if needed, or just for styling */}
                        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]"></div>
                    </div>
                ) : (
                    /* --- LOGIN CTA (Call to Action) --- */
                    <div className="absolute inset-0 w-full h-full bg-slate-900 flex flex-col items-center justify-center p-8 text-center z-40">
                        {/* Background Image with Blur */}
                        <div className="absolute inset-0 opacity-20">
                            <img
                                src="https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?q=80&w=2670&auto=format&fit=crop"
                                alt="Background"
                                className="w-full h-full object-cover blur-sm"
                            />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40"></div>

                        {/* Content */}
                        <div className="relative z-50 max-w-md animate-float">
                            <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-primary/20 shadow-[0_0_30px_rgba(167,211,255,0.15)]">
                                <Lock size={40} className="text-brand-primary" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                                Área Exclusiva
                            </h2>
                            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                                Essa transmissão é reservada para membros da comunidade Metabaile. Faça login para acessar o palco principal.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={() => window.location.href = '/auth'}
                                    className="px-8 py-3.5 bg-brand-primary text-brand-dark font-bold rounded-full hover:bg-brand-secondary transition-all transform hover:scale-105 shadow-lg shadow-brand-primary/25 flex items-center justify-center gap-2"
                                >
                                    <User size={20} />
                                    Entrar / Cadastrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}


                {/* 3. Top Controls */}
                <div className={`absolute top-0 left-0 w-full p-6 flex justify-between items-start z-50 transition-all duration-500 ${isHovered || !session ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 md:opacity-100 md:translate-y-0'}`}>
                    {/* Streamer Profile Removed */}
                    <div></div>

                    {/* Top Right Actions */}
                    <div className="flex gap-3">

                        <button
                            onClick={toggleFullScreen}
                            className="w-10 h-10 rounded-full backdrop-blur-md bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all hover:scale-110 active:scale-95"
                        >
                            <Maximize2 size={18} />
                        </button>

                        {/* Logout Button (Only visible if logged in) */}
                        {session && (
                            <button
                                onClick={handleLogout}
                                className="w-10 h-10 rounded-full backdrop-blur-md bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-all hover:scale-110 active:scale-95"
                                title="Sair"
                            >
                                <LogOut size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* 4. Right Side Actions (Floating) */}
                <div className="absolute right-6 bottom-24 flex flex-col gap-4 z-50">
                    <button onClick={() => setIsLiked(!isLiked)} className="group flex flex-col items-center gap-1">
                        <div className={`w-12 h-12 rounded-full backdrop-blur-md border flex items-center justify-center transition-all duration-300 active:scale-90 ${isLiked ? 'bg-brand-primary/20 border-brand-primary text-brand-primary' : 'bg-white/10 border-white/10 text-white hover:bg-white/20'}`}>
                            <Heart size={24} className={isLiked ? 'fill-brand-primary' : ''} />
                        </div>
                        <span className="text-white text-[10px] font-bold shadow-black/50 shadow-sm">12k</span>
                    </button>
                </div>


            </div>

            {/* --- CHAT CONTAINER --- */}
            <Chat className="w-full lg:w-[400px] h-[600px] lg:h-full bg-slate-900 border-slate-800" />

        </div>
    );
};

export default ImmersivePlayer;
