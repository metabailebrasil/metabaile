import React, { useState, useEffect, useRef } from 'react';
import {
    Send, Heart, Zap, Crown, Star, Gift, ChevronDown,
    MessageSquare, Settings, DollarSign, Sparkles, X,
    TrendingUp, Music
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- UTILS ---
function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// --- TYPES ---
export interface ChatMessage {
    id: string;
    user: string;
    avatar?: string;
    content: string;
    isDonation: boolean;
    amount: number;
    tier?: 1 | 2 | 3; // 1: Basic, 2: VIP, 3: King
    timestamp: number;
}

export interface PinnedMessage extends ChatMessage {
    expiresAt: number;
}

// --- CONFIG ---
const HYPE_DECAY_RATE = 0.5; // % per second
const HYPE_DECAY_INTERVAL = 1000;
const FLUXO_DURATION = 60000; // 60s

// --- COMPONENTS ---

/**
 * FEATURE 3: "Twitch Style" Hype Train ("Energia do Baile")
 */
export const EnergyBar = ({ level, isFluxo }: { level: number, isFluxo: boolean }) => {
    return (
        <div className="w-full h-12 bg-white border-b border-blue-50 shadow-sm relative overflow-hidden flex items-center px-4 gap-3">
            <div className="z-10 flex items-center gap-2">
                <div className={cn("p-1.5 rounded-full", isFluxo ? "bg-purple-500 animate-pulse" : "bg-blue-500")}>
                    <Zap className="text-white w-4 h-4 fill-current" />
                </div>
                <div className="flex flex-col leading-none">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Energia do Baile</span>
                    <span className={cn("text-sm font-black", isFluxo ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500" : "text-slate-800")}>
                        {isFluxo ? "MODO FLUXO ATIVADO 🚀" : `${level.toFixed(0)}%`}
                    </span>
                </div>
            </div>

            {/* Progress Bar Background */}
            <div className="absolute inset-0 bg-blue-50/50" />

            {/* Fill Animation */}
            <motion.div
                className={cn("absolute inset-y-0 left-0 opacity-20 transition-all duration-300",
                    isFluxo ? "bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" : "bg-blue-500"
                )}
                style={{ width: `${level}%` }}
            />

            {/* Particles/Sparkles when high energy */}
            {level > 80 && !isFluxo && (
                <div className="absolute inset-0 z-0 flex items-center justify-end pr-4 opacity-50">
                    <Sparkles className="text-blue-400 animate-pulse" />
                </div>
            )}
        </div>
    );
};

/**
 * FEATURE 1: "YouTube Style" Sticky Super Chat
 */
export const StickyHeader = ({ pinnedMessages }: { pinnedMessages: PinnedMessage[] }) => {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    if (pinnedMessages.length === 0) return null;

    return (
        <div className="w-full bg-slate-50 border-b border-blue-100 p-2 flex gap-2 overflow-x-auto scrollbar-hide z-10 transition-all">
            <AnimatePresence>
                {pinnedMessages.map(msg => {
                    const timeLeft = Math.max(0, Math.ceil((msg.expiresAt - now) / 1000));
                    if (timeLeft <= 0) return null; // Should be filtered out by parent, but safety check

                    let bgClass = "bg-blue-100 border-blue-200 text-blue-900";
                    if (msg.tier === 2) bgClass = "bg-blue-600 border-blue-700 text-white shadow-md shadow-blue-500/20";
                    if (msg.tier === 3) bgClass = "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500 shadow-lg shadow-purple-500/30 animate-pulse-slow";

                    return (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: -20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className={cn("flex-shrink-0 rounded-xl p-3 min-w-[240px] max-w-[280px] border flex flex-col relative overflow-hidden", bgClass)}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm overflow-hidden">
                                        <img src={msg.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.user}`} alt="avatar" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold opacity-90">{msg.user}</p>
                                        <p className="text-[10px] font-mono opacity-75">{formatCurrency(msg.amount)}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-md">
                                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                </span>
                            </div>
                            <p className="text-sm font-medium leading-tight line-clamp-2">{msg.content}</p>

                            {/* Progress bar for time left */}
                            <div className="absolute bottom-0 left-0 h-1 bg-black/10 w-full">
                                <motion.div
                                    className="h-full bg-white/50"
                                    initial={{ width: "100%" }}
                                    animate={{ width: "0%" }}
                                    transition={{ duration: (msg.expiresAt - msg.timestamp) / 1000, ease: "linear" }}
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

/**
 * FEATURE 2: "TikTok Style" Screen Overlay
 */
export const VideoOverlay = ({ activeOverlay }: { activeOverlay: ChatMessage | null }) => {
    if (!activeOverlay) return null;

    return (
        <AnimatePresence>
            <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden">
                {/* Background Dim */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                />

                {/* Confetti / Rain Effect */}
                <div className="absolute inset-0 flex justify-center overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ y: -100, x: Math.random() * 100 - 50, opacity: 0, rotate: 0 }}
                            animate={{ y: 800, opacity: [0, 1, 0], rotate: 360 }}
                            transition={{ duration: 2 + Math.random(), delay: Math.random() * 0.5, ease: "easeOut" }}
                            className="absolute top-0 text-4xl"
                            style={{ left: `${Math.random() * 100}%` }}
                        >
                            {Math.random() > 0.5 ? '💸' : '💎'}
                        </motion.div>
                    ))}
                </div>

                {/* Main Popup */}
                <motion.div
                    initial={{ scale: 0.5, opacity: 0, y: 100 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="relative z-10 flex flex-col items-center justify-center text-center"
                >
                    <div className="w-24 h-24 rounded-full border-4 border-yellow-400 bg-white p-1 shadow-[0_0_50px_rgba(234,179,8,0.6)] mb-4 animate-bounce-slow">
                        <img
                            src={activeOverlay.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeOverlay.user}`}
                            alt={activeOverlay.user}
                            className="w-full h-full rounded-full"
                        />
                        <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-black font-bold p-2 rounded-full border-2 border-white">
                            <Crown size={24} fill="black" />
                        </div>
                    </div>

                    <motion.h2
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-sm filter"
                        style={{ textShadow: '0px 4px 10px rgba(0,0,0,0.5)' }}
                    >
                        {activeOverlay.user}
                    </motion.h2>

                    <div className="mt-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-full font-bold text-xl shadow-xl border border-white/20">
                        {activeOverlay.content}
                    </div>

                    <p className="mt-4 text-white/80 font-mono text-sm uppercase tracking-widest animate-pulse">
                        Enviou {formatCurrency(activeOverlay.amount)}
                    </p>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

// --- MAIN COMPONENT ---

export const LiveStreamChat = ({ className = "" }: { className?: string }) => {
    // State
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
    const [hypeLevel, setHypeLevel] = useState(0);
    const [isFluxo, setIsFluxo] = useState(false);
    const [activeOverlay, setActiveOverlay] = useState<ChatMessage | null>(null);
    const [inputValue, setInputValue] = useState("");

    const scrollRef = useRef<HTMLDivElement>(null);

    // Hype Decay Logic
    useEffect(() => {
        const interval = setInterval(() => {
            if (isFluxo) return; // Don't decay during FLUXO
            setHypeLevel(prev => Math.max(0, prev - HYPE_DECAY_RATE));
        }, HYPE_DECAY_INTERVAL);
        return () => clearInterval(interval);
    }, [isFluxo]);

    // Cleanup Expired Pins
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setPinnedMessages(prev => prev.filter(msg => msg.expiresAt > now));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Fluxo Logic
    useEffect(() => {
        if (hypeLevel >= 100 && !isFluxo) {
            setIsFluxo(true);
            setHypeLevel(100);

            // Fluxo lasts 60s
            setTimeout(() => {
                setIsFluxo(false);
                setHypeLevel(0);
            }, FLUXO_DURATION);
        }
    }, [hypeLevel, isFluxo]);

    // Handlers
    const addMessage = (msg: ChatMessage) => {
        setMessages(prev => [...prev.slice(-99), msg]); // Keep last 100
        setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);

        // Hype Logic
        if (!isFluxo) {
            setHypeLevel(prev => Math.min(100, prev + (msg.isDonation ? msg.amount * 0.5 : 0.5)));
        }

        // Pinned Logic
        if (msg.isDonation && msg.amount >= 5) {
            let duration = 0;
            if (msg.amount >= 50) duration = 30 * 60 * 1000; // 30m
            else if (msg.amount >= 20) duration = 10 * 60 * 1000; // 10m
            else duration = 2 * 60 * 1000; // 2m

            const pinned: PinnedMessage = { ...msg, expiresAt: Date.now() + duration };
            setPinnedMessages(prev => [...prev, pinned]);
        }

        // Overlay Logic
        if (msg.isDonation && msg.amount >= 50) {
            setActiveOverlay(msg);
            setTimeout(() => setActiveOverlay(null), 6000);
        }
    };

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;
        addMessage({
            id: crypto.randomUUID(),
            user: "Você",
            content: inputValue,
            isDonation: false,
            amount: 0,
            timestamp: Date.now()
        });
        setInputValue("");
    };

    // Simulation Utils
    const simulateDonation = (amount: number) => {
        const names = ["MC Kevinho", "Anitta Fake", "Neymar Jr", "Casimiro", "Zezinho do Fluxo"];
        const msgs = ["Manda salve!", "Tmj cria", "Brabo demais!", "Solta o beat!", "Metabaile é mídia"];
        const tier = amount >= 50 ? 3 : amount >= 20 ? 2 : 1;

        addMessage({
            id: crypto.randomUUID(),
            user: names[Math.floor(Math.random() * names.length)],
            content: msgs[Math.floor(Math.random() * msgs.length)],
            isDonation: true,
            amount,
            tier,
            timestamp: Date.now()
        });
    };

    return (
        <div className={cn("flex flex-col h-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 relative", className)}>

            {/* Optional Overlay Placement (Assuming this component wraps the video too, or user places specific overlay separately) 
                Note: Ideally VideoOverlay is placed on top of VideoPlayer, not inside Chat. 
                For this demo, we expose it but also render it here for visibility if needed, 
                though in production layout it sits elsewhere. 
            */}
            {/* <VideoOverlay activeOverlay={activeOverlay} /> */}

            {/* Feature 3: Energy Bar */}
            <EnergyBar level={hypeLevel} isFluxo={isFluxo} />

            {/* Feature 1: Sticky Header */}
            <StickyHeader pinnedMessages={pinnedMessages} />

            {/* Main Chat Area */}
            <div
                className={cn(
                    "flex-1 overflow-y-auto p-4 space-y-3 relative transition-colors duration-1000",
                    isFluxo ? "bg-gradient-to-b from-purple-50 to-pink-50" : "bg-white"
                )}
                ref={scrollRef}
            >
                {/* Background Pattern used in 'User Design System' */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>

                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                        <MessageSquare size={48} className="mb-2" />
                        <p>O chat está quieto...</p>
                    </div>
                )}

                {messages.map(msg => (
                    <div
                        key={msg.id}
                        className={cn(
                            "text-sm break-words relative z-10 animate-in slide-in-from-bottom-2 fade-in duration-300",
                            msg.isDonation ? "font-medium" : "text-slate-600"
                        )}
                    >
                        {msg.isDonation ? (
                            <div className={cn(
                                "flex flex-col p-3 rounded-xl border",
                                msg.tier === 3 ? "bg-gradient-to-r from-purple-100 to-indigo-50 border-purple-200" :
                                    msg.tier === 2 ? "bg-blue-50 border-blue-200" :
                                        "bg-slate-50 border-slate-200"
                            )}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={cn(
                                        "text-xs font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1",
                                        msg.tier === 3 ? "bg-purple-500 text-white" :
                                            msg.tier === 2 ? "bg-blue-600 text-white" :
                                                "bg-blue-400 text-white"
                                    )}>
                                        {msg.tier === 3 && <Crown size={10} />}
                                        {msg.tier === 2 && <Star size={10} />}
                                        {formatCurrency(msg.amount)}
                                    </span>
                                    <span className="font-bold text-slate-800">{msg.user}</span>
                                </div>
                                <span className="text-slate-800">{msg.content}</span>
                            </div>
                        ) : (
                            <p>
                                <span className={`font-bold mr-2 ${['text-blue-500', 'text-indigo-500', 'text-violet-500'][msg.user.length % 3]}`}>
                                    {msg.user}:
                                </span>
                                {msg.content}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center z-20">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Bota a cara no sol..."
                    className="flex-1 bg-slate-50 text-slate-800 placeholder-slate-400 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-slate-200 transition-all font-medium"
                />
                <button
                    onClick={() => simulateDonation(5)}
                    className="p-3 rounded-full bg-slate-100 text-slate-500 hover:bg-green-100 hover:text-green-600 transition-colors"
                >
                    <DollarSign size={20} />
                </button>
                <button
                    onClick={handleSendMessage}
                    className="p-3 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all transform active:scale-95"
                >
                    <Send size={20} />
                </button>
            </div>

            {/* DEBUG PANEL */}
            <div className="absolute top-0 right-full mr-4 bg-slate-900 text-white p-4 rounded-xl w-64 shadow-xl hidden md:block opacity-0 hover:opacity-100 transition-opacity">
                <h3 className="font-bold text-xs uppercase text-slate-400 mb-2 flex items-center gap-2">
                    <Settings size={12} /> Debug Panel
                </h3>
                <div className="space-y-2">
                    <button onClick={() => addMessage({ id: crypto.randomUUID(), user: "Fã Clube 1", content: "Música braba!!", isDonation: false, amount: 0, timestamp: Date.now() })} className="w-full bg-slate-800 text-xs py-2 rounded hover:bg-slate-700">Simulate Message</button>
                    <button onClick={() => simulateDonation(5)} className="w-full bg-blue-900/50 text-blue-200 text-xs py-2 rounded hover:bg-blue-900 border border-blue-500/20">Simulate $5 (Tier 1)</button>
                    <button onClick={() => simulateDonation(25)} className="w-full bg-blue-600/50 text-white text-xs py-2 rounded hover:bg-blue-600 border border-blue-400/20">Simulate $25 (Tier 2)</button>
                    <button onClick={() => simulateDonation(100)} className="w-full bg-purple-600 text-white text-xs py-2 rounded hover:bg-purple-500 font-bold animate-pulse">Simulate $100 (OVERLAY)</button>
                </div>
            </div>
        </div>
    );
};
