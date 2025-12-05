import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Smile, Users, MessageSquare, Plus, Lock, Hash, Copy, ArrowDown, Shield, Star, Crown, Check, Banknote, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- MODERATOR SENTINEL RULES ---
// 1. INTENSITY ALLOWED: caralho, porra, merda, foda (used for hype)
// 2. BLOCK: Insults, Hate Speech, Spam

const BLOCK_PATTERNS = [
    // --- INSULTS & AGGRESSION ---
    /vtn[cm]?/i,          // Vai tomar no cu/c*
    /vsf/i,               // Vai se foder
    /fdp/i,               // Filho da puta
    /cuz[aÃ̃ã]o/i,
    /c[uú]zao/i,
    /arrombad[oa]/i,
    /otari[oa]/i,
    /imbecil/i,
    /lixo/i,              // "Seu lixo"
    /inuti[l]/i,
    /burr[oa]/i,
    /idiota/i,
    /retardad[oa]/i,
    /autist[a4]/i,        // Ableism
    /doente/i,
    /filh[oa][ ]?d[ae][ ]?puta/i,

    // --- HATE SPEECH (Racism, Homophobia, Xenophobia) ---
    /macac[oa]/i,
    /m4c4c[oa]/i,
    /pret[oa][ ]?fedid[oa]/i,
    /viad[oa]/i,
    /bi[cx]a/i,
    /travec[oa]/i,
    /mari[kc]a/i,
    /boiola/i,
    /sapat[aÃ̃ã]o/i,

    // --- SEXUAL HARASSMENT ---
    /chupa[ ]?meu/i,
    /sent[a4][ ]?n[a4]/i,
    /mostr[a4][ ]?(a|o|os|as)/i, // Context of "mostra a xereca" etc. Hard to regex safe.
    /xerec[a4]/i,
    /bucet[a4]/i,         // Often sexualized, unlike 'caralho'.
    /pir[0o]c[a4]/i,
    /nudes/i,

    // --- EVASIVE PATTERNS ---
    /f\.?d\.?p/i,
    /c\.?u/i,             // "c u", "c.u"
    /v\.?t\.?n\.?c/i
];

const validateMessage = (text: string): { isValid: boolean; reason?: string } => {
    // 1. Normalize
    const normalized = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 2. SPAM CHECK (Flood)
    // Detects 50 or more repeated characters (e.g., "kkkkkk...").
    const aggressiveSpamPattern = /(.)\1{49,}/;
    if (aggressiveSpamPattern.test(text)) {
        return { isValid: false, reason: 'Sem flood! (Muitas letras repetidas)' };
    }

    // 3. SPAM CHECK (Links)
    if (/http[s]?:\/\//i.test(text) || /www\./i.test(text) || /\.com/i.test(text)) {
        return { isValid: false, reason: 'Links não são permitidos.' };
    }

    // 4. BLOCK WORDS CHECK
    for (const pattern of BLOCK_PATTERNS) {
        if (pattern.test(normalized) || pattern.test(text)) {
            // More specific reasons could be cool
            if (pattern.source.includes('macac') || pattern.source.includes('viad')) {
                return { isValid: false, reason: 'Discriminação não é tolerada aqui.' };
            }
            return { isValid: false, reason: 'Mantenha o respeito! Sem ofensas.' };
        }
    }

    return { isValid: true };
};

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Generate consistent color from string
const getUsernameColor = (username: string) => {
    const colors = [
        'text-pink-500', 'text-purple-500', 'text-indigo-500', 'text-blue-500',
        'text-cyan-500', 'text-teal-500', 'text-green-500', 'text-lime-500',
        'text-yellow-500', 'text-orange-500', 'text-red-500'
    ];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

// --- TYPES ---
interface Message {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    room_id: string | null;
    role_badge?: 'user' | 'vip' | 'admin' | 'moderator';
    user_meta: {
        name: string;
        avatar: string;
    };
    isMe?: boolean;
}

interface ChatRoom {
    id: string;
    name: string;
    emoji: string;
    created_by: string;
    expires_at: string;
}

// --- CONSTANTS ---
const MAX_MESSAGES = 100; // Sliding Buffer Limit
const SLOW_MODE_DELAY = 3000; // 3 seconds

const Chat: React.FC<{ className?: string }> = ({ className = '' }) => {
    // --- STATE ---
    const [activeTab, setActiveTab] = useState<'public' | 'group'>('public');
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [session, setSession] = useState<any>(null);
    const [isScrolledNearBottom, setIsScrolledNearBottom] = useState(true);
    const [hasNewMessages, setHasNewMessages] = useState(false);
    const [lastMessageTime, setLastMessageTime] = useState(0);

    // Private Room State
    const [myRooms, setMyRooms] = useState<ChatRoom[]>([]);
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string>('');

    // Form State
    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomPass, setNewRoomPass] = useState('');
    const [joinRoomId, setJoinRoomId] = useState('');
    const [joinRoomPass, setJoinRoomPass] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [warning, setWarning] = useState<string | null>(null);

    // Refs
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleCopyRoomId = () => {
        if (!activeRoomId) return;
        navigator.clipboard.writeText(activeRoomId);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    // --- SCROLL LOGIC ---
    const scrollToBottom = (smooth = true) => {
        if (messagesContainerRef.current) {
            const { scrollHeight, clientHeight } = messagesContainerRef.current;
            messagesContainerRef.current.scrollTo({
                top: scrollHeight - clientHeight,
                behavior: smooth ? 'smooth' : 'auto'
            });
            setHasNewMessages(false);
            setIsScrolledNearBottom(true);
        }
    };

    const handleScroll = () => {
        if (!messagesContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

        // If user is within 100px of bottom, they are "near bottom"
        const isNear = distanceFromBottom < 100;
        setIsScrolledNearBottom(isNear);

        if (isNear) {
            setHasNewMessages(false);
        }
    };

    // --- TIMER LOGIC ---
    useEffect(() => {
        if (activeTab === 'public' || !activeRoomId) {
            setTimeLeft('');
            return;
        }
        const room = myRooms.find(r => r.id === activeRoomId);
        if (!room) return;

        const updateTimer = () => {
            const now = new Date().getTime();
            const expireTime = new Date(room.expires_at).getTime();
            const distance = expireTime - now;

            if (distance < 0) {
                setTimeLeft('EXPIRADA');
            } else {
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [activeTab, activeRoomId, myRooms]);

    // --- AUTH & ROOMS ---
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) fetchMyRooms(session.user.id);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) fetchMyRooms(session.user.id);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchMyRooms = async (userId: string) => {
        const { data } = await supabase
            .from('room_members')
            .select('room_id, chat_rooms(id, name, emoji, created_by, expires_at)')
            .eq('user_id', userId);

        if (data) {
            const rooms = data.map((item: any) => item.chat_rooms).filter((r: any) => r !== null);
            setMyRooms(rooms);
            if (rooms.length > 0) setActiveRoomId(rooms[0].id);
        }
    };

    // --- REALTIME MESSAGES ---
    useEffect(() => {
        const channelId = activeTab === 'public' ? 'public-chat' : `room-${activeRoomId}`;
        const filter = activeTab === 'public' ? 'room_id=is.null' : `room_id=eq.${activeRoomId}`;

        // Initial Fetch
        const fetchMessages = async () => {
            let query = supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: false }) // Fetch newest first
                .limit(50); // Initial load

            if (activeTab === 'public') {
                query = query.is('room_id', null);
            } else if (activeRoomId) {
                query = query.eq('room_id', activeRoomId);
            } else {
                setMessages([]);
                return;
            }

            const { data } = await query;
            if (data) {
                // Reverse to show oldest at top, newest at bottom
                const loadedMessages = data.reverse().map(msg => ({
                    ...msg,
                    isMe: session?.user?.id === msg.user_id
                }));
                setMessages(loadedMessages);
                setTimeout(() => scrollToBottom(false), 100);
            }
        };

        fetchMessages();

        // Subscription
        const channel = supabase
            .channel(channelId)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: filter
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    newMsg.isMe = session?.user?.id === newMsg.user_id;

                    setMessages(prev => {
                        // Deduplication: Check if message already exists (from optimistic update)
                        if (prev.some(msg => msg.id === newMsg.id)) return prev;

                        // SLIDING BUFFER LOGIC
                        const updated = [...prev, newMsg];
                        if (updated.length > MAX_MESSAGES) {
                            return updated.slice(updated.length - MAX_MESSAGES);
                        }
                        return updated;
                    });

                    // Auto-scroll logic
                    if (isScrolledNearBottom) {
                        setTimeout(() => scrollToBottom(true), 50);
                    } else {
                        setHasNewMessages(true);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeTab, activeRoomId, session, isScrolledNearBottom]); // Added isScrolledNearBottom to dependency to ensure closure captures it? No, ref is better or state. State works here.

    // --- ACTIONS ---
    const handleSendMessage = async () => {
        if (!inputValue.trim() || !session) return;

        // Slow Mode Check
        const now = Date.now();
        if (now - lastMessageTime < SLOW_MODE_DELAY) {
            alert(`Slow Mode: Aguarde ${Math.ceil((SLOW_MODE_DELAY - (now - lastMessageTime)) / 1000)}s`);
            return;
        }

        if (activeTab === 'group' && timeLeft === 'EXPIRADA') {
            alert('Esta sala expirou. Crie uma nova resenha!');
            return;
        }

        // Profanity Check
        const validation = validateMessage(inputValue);
        if (!validation.isValid) {
            setWarning(validation.reason || "Mensagem bloqueada.");
            setTimeout(() => setWarning(null), 4000);
            return;
        }

        const userMeta = session.user.user_metadata;
        const messageData = {
            content: inputValue,
            user_id: session.user.id,
            room_id: activeTab === 'public' ? null : activeRoomId,
            user_meta: {
                name: userMeta.full_name || session.user.email.split('@')[0],
                avatar: userMeta.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`
            }
            // role_badge removed to avoid schema mismatch errors if SQL not run
        };

        setLastMessageTime(now);
        setInputValue(''); // Optimistic clear

        const { data, error } = await supabase.from('messages').insert([messageData]).select().single();

        if (error) {
            console.error('Error sending message:', error);
            alert('Erro ao enviar mensagem.');
            setInputValue(messageData.content); // Restore on error
        } else if (data) {
            // Optimistic Update
            const newMsg = { ...data, isMe: true, user_meta: messageData.user_meta };
            setMessages(prev => [...prev, newMsg]);
            setTimeout(() => scrollToBottom(true), 50);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSendMessage();
    };

    // Room Creation/Joining Logic (Simplified for brevity, same as before)
    const handleCreateRoom = async () => {
        if (!newRoomName.trim() || !session) return;
        const { data: room, error } = await supabase.from('chat_rooms').insert([{
            name: newRoomName, emoji: '🎵', password: newRoomPass || null, created_by: session.user.id
        }]).select().single();
        if (error) return alert(error.message);
        await supabase.from('room_members').insert([{ room_id: room.id, user_id: session.user.id }]);
        setMyRooms([...myRooms, room]); setActiveRoomId(room.id); setActiveTab('group'); setShowCreateModal(false);
    };

    const handleJoinRoom = async () => {
        if (!joinRoomId.trim() || !session) return;

        let query = supabase.from('chat_rooms').select('*');
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(joinRoomId);

        if (isUUID) {
            query = query.eq('id', joinRoomId);
        } else {
            query = query.ilike('name', joinRoomId); // Case insensitive search
        }

        const { data: room, error } = await query.single();

        if (error || !room) return alert('Sala não encontrada.');
        if (room.password && room.password !== joinRoomPass) return alert('Senha incorreta.');

        // Check if already a member
        const { data: existingMember } = await supabase.from('room_members').select('*').eq('room_id', room.id).eq('user_id', session.user.id).single();
        if (existingMember) {
            setMyRooms(prev => prev.some(r => r.id === room.id) ? prev : [...prev, room]);
            setActiveRoomId(room.id);
            setActiveTab('group');
            setShowJoinModal(false);
            return;
        }

        const { error: joinError } = await supabase.from('room_members').insert([{ room_id: room.id, user_id: session.user.id }]);
        if (!joinError) {
            setMyRooms([...myRooms, room]); setActiveRoomId(room.id); setActiveTab('group'); setShowJoinModal(false);
        } else alert('Erro ao entrar.');
    };

    const handleDonate = () => {
        alert('Funcionalidade de doação em breve!');
    };

    return (
        <div className={cn("bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-sky-500/20 flex flex-col overflow-hidden font-sans h-full", className)}>
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-sky-500/10 via-transparent to-transparent pointer-events-none"></div>

            {/* Header */}
            <div className="p-4 bg-transparent border-b border-white/5 flex items-center justify-between z-10 relative">
                <div className="flex flex-col gap-1 min-w-0 flex-1 mr-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-white font-bold text-lg tracking-tight truncate drop-shadow-sm" title={activeTab === 'public' ? 'Chat da Galera' : (myRooms.find(r => r.id === activeRoomId)?.name || 'Minha Resenha')}>
                            {activeTab === 'public' ? 'Chat da Galera' : (myRooms.find(r => r.id === activeRoomId)?.name || 'Minha Resenha')}
                        </h2>
                        {activeTab === 'group' && timeLeft && (
                            <span className="flex-shrink-0 text-xs font-mono bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30 whitespace-nowrap">
                                {timeLeft}
                            </span>
                        )}
                    </div>
                    {activeTab === 'group' && activeRoomId && (
                        <div className="flex">
                            <button
                                onClick={handleCopyRoomId}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 transition-all group whitespace-nowrap"
                                title="Copiar ID da Sala"
                            >
                                {isCopied ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="text-slate-400 group-hover:text-white" />}
                                <span className={cn("text-[10px] font-medium transition-colors", isCopied ? "text-green-400" : "text-slate-400 group-hover:text-white")}>
                                    {isCopied ? 'Copiado!' : 'Copiar ID'}
                                </span>
                            </button>
                        </div>
                    )}
                </div>
                {/* Tabs */}
                <div className="flex bg-black/40 rounded-lg p-1 gap-1 border border-white/5">
                    <button
                        onClick={() => setActiveTab('public')}
                        className={cn("px-3 py-2 rounded-md transition-all flex items-center gap-2 text-sm font-bold", activeTab === 'public' ? "bg-sky-500/20 text-sky-400 shadow-sm" : "text-slate-500 hover:text-slate-300")}
                    >
                        <MessageSquare size={16} />
                        <span className="hidden md:inline">Geral</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('group')}
                        className={cn("px-3 py-2 rounded-md transition-all flex items-center gap-2 text-sm font-bold", activeTab === 'group' ? "bg-sky-500/20 text-sky-400 shadow-sm" : "text-slate-500 hover:text-slate-300")}
                    >
                        <Users size={16} />
                        <span className="hidden md:inline">{myRooms.length > 0 ? 'Minha Resenha' : 'Criar Sala'}</span>
                    </button>
                </div>
            </div>

            {/* Sub-Header for Groups */}
            {activeTab === 'group' && (
                <div className="p-2 bg-black/20 border-b border-white/5 flex gap-2 overflow-x-auto scrollbar-hide z-10 relative">
                    <button onClick={() => setShowCreateModal(true)} className="flex-shrink-0 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1 hover:bg-sky-500 hover:text-white transition-all text-xs font-bold">
                        <Plus size={14} /> Nova Sala
                    </button>
                    <button onClick={() => setShowJoinModal(true)} className="flex-shrink-0 px-3 py-1 rounded-full bg-slate-800/50 text-slate-400 border border-white/10 flex items-center gap-1 hover:bg-white/10 hover:text-white transition-all text-xs font-bold">
                        <Hash size={14} /> Entrar
                    </button>
                    <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
                    {myRooms.map(room => (
                        <button key={room.id} onClick={() => setActiveRoomId(room.id)} className={cn("px-3 py-1 rounded-full text-xs font-bold border transition-all whitespace-nowrap", activeRoomId === room.id ? 'bg-sky-500 text-white border-sky-500' : 'bg-slate-800/50 text-slate-400 border-white/10 hover:border-white/30')}>
                            {room.emoji} {room.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Messages Area */}
            <div
                className="flex-1 overflow-y-auto py-2 space-y-0.5 scrollbar-hide overflow-x-hidden relative z-10"
                ref={messagesContainerRef}
                onScroll={handleScroll}
            >
                {activeTab === 'group' && myRooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-80 animate-fade-in">
                        <div className="w-16 h-16 bg-sky-500/10 rounded-full flex items-center justify-center mb-4 border border-sky-500/20">
                            <Users size={32} className="text-sky-400" />
                        </div>
                        <h3 className="text-white font-bold text-lg mb-2">Crie sua Resenha Privada</h3>
                        <p className="text-slate-400 text-sm mb-6 max-w-[200px]">Junte seus amigos em uma sala exclusiva para comentar o show!</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-3 bg-sky-500 text-white font-bold rounded-full hover:scale-105 transition-transform shadow-lg shadow-sky-500/20 flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Criar Sala Agora
                        </button>
                    </div>
                ) : (
                    <>
                        <AnimatePresence initial={false}>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="group px-2 py-0.5 hover:bg-white/5 transition-colors text-[13px] leading-5 break-words"
                                >
                                    <span className="inline-flex items-center gap-1 mr-1 align-baseline opacity-50 group-hover:opacity-100 transition-opacity select-none">
                                        <span className="text-[10px] text-slate-500 font-mono">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </span>

                                    {/* Badges */}
                                    <span className="inline-flex items-center gap-0.5 mr-1 align-middle">
                                        {msg.role_badge === 'admin' && <Shield size={12} className="text-red-500" />}
                                        {msg.role_badge === 'vip' && <Star size={12} className="text-yellow-500" />}
                                    </span>

                                    {/* Username */}
                                    <span className={cn("font-bold hover:underline cursor-pointer", getUsernameColor(msg.user_meta?.name || 'User'))}>
                                        {msg.user_meta?.name || 'Usuário'}
                                    </span>

                                    <span className="text-slate-500 mr-1.5">:</span>

                                    {/* Message Content */}
                                    <span className={cn("text-slate-200", msg.isMe && "font-medium text-white")}>
                                        {msg.content}
                                    </span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />

                        {/* Smart Auto-Scroll Button */}
                        <AnimatePresence>
                            {!isScrolledNearBottom && hasNewMessages && (
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    onClick={() => scrollToBottom(true)}
                                    className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-sky-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 hover:scale-105 transition-transform z-20"
                                >
                                    <ArrowDown size={14} />
                                    Mais mensagens recentes
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </div>

            {/* Input Area */}
            {session ? (
                <div className="p-4 bg-slate-900/40 border-t border-sky-500/10 backdrop-blur-sm relative">
                    {/* CUSTOM WARNING TOAST */}
                    <AnimatePresence>
                        {warning && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-full left-4 right-4 mb-2 bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl backdrop-blur-md shadow-xl flex items-center gap-3 z-30"
                            >
                                <div className="bg-red-500/20 p-2 rounded-full">
                                    <AlertTriangle size={18} className="text-red-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-xs text-red-500 uppercase tracking-wider mb-0.5">Mensagem Bloqueada</p>
                                    <p className="text-sm">{warning}</p>
                                </div>
                                <button onClick={() => setWarning(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                                    <div className="w-4 h-4 flex items-center justify-center text-red-400">✕</div>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="relative group">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={activeTab === 'public' ? "Comente na live..." : "Mensagem privada..."}
                            className="w-full bg-slate-950/50 text-white placeholder-slate-500 text-sm rounded-full py-3.5 pl-5 pr-24 border border-sky-500/20 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all shadow-inner"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <button
                                onClick={handleDonate}
                                className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/10 transform active:scale-95"
                                title="Fazer uma doação"
                            >
                                <Banknote size={18} />
                            </button>
                            <button
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim()}
                                className="w-9 h-9 rounded-full bg-sky-500 text-white flex items-center justify-center hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                            >
                                <Send size={18} className={inputValue.trim() ? "translate-x-0.5" : ""} />
                            </button>
                        </div>
                    </div>

                </div>
            ) : (
                <div className="p-6 bg-slate-900/60 backdrop-blur-md border-t border-sky-500/10 flex flex-col items-center justify-center text-center gap-3">
                    <p className="text-slate-300 text-sm font-medium">Faça login para participar da resenha!</p>
                    <button
                        onClick={() => window.location.href = '/auth'}
                        className="px-6 py-2.5 bg-sky-500 text-white font-bold rounded-full text-sm hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20 hover:scale-105"
                    >
                        Entrar no Chat
                    </button>
                </div>
            )}

            {/* Modals (Create/Join) */}
            {showCreateModal && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 p-6 rounded-2xl border border-sky-500/20 w-full max-w-sm shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-sky-500/5 pointer-events-none"></div>
                        <h3 className="text-white font-bold text-lg mb-4 relative z-10">Criar Sala Privada</h3>
                        <input type="text" placeholder="Nome da Sala" className="w-full bg-black/40 text-white p-3 rounded-xl border border-white/10 mb-3 focus:border-sky-500 outline-none relative z-10" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} />
                        <input type="password" placeholder="Senha (Opcional)" className="w-full bg-black/40 text-white p-3 rounded-xl border border-white/10 mb-4 focus:border-sky-500 outline-none relative z-10" value={newRoomPass} onChange={e => setNewRoomPass(e.target.value)} />
                        <div className="flex gap-2 relative z-10">
                            <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2 text-slate-400 hover:text-white transition-colors">Cancelar</button>
                            <button onClick={handleCreateRoom} className="flex-1 py-2 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/20">Criar</button>
                        </div>
                    </div>
                </div>
            )}
            {showJoinModal && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 p-6 rounded-2xl border border-sky-500/20 w-full max-w-sm shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-sky-500/5 pointer-events-none"></div>
                        <h3 className="text-white font-bold text-lg mb-4 relative z-10">Entrar em Sala</h3>
                        <input type="text" placeholder="Nome ou ID da Sala" className="w-full bg-black/40 text-white p-3 rounded-xl border border-white/10 mb-3 focus:border-sky-500 outline-none relative z-10" value={joinRoomId} onChange={e => setJoinRoomId(e.target.value)} />
                        <input type="password" placeholder="Senha" className="w-full bg-black/40 text-white p-3 rounded-xl border border-white/10 mb-4 focus:border-sky-500 outline-none relative z-10" value={joinRoomPass} onChange={e => setJoinRoomPass(e.target.value)} />
                        <div className="flex gap-2 relative z-10">
                            <button onClick={() => setShowJoinModal(false)} className="flex-1 py-2 text-slate-400 hover:text-white transition-colors">Cancelar</button>
                            <button onClick={handleJoinRoom} className="flex-1 py-2 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/20">Entrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;
