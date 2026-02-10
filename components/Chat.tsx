import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, MessageSquare, Plus, Hash, Copy, ArrowDown, Shield, Star, Crown, Check, Banknote, AlertTriangle, X, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChatMessage } from './ChatMessage';
import { Leaderboard, MOCK_DONORS } from './Leaderboard';

// --- MODERATOR SENTINEL RULES ---
const BLOCK_PATTERNS = [
    /vtn[cm]?/i, /vsf/i, /fdp/i, /cuz[aÃ̃ã]o/i, /c[uú]zao/i, /arrombad[oa]/i, /otari[oa]/i,
    /imbecil/i, /lixo/i, /inuti[l]/i, /burr[oa]/i, /idiota/i, /retardad[oa]/i, /autist[a4]/i,
    /doente/i, /filh[oa][ ]?d[ae][ ]?puta/i, /macac[oa]/i, /m4c4c[oa]/i, /pret[oa][ ]?fedid[oa]/i,
    /viad[oa]/i, /bi[cx]a/i, /travec[oa]/i, /mari[kc]a/i, /boiola/i, /sapat[aÃ̃ã]o/i,
    /chupa[ ]?meu/i, /sent[a4][ ]?n[a4]/i, /mostr[a4][ ]?(a|o|os|as)/i, /xerec[a4]/i,
    /bucet[a4]/i, /pir[0o]c[a4]/i, /nudes/i, /f\.?d\.?p/i, /c\.?u/i, /v\.?t\.?n\.?c/i
];

const validateMessage = (text: string): { isValid: boolean; reason?: string } => {
    const normalized = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (/(.)\1{49,}/.test(text)) return { isValid: false, reason: 'Sem flood! (Muitas letras repetidas)' };
    if (/http[s]?:\/\//i.test(text) || /www\./i.test(text) || /\.com/i.test(text)) return { isValid: false, reason: 'Links não são permitidos.' };
    for (const pattern of BLOCK_PATTERNS) {
        if (pattern.test(normalized) || pattern.test(text)) return { isValid: false, reason: 'Mantenha o respeito! Sem ofensas.' };
    }
    return { isValid: true };
};

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const getUsernameColor = (username: string) => {
    const colors = ['text-pink-500', 'text-purple-500', 'text-indigo-500', 'text-blue-500', 'text-cyan-500', 'text-teal-500', 'text-green-500', 'text-lime-500', 'text-yellow-500', 'text-orange-500', 'text-red-500'];
    let hash = 0;
    for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};

interface Message {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    room_id: string | null;
    role_badge?: 'user' | 'vip' | 'admin' | 'moderator';
    user_meta: { name: string; avatar: string; };
    isMe?: boolean;
    is_donation?: boolean;
    donation_amount?: number;
    status?: 'PENDING' | 'CONFIRMED';
}

interface ChatRoom {
    id: string;
    name: string;
    emoji: string;
    created_by: string;
    expires_at: string;
}

const MAX_MESSAGES = 100;
const SLOW_MODE_DELAY = 1000; // Adjusted for better UX

const Chat: React.FC<{ className?: string }> = ({ className = '' }) => {
    const [activeTab, setActiveTab] = useState<'public' | 'group'>('public');
    const [viewMode, setViewMode] = useState<'chat' | 'ranking'>('chat');
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

    // Donation State
    const [showDonationModal, setShowDonationModal] = useState(false);
    const [selectedAmount, setSelectedAmount] = useState<number>(5);
    const [donationMessage, setDonationMessage] = useState('');
    const [isProcessingDonation, setIsProcessingDonation] = useState(false);

    // Form State
    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomPass, setNewRoomPass] = useState('');
    const [joinRoomId, setJoinRoomId] = useState('');
    const [joinRoomPass, setJoinRoomPass] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [warning, setWarning] = useState<string | null>(null);

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleCopyRoomId = () => {
        if (!activeRoomId) return;
        navigator.clipboard.writeText(activeRoomId);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const scrollToBottom = (smooth = true) => {
        if (messagesContainerRef.current) {
            const { scrollHeight, clientHeight } = messagesContainerRef.current;
            messagesContainerRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior: smooth ? 'smooth' : 'auto' });
            setHasNewMessages(false);
            setIsScrolledNearBottom(true);
        }
    };

    const handleScroll = () => {
        if (!messagesContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        setIsScrolledNearBottom(scrollHeight - scrollTop - clientHeight < 100);
        if (scrollHeight - scrollTop - clientHeight < 100) setHasNewMessages(false);
    };

    // Timer Logic
    useEffect(() => {
        if (activeTab === 'public' || !activeRoomId) { setTimeLeft(''); return; }
        const room = myRooms.find(r => r.id === activeRoomId);
        if (!room) return;
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const expireTime = new Date(room.expires_at).getTime();
            const distance = expireTime - now;
            if (distance < 0) setTimeLeft('EXPIRADA');
            else {
                const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((distance % (1000 * 60)) / 1000);
                setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [activeTab, activeRoomId, myRooms]);

    // Auth & Messages
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) fetchMyRooms(session.user.id);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
            setSession(session);
            if (session) fetchMyRooms(session.user.id);
        });
        return () => subscription.unsubscribe();
    }, []);

    const fetchMyRooms = async (userId: string) => {
        const { data } = await supabase.from('room_members').select('room_id, chat_rooms(id, name, emoji, created_by, expires_at)').eq('user_id', userId);
        if (data) {
            const rooms = data.map((item: any) => item.chat_rooms).filter((r: any) => r !== null);
            setMyRooms(rooms);
            if (rooms.length > 0 && !activeRoomId) setActiveRoomId(rooms[0].id);
        }
    };

    // Realtime
    useEffect(() => {
        const channelId = activeTab === 'public' ? 'public-chat' : `room-${activeRoomId}`;
        const filter = activeTab === 'public' ? 'room_id=is.null' : `room_id=eq.${activeRoomId}`;

        const fetchMessages = async () => {
            let query = supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(50);
            if (activeTab === 'public') query = query.is('room_id', null).or('is_donation.eq.false,status.eq.CONFIRMED'); // Show CONFIRMED donations or normal messages
            else if (activeRoomId) query = query.eq('room_id', activeRoomId);
            else { setMessages([]); return; }

            const { data } = await query;
            if (data) {
                const loaded = data.reverse()
                    .filter(m => !m.is_donation || m.status === 'CONFIRMED')
                    .map(msg => ({ ...msg, isMe: session?.user?.id === msg.user_id }));
                setMessages(loaded);
                setTimeout(() => scrollToBottom(false), 100);
            }
        };

        fetchMessages();

        const channel = supabase.channel(channelId)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: activeTab === 'public' ? undefined : filter }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    const newMsg = payload.new as Message;
                    if (newMsg.is_donation && newMsg.status !== 'CONFIRMED') return;
                    if (activeTab === 'public' && newMsg.room_id !== null) return;

                    newMsg.isMe = session?.user?.id === newMsg.user_id;
                    setMessages(prev => {
                        if (prev.some(msg => msg.id === newMsg.id)) return prev;
                        const updated = [...prev, newMsg];
                        return updated.length > MAX_MESSAGES ? updated.slice(updated.length - MAX_MESSAGES) : updated;
                    });
                    if (isScrolledNearBottom) setTimeout(() => scrollToBottom(true), 50);
                    else setHasNewMessages(true);
                } else if (payload.eventType === 'UPDATE') {
                    const updatedMsg = payload.new as Message;
                    // If status changed to CONFIRMED, add it if not present
                    if (updatedMsg.status === 'CONFIRMED' && (activeTab !== 'public' ? updatedMsg.room_id === activeRoomId : updatedMsg.room_id === null)) {
                        setMessages(prev => {
                            const exists = prev.find(m => m.id === updatedMsg.id);
                            if (exists) return prev.map(m => m.id === updatedMsg.id ? { ...updatedMsg, isMe: session?.user?.id === updatedMsg.user_id } : m);
                            // It's a new confirmed message (previously pending)
                            const updated = [...prev, { ...updatedMsg, isMe: session?.user?.id === updatedMsg.user_id }];
                            return updated.length > MAX_MESSAGES ? updated.slice(updated.length - MAX_MESSAGES) : updated.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                        });
                        setTimeout(() => scrollToBottom(true), 50);
                    }
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [activeTab, activeRoomId, session]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !session) return;
        const now = Date.now();
        if (now - lastMessageTime < SLOW_MODE_DELAY) return alert(`Aguarde ${Math.ceil((SLOW_MODE_DELAY - (now - lastMessageTime)) / 1000)}s`);

        const validation = validateMessage(inputValue);
        if (!validation.isValid) {
            setWarning(validation.reason || "Erro"); setTimeout(() => setWarning(null), 4000); return;
        }

        const userMeta = session.user.user_metadata;
        const messageData = {
            content: inputValue,
            user_id: session.user.id,
            room_id: activeTab === 'public' ? null : activeRoomId,
            user_meta: { name: userMeta.full_name || session.user.email.split('@')[0], avatar: userMeta.avatar_url }
        };

        setLastMessageTime(now);
        setInputValue('');
        const { error } = await supabase.from('messages').insert([messageData]);
        if (error) { alert('Erro ao enviar.'); setInputValue(messageData.content); }
    };

    const handleCreateRoom = async () => {
        if (!newRoomName.trim() || !session) return;
        const { data: room, error } = await supabase.from('chat_rooms').insert([{ name: newRoomName, emoji: '🎵', password: newRoomPass || null, created_by: session.user.id }]).select().single();
        if (error) return alert(error.message);
        await supabase.from('room_members').insert([{ room_id: room.id, user_id: session.user.id }]);
        setMyRooms([...myRooms, room]); setActiveRoomId(room.id); setActiveTab('group'); setShowCreateModal(false);
    };

    const handleJoinRoom = async () => {
        if (!joinRoomId.trim() || !session) return;
        let query = supabase.from('chat_rooms').select('*');
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(joinRoomId);
        if (isUUID) query = query.eq('id', joinRoomId);
        else query = query.ilike('name', joinRoomId);
        const { data: room, error } = await query.single();
        if (error || !room) return alert('Sala não encontrada.');
        if (room.password && room.password !== joinRoomPass) return alert('Senha incorreta.');
        const { data: ex } = await supabase.from('room_members').select('*').eq('room_id', room.id).eq('user_id', session.user.id).single();
        if (ex) { setMyRooms(prev => prev.some(r => r.id === room.id) ? prev : [...prev, room]); setActiveRoomId(room.id); setActiveTab('group'); setShowJoinModal(false); return; }
        const { error: jError } = await supabase.from('room_members').insert([{ room_id: room.id, user_id: session.user.id }]);
        if (!jError) { setMyRooms([...myRooms, room]); setActiveRoomId(room.id); setActiveTab('group'); setShowJoinModal(false); }
    };

    // Donation Logic
    const handleDonateConfirm = async () => {
        if (!session) return alert('Faça login para doar!');
        setIsProcessingDonation(true);
        const userMeta = session.user.user_metadata;

        // 1. Insert Pending Message
        const { data: msg, error } = await supabase.from('messages').insert([{
            content: donationMessage || 'Doação para o canal!',
            user_id: session.user.id,
            room_id: activeTab === 'public' ? null : activeRoomId,
            user_meta: { name: userMeta.full_name || session.user.email.split('@')[0], avatar: userMeta.avatar_url },
            is_donation: true,
            donation_amount: selectedAmount,
            status: 'PENDING'
        }]).select().single();

        if (error || !msg) {
            console.error(error);
            alert('Erro ao iniciar doação.');
            setIsProcessingDonation(false);
            return;
        }

        // 2. SIMULATION MODE (Bypassing Stripe for Test)
        try {
            // Simulate processing time
            setTimeout(async () => {
                const { error: updateError } = await supabase
                    .from('messages')
                    .update({ status: 'CONFIRMED' })
                    .eq('id', msg.id);

                if (updateError) {
                    alert('Erro ao confirmar doação simulada.');
                } else {
                    setShowDonationModal(false);
                    setDonationMessage('');
                }
                setIsProcessingDonation(false);
            }, 1500);

        } catch (e) {
            alert('Erro de conexão.');
            setIsProcessingDonation(false);
        }
    };

    // Pinned Messages logic:
    // Only CONFIRMED donations, amount >= 10, within time window.
    // 10-50: 2 mins (120000ms)
    // 50+: 10 mins (600000ms)
    const pinnedMessages = messages.filter(m => {
        if (!m.is_donation || m.status !== 'CONFIRMED') return false;
        const amount = m.donation_amount || 0;
        if (amount < 10) return false;
        const age = Date.now() - new Date(m.created_at).getTime();
        const duration = amount >= 50 ? 600000 : 120000;
        return age < duration;
    });

    return (
        <div className={cn("bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-sky-500/20 flex flex-col overflow-hidden font-sans h-full", className)}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-sky-500/10 via-transparent to-transparent pointer-events-none"></div>



            {/* MAIN HEADER & TABS */}
            <div className="p-3 bg-transparent border-b border-white/5 flex flex-col gap-3 z-10 relative">

                {/* Main Tabs (Chat vs Ranking) */}
                <div className="flex bg-black/40 rounded-xl p-1 gap-1 border border-white/5 w-full">
                    <button
                        onClick={() => setViewMode('chat')}
                        className={cn(
                            "flex-1 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                            viewMode === 'chat' ? "bg-slate-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        <MessageSquare size={16} /> Chat
                    </button>
                    <button
                        onClick={() => setViewMode('ranking')}
                        className={cn(
                            "flex-1 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                            viewMode === 'ranking' ? "bg-yellow-600/20 text-yellow-400 border border-yellow-500/20 shadow-sm" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        <Crown size={16} /> Ranking
                    </button>
                </div>

                {/* Sub-Tabs (Only visible in Chat mode) */}
                {viewMode === 'chat' && (
                    <div className="flex justify-between items-center">
                        <div className="flex gap-4 px-2">
                            <button onClick={() => setActiveTab('public')} className={cn("text-sm font-bold transition-colors relative", activeTab === 'public' ? "text-white" : "text-slate-500")}>
                                Geral
                                {activeTab === 'public' && <motion.div layoutId="underline" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-sky-500 rounded-full" />}
                            </button>
                            <button onClick={() => setActiveTab('group')} className={cn("text-sm font-bold transition-colors relative", activeTab === 'group' ? "text-white" : "text-slate-500")}>
                                Resenha
                                {activeTab === 'group' && <motion.div layoutId="underline" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-sky-500 rounded-full" />}
                            </button>
                        </div>
                        {activeTab === 'group' && timeLeft && <span className="text-xs font-mono bg-red-500/20 text-red-400 px-2 py-0.5 rounded ml-auto">{timeLeft}</span>}
                    </div>
                )}

            </div>

            {/* KING OF THE HILL BANNER (Visible in Chat Mode) */}
            {viewMode === 'chat' && (
                <div className="bg-gradient-to-r from-yellow-600/20 via-yellow-500/10 to-transparent border-b border-yellow-500/20 px-3 py-1.5 flex items-center gap-2 relative z-10 shrink-0">
                    <Crown size={14} className="text-yellow-400 animate-pulse" fill="currentColor" />
                    <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider">Rei do Baile:</span>
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <img src={MOCK_DONORS[0].avatar} className="w-4 h-4 rounded-full border border-yellow-500/50" alt="Top 1" />
                        <span className="text-xs font-bold text-yellow-100 truncate">{MOCK_DONORS[0].name}</span>
                        <span className="text-[10px] text-yellow-400 font-mono">R$ {MOCK_DONORS[0].amount}</span>
                    </div>
                </div>
            )}

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-hidden relative z-10 flex flex-col">
                {viewMode === 'ranking' ? (
                    <Leaderboard />
                ) : (
                    <>
                        {/* Pinned Donations (Only in Public Chat) */}
                        {pinnedMessages.length > 0 && activeTab === 'public' && (
                            <div className="bg-gradient-to-r from-amber-500/10 to-transparent border-b border-amber-500/20 p-2 flex gap-2 overflow-x-auto scrollbar-hide z-10 relative shrink-0">
                                {pinnedMessages.map(msg => (
                                    <div key={msg.id} className="flex-shrink-0 bg-slate-900/80 border border-amber-500/40 rounded-lg p-2 min-w-[200px] flex items-start gap-2 max-w-[300px]">
                                        <img src={msg.user_meta?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.user_id}`} className="w-8 h-8 rounded-full bg-slate-800" />
                                        <div className="overflow-hidden">
                                            <p className="text-xs font-bold text-amber-400 flex items-center gap-1">
                                                <Crown size={10} /> R$ {msg.donation_amount?.toFixed(2)}
                                            </p>
                                            <p className="text-xs text-white truncate font-medium">{msg.user_meta?.name}</p>
                                            <p className="text-[11px] text-slate-300 truncate">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Tabs for Groups */}
                        {activeTab === 'group' && (
                            <div className="p-2 bg-black/20 border-b border-white/5 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
                                {/* ... existing group buttons ... */}
                                <button onClick={() => setShowCreateModal(true)} className="flex-shrink-0 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1 text-xs font-bold"><Plus size={14} /> Nova</button>
                                <button onClick={() => setShowJoinModal(true)} className="flex-shrink-0 px-3 py-1 rounded-full bg-slate-800/50 text-slate-400 border border-white/10 flex items-center gap-1 text-xs font-bold"><Hash size={14} /> Entrar</button>
                                <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
                                {myRooms.map(room => (
                                    <button key={room.id} onClick={() => setActiveRoomId(room.id)} className={cn("px-3 py-1 rounded-full text-xs font-bold border transition-all whitespace-nowrap", activeRoomId === room.id ? 'bg-sky-500 text-white border-sky-500' : 'bg-slate-800/50 text-slate-400 border-white/10')}>{room.emoji} {room.name}</button>
                                ))}
                            </div>
                        )}

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto py-2 space-y-1 scrollbar-hide overflow-x-hidden relative" ref={messagesContainerRef} onScroll={handleScroll}>
                            {activeTab === 'group' && myRooms.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-80"><Users size={32} className="text-sky-400 mb-4" /><h3 className="text-white font-bold">Resenha Privada</h3><p className="text-slate-400 text-sm mb-4">Crie uma sala para seus amigos.</p><button onClick={() => setShowCreateModal(true)} className="px-6 py-2 bg-sky-500 text-white font-bold rounded-full">Criar Sala</button></div>
                            ) : (
                                <>
                                    <AnimatePresence initial={false}>
                                        {messages.map((msg) => (
                                            <ChatMessage key={msg.id} msg={msg} />
                                        ))}
                                    </AnimatePresence>
                                    <div ref={messagesEndRef} />
                                    {!isScrolledNearBottom && hasNewMessages && (
                                        <button onClick={() => scrollToBottom(true)} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-sky-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2"><ArrowDown size={14} /> Novas mensagens</button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Input */}
                        {session ? (
                            <div className="p-4 bg-slate-900/40 border-t border-sky-500/10 backdrop-blur-sm relative">
                                {warning && <div className="absolute bottom-full left-4 right-4 mb-2 bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-2 rounded-xl backdrop-blur-md flex items-center gap-2 text-xs"><AlertTriangle size={14} />{warning}</div>}
                                <div className="relative group">
                                    <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder={activeTab === 'public' ? "Comente na live..." : "Mensagem privada..."} className="w-full bg-slate-950/50 text-white placeholder-slate-500 text-sm rounded-full py-3.5 pl-5 pr-24 border border-sky-500/20 focus:outline-none focus:border-sky-500/50 focus:ring-1 transition-all shadow-inner" />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                        <button onClick={() => setShowDonationModal(true)} className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/10 transform active:scale-95"><Banknote size={18} /></button>
                                        <button onClick={handleSendMessage} disabled={!inputValue.trim()} className="w-9 h-9 rounded-full bg-sky-500 text-white flex items-center justify-center hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 transform active:scale-95"><Send size={18} /></button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 text-center"><button onClick={() => window.location.href = '/auth'} className="px-6 py-2.5 bg-sky-500 text-white font-bold rounded-full hover:bg-sky-400 shadow-lg">Entrar no Chat</button></div>
                        )}

                        {/* Modals */}
                        {(showCreateModal || showJoinModal) && (
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                <div className="bg-slate-900 p-6 rounded-2xl border border-sky-500/20 w-full max-w-sm relative">
                                    <h3 className="text-white font-bold text-lg mb-4">{showCreateModal ? 'Criar Sala' : 'Entrar na Sala'}</h3>
                                    <input type="text" placeholder={showCreateModal ? "Nome" : "Nome ou ID"} className="w-full bg-black/40 text-white p-3 rounded-xl border border-white/10 mb-3" value={showCreateModal ? newRoomName : joinRoomId} onChange={e => showCreateModal ? setNewRoomName(e.target.value) : setJoinRoomId(e.target.value)} />
                                    <input type="password" placeholder="Senha (Opcional)" className="w-full bg-black/40 text-white p-3 rounded-xl border border-white/10 mb-4" value={showCreateModal ? newRoomPass : joinRoomPass} onChange={e => showCreateModal ? setNewRoomPass(e.target.value) : setJoinRoomPass(e.target.value)} />
                                    <div className="flex gap-2"><button onClick={() => { setShowCreateModal(false); setShowJoinModal(false) }} className="flex-1 py-2 text-slate-400">Cancelar</button><button onClick={showCreateModal ? handleCreateRoom : handleJoinRoom} className="flex-1 py-2 bg-sky-500 text-white font-bold rounded-xl">Confirmar</button></div>
                                </div>
                            </div>
                        )}

                        {/* Donation Modal */}
                        {showDonationModal && (
                            <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
                                <div className="bg-slate-900 w-full max-w-xs rounded-3xl border border-emerald-500/30 shadow-2xl overflow-hidden flex flex-col">
                                    <div className="bg-emerald-500/10 p-4 border-b border-emerald-500/20 text-center relative">
                                        <button onClick={() => setShowDonationModal(false)} className="absolute top-2 right-2 text-slate-400 hover:text-white"><X size={20} /></button>
                                        <Banknote size={32} className="mx-auto text-emerald-400 mb-2" />
                                        <h3 className="text-white font-bold text-lg">Super Chat</h3>
                                        <p className="text-emerald-300 text-xs">Destaque sua mensagem!</p>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <div className="grid grid-cols-4 gap-2">
                                            {[5, 10, 20, 50].map(val => (
                                                <button
                                                    key={val}
                                                    onClick={() => setSelectedAmount(val)}
                                                    className={cn("py-2 px-1 rounded-xl text-sm font-bold border transition-all", selectedAmount === val ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20" : "bg-slate-800 text-slate-400 border-slate-700 hover:border-emerald-500/50")}
                                                >
                                                    R${val}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="bg-slate-950/50 p-3 rounded-xl border border-emerald-500/20">
                                            <span className={cn("text-xs font-bold mb-1 block", selectedAmount >= 50 ? "text-amber-400" : (selectedAmount >= 10 ? "text-pink-400" : "text-emerald-400"))}>
                                                {selectedAmount >= 50 ? "Dourado + Pin 10min" : (selectedAmount >= 10 ? "Destacado + Pin 2min" : "Borda Colorida")}
                                            </span>
                                            <textarea
                                                value={donationMessage}
                                                onChange={e => setDonationMessage(e.target.value.slice(0, 200))}
                                                placeholder="Sua mensagem de apoio..."
                                                className="w-full bg-transparent text-white text-sm focus:outline-none resize-none h-16"
                                            />
                                            <div className="text-right text-[10px] text-slate-500">{donationMessage.length}/200</div>
                                        </div>
                                        <button
                                            onClick={handleDonateConfirm}
                                            disabled={isProcessingDonation}
                                            className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                                        >
                                            {isProcessingDonation ? "Processando..." : (
                                                <>
                                                    <CreditCard size={18} />
                                                    Pagar R$ {selectedAmount},00
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
export default Chat;
