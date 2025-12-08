import React, { useState, useRef, useEffect } from 'react';
import {
    Maximize2,
    Volume2,
    VolumeX,
    Play,
    Pause,
    Lock,
    User,
    LogOut
} from 'lucide-react';
import Chat from './Chat';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { LIVE_STREAM_VIDEO_ID } from '../constants';

const ImmersivePlayer: React.FC = () => {
    const [isHovered, setIsHovered] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [volume, setVolume] = useState(0); // Start at 0 since it's muted
    const [isPlaying, setIsPlaying] = useState(true);

    // --- AUTH STATE ---
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // --- VIDEO STATE ---
    const [videoId, setVideoId] = useState(LIVE_STREAM_VIDEO_ID);

    useEffect(() => {
        // --- AUTH STATE ---
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

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // 3. Dynamic Stream URL Logic (with Playlist Fallback)
    useEffect(() => {
        const fetchConfig = async () => {
            // 1. Try to fetch the currently ACTIVE event
            const { data: eventData } = await supabase
                .from('events')
                .select('stream_url')
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (eventData && eventData.stream_url) {
                console.log("▶ Playing Active Event Stream:", eventData.stream_url);
                setVideoId(eventData.stream_url);
                return;
            }

            // 2. If no active event, fetch Fallback Playlist
            console.log("No active event, checking playlist...");
            const { data: playlistData } = await supabase
                .from('playlist')
                .select('video_id')
                .eq('is_active', true);

            if (playlistData && playlistData.length > 0) {
                // Pick a random video from playlist
                const randomIndex = Math.floor(Math.random() * playlistData.length);
                const randomVideo = playlistData[randomIndex];
                console.log("▶ Playing Playlist Video:", randomVideo.video_id);
                setVideoId(randomVideo.video_id);
            } else {
                // 3. Last resort fallback
                setVideoId(LIVE_STREAM_VIDEO_ID);
            }
        };

        fetchConfig();

        // Optional: Listen for event updates to auto-switch stream
        const channel = supabase
            .channel('public:events')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'events' }, (payload) => {
                if (payload.new && payload.new.status === 'active' && payload.new.stream_url) {
                    setVideoId(payload.new.stream_url); // Switch to live immediately
                } else if (payload.new && payload.new.status !== 'active') {
                    // Event ended? Reload config to get playlist (basic refresh)
                    fetchConfig();
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const toggleMute = () => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            const newMutedState = !isMuted;
            const command = newMutedState ? 'mute' : 'unMute';

            iframeRef.current.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: command,
                args: []
            }), '*');

            setIsMuted(newMutedState);

            // If unmuting and volume is 0, set to 50
            if (!newMutedState && volume === 0) {
                setVolume(50);
                iframeRef.current.contentWindow.postMessage(JSON.stringify({
                    event: 'command',
                    func: 'setVolume',
                    args: [50]
                }), '*');
            }
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseInt(e.target.value);
        setVolume(newVolume);

        if (iframeRef.current && iframeRef.current.contentWindow) {
            // Update volume
            iframeRef.current.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: 'setVolume',
                args: [newVolume]
            }), '*');

            // Handle mute/unmute based on volume level
            if (newVolume === 0 && !isMuted) {
                setIsMuted(true);
                iframeRef.current.contentWindow.postMessage(JSON.stringify({
                    event: 'command',
                    func: 'mute',
                    args: []
                }), '*');
            } else if (newVolume > 0 && isMuted) {
                setIsMuted(false);
                iframeRef.current.contentWindow.postMessage(JSON.stringify({
                    event: 'command',
                    func: 'unMute',
                    args: []
                }), '*');
            }
        }
    };

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
                            ref={iframeRef}
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1&origin=${window.location.origin}`}
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
                <div className={`absolute top-0 left-0 w-full p-6 flex justify-between items-start z-50 transition-all duration-500 ${isHovered || !session ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                    {/* Streamer Profile Removed */}
                    <div></div>

                    {/* Top Right Actions */}
                    <div className="flex items-center gap-3">



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





                {/* 4. Bottom Left Controls (Volume) */}
                <div className={`absolute bottom-3 left-3 z-50 transition-all duration-500 ${isHovered || !session ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full p-1 pr-3 border border-white/10 group/volume">
                        {/* Volume Toggle */}
                        <button
                            onClick={toggleMute}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all"
                            title={isMuted ? "Ativar Som" : "Mudo"}
                        >
                            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>

                        {/* Volume Slider */}
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="w-0 group-hover/volume:w-20 transition-all duration-300 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                        />
                    </div>
                </div>

            </div>

            {/* --- CHAT CONTAINER --- */}
            <Chat className="w-full lg:w-[400px] h-[600px] lg:h-full bg-slate-900 border-slate-800" />

        </div>
    );
};

export default ImmersivePlayer;
