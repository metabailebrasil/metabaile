import React, { useState, useEffect, useRef } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { Send, Users, MessageSquare, Plus, Hash, Copy, ArrowDown, Shield, Star, Crown, Check, Banknote, AlertTriangle, X, CreditCard, Link as LinkIcon, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChatMessage } from './ChatMessage';
import { Leaderboard, MOCK_DONORS } from './Leaderboard';
import { DonationModal } from './DonationModal';

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

    // Auto-join from URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const inviteRoomId = params.get('joinRoom');
        if (inviteRoomId) {
            setJoinRoomId(inviteRoomId);
            setShowJoinModal(true);
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const [isShareCopied, setIsShareCopied] = useState(false);

    const handleShareRoom = () => {
        if (!activeRoomId) return;
        const link = `${window.location.origin}/?joinRoom=${activeRoomId}`;
        navigator.clipboard.writeText(link);
        setIsShareCopied(true);
        setTimeout(() => setIsShareCopied(false), 2000);
        setTimeout(() => setIsShareCopied(false), 2000);
    };

    const handleDeleteRoom = async (roomId: string) => {
        if (!session) return;
        if (!confirm('Tem certeza que deseja excluir esta sala permanentemente?')) return;

        const { error } = await supabase.from('chat_rooms').delete().eq('id', roomId).eq('created_by', session.user.id);

        if (error) {
            alert('Erro ao excluir sala: ' + error.message);
        } else {
            setMyRooms(prev => prev.filter(r => r.id !== roomId));
            if (activeRoomId === roomId) {
                setActiveRoomId(null);
                const remaining = myRooms.filter(r => r.id !== roomId);
                if (remaining.length > 0) setActiveRoomId(remaining[0].id);
                else setActiveTab('public');
            }
        }
    };





    const virtuosoRef = useRef<VirtuosoHandle>(null);
    // Removed old refs: messagesContainerRef, messagesEndRef

    const handleCopyRoomId = () => {
        if (!activeRoomId) return;
        navigator.clipboard.writeText(activeRoomId);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const scrollToBottom = (smooth = true, targetIndex = -1) => {
        const index = targetIndex >= 0 ? targetIndex : messages.length - 1;
        virtuosoRef.current?.scrollToIndex({ index, behavior: smooth ? 'smooth' : 'auto' });
    };

    // Removed manual handleScroll, handled by Virtuoso

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
                // Pass loaded.length - 1 to ensure we scroll to the actual last item of the NEW list
                setTimeout(() => scrollToBottom(false, loaded.length - 1), 100);
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
        const tempId = crypto.randomUUID();
        const messageData = {
            id: tempId,
            content: inputValue,
            user_id: session.user.id,
            room_id: activeTab === 'public' ? null : activeRoomId,
            user_meta: { name: userMeta.full_name || session.user.email.split('@')[0], avatar: userMeta.avatar_url },
            created_at: new Date().toISOString(),
            status: 'PENDING' as const,
            isMe: true
        };

        // Optimistic Update
        setMessages(prev => [...prev, messageData as Message]);
        setInputValue('');
        setTimeout(() => scrollToBottom(true), 50);
        setLastMessageTime(now);

        const { error } = await supabase.from('messages').insert([{
            content: messageData.content,
            user_id: messageData.user_id,
            room_id: messageData.room_id,
            user_meta: messageData.user_meta,
            // Don't send status/id/created_at, let DB handle it. 
            // We rely on Realtime to replace the pending one, or we can update it here if needed.
        }]);

        if (error) {
            alert('Erro ao enviar.');
            setMessages(prev => prev.filter(m => m.id !== tempId)); // Revert
            setInputValue(messageData.content);
        }
    };

    const handleCreateRoom = async () => {
        if (!newRoomName.trim() || !session) return;

        // 1-Room Limit Check
        const existingOwnRoom = myRooms.find(r => r.created_by === session.user.id);
        if (existingOwnRoom) {
            return alert("Você já possui uma sala criada. Exclua a atual para criar uma nova.");
        }

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

    // Donation Logic (Updated for new Modal)
    const handleDonateConfirm = async (amount: number, message: string) => {
        if (!session) return;
        // setIsProcessingDonation(true); // Handled by Modal now
        const userMeta = session.user.user_metadata;

        // 1. Insert Pending Message & Optimistic Update
        const tempId = crypto.randomUUID();
        const donationMsg = {
            id: tempId,
            content: message || 'Doação para o canal!',
            user_id: session.user.id,
            room_id: activeTab === 'public' ? null : activeRoomId,
            user_meta: { name: userMeta.full_name || session.user.email.split('@')[0], avatar: userMeta.avatar_url },
            is_donation: true,
            donation_amount: amount,
            status: 'PENDING' as const,
            created_at: new Date().toISOString(),
            isMe: true
        };

        // Optimistic show (optional, maybe wait for success?) 
        // For donation, we usually wait for success step. 
        // But let's show it as pending/processing if we want.
        // Actually, the modal handles the "Success" state animation. 
        // Once the modal says success, we should likely see it in chat.

        const { data: msg, error } = await supabase.from('messages').insert([{
            content: donationMsg.content,
            user_id: donationMsg.user_id,
            room_id: donationMsg.room_id,
            user_meta: donationMsg.user_meta,
            is_donation: true,
            donation_amount: amount,
            status: 'PENDING' // Initially pending
        }]).select().single();

        if (error || !msg) {
            console.error(error);
            throw new Error('Erro ao iniciar doação.');
        }

        // 2. SIMULATION MODE (Bypassing Stripe for Test)
        // Wait a bit then confirm
        await new Promise(r => setTimeout(r, 1000));

        const { error: updateError } = await supabase
            .from('messages')
            .update({ status: 'CONFIRMED' })
            .eq('id', msg.id);

        if (updateError) throw new Error('Erro ao confirmar.');

        // Optimistic add to chat now that it is confirmed
        // Realtime will likely catch it too, but this makes it instant after modal success.
        setMessages(prev => [...prev, { ...donationMsg, id: msg.id, status: 'CONFIRMED' } as Message]);
        setTimeout(() => scrollToBottom(true), 50);
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
        <div className={cn("bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 flex flex-col overflow-hidden font-sans h-full", className)}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-sky-500/05 via-transparent to-transparent pointer-events-none"></div>



            {/* MAIN HEADER & TABS */}
            <div className="p-3 bg-gradient-to-b from-slate-900/50 to-transparent border-b border-white/5 flex flex-col gap-2 z-10 relative">

                {/* Main Tabs (Chat vs Ranking) */}
                <div className="flex bg-slate-950/40 rounded-2xl p-1.5 gap-2 border border-white/5 w-full items-center justify-between backdrop-blur-sm">
                    <button
                        onClick={() => setViewMode('chat')}
                        className={cn(
                            "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 relative overflow-hidden group",
                            viewMode === 'chat'
                                ? "bg-slate-800 text-white shadow-lg ring-1 ring-white/10"
                                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                        )}
                    >
                        {viewMode === 'chat' && (
                            <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/10 to-transparent opacity-50"></div>
                        )}
                        <MessageSquare size={16} className={cn("transition-transform group-active:scale-90", viewMode === 'chat' ? "text-sky-400" : "")} />
                        <span className="tracking-wide">CHAT</span>
                    </button>
                    <button
                        onClick={() => setViewMode('ranking')}
                        className={cn(
                            "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 relative overflow-hidden group",
                            viewMode === 'ranking'
                                ? "bg-amber-950/40 text-amber-200 shadow-lg ring-1 ring-amber-500/20"
                                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                        )}
                    >
                        {viewMode === 'ranking' && (
                            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent opacity-50"></div>
                        )}
                        <Crown size={16} className={cn("transition-transform group-active:scale-90", viewMode === 'ranking' ? "text-amber-400" : "")} />
                        <span className="tracking-wide">RANKING</span>
                    </button>
                </div>

                {/* Sub-Tabs (Geral vs Resenha) */}
                {viewMode === 'chat' && (
                    <div className="flex items-center gap-3">
                        <div className="flex bg-black/20 rounded-xl p-1 border border-white/5 flex-1 relative backdrop-blur-md">
                            {/* Animated Pill Background */}
                            <div className={cn(
                                "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-sky-600 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-md shadow-sky-900/20",
                                activeTab === 'public' ? "left-1" : "left-[calc(50%)]"
                            )}>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-lg"></div>
                            </div>

                            <button
                                onClick={() => setActiveTab('public')}
                                className={cn(
                                    "flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors relative z-10 flex items-center justify-center",
                                    activeTab === 'public' ? "text-white" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                Geral
                            </button>
                            <button
                                onClick={() => setActiveTab('group')}
                                className={cn(
                                    "flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors relative z-10 flex items-center justify-center",
                                    activeTab === 'group' ? "text-white" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                Resenha
                            </button>
                        </div>

                        {/* Countdown Timer (Only shows if active) */}
                        <AnimatePresence>
                            {activeTab === 'group' && timeLeft && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, width: 0 }}
                                    animate={{ opacity: 1, scale: 1, width: 'auto' }}
                                    exit={{ opacity: 0, scale: 0.9, width: 0 }}
                                    className="overflow-hidden"
                                >
                                    <span className="text-[10px] font-mono font-bold bg-red-500/10 text-red-300 px-3 py-1.5 rounded-lg border border-red-500/20 shrink-0 whitespace-nowrap flex items-center gap-1.5 shadow-sm">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                        {timeLeft}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
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
                                {activeRoomId && (
                                    <button onClick={handleShareRoom} disabled={isShareCopied} className={cn("flex-shrink-0 px-3 py-1 rounded-full border flex items-center gap-1 text-xs font-bold transition-all duration-300 transform", isShareCopied ? "bg-green-500/20 text-green-400 border-green-500/50 w-24 justify-center" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 active:scale-95")}>
                                        {isShareCopied ? <Check size={14} /> : <LinkIcon size={14} />}
                                        {isShareCopied ? "Copiado!" : "Convidar"}
                                    </button>
                                )}

                                <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
                                {myRooms.map(room => (
                                    <div key={room.id} className={cn("flex items-center rounded-full border transition-all whitespace-nowrap pr-1 flex-shrink-0", activeRoomId === room.id ? 'bg-sky-500 text-white border-sky-500' : 'bg-slate-800/50 text-slate-400 border-white/10')}>
                                        <button onClick={() => setActiveRoomId(room.id)} className="px-3 py-1 text-xs font-bold flex items-center gap-1">
                                            {room.emoji} {room.name}
                                        </button>
                                        {/* DEBUG: Always show button for testing */}
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id); }} className={cn("p-1 rounded-full hover:bg-white/20 transition-colors", "text-red-400")}>
                                            <Trash2 size={14} />
                                        </button>
                                        {/* Original check was: {room.created_by === session?.user?.id && ...} */}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Messages List */}
                        {activeTab === 'group' && myRooms.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-80"><Users size={32} className="text-sky-400 mb-4" /><h3 className="text-white font-bold">Resenha Privada</h3><p className="text-slate-400 text-sm mb-4">Crie uma sala para seus amigos.</p><button onClick={() => setShowCreateModal(true)} className="px-6 py-2 bg-sky-500 text-white font-bold rounded-full">Criar Sala</button></div>
                        ) : (
                            <>
                                <Virtuoso
                                    ref={virtuosoRef}
                                    style={{ height: '100%' }}
                                    data={messages}
                                    itemContent={(index, msg) => <ChatMessage key={msg.id} msg={msg} />}
                                    followOutput={(isAtBottom) => {
                                        if (isAtBottom) {
                                            setHasNewMessages(false);
                                            setIsScrolledNearBottom(true);
                                            return 'smooth';
                                        }
                                        // Start "new messages" only if not at bottom
                                        if (!isScrolledNearBottom) setHasNewMessages(true);
                                        return false;
                                    }}
                                    atBottomStateChange={(atBottom) => {
                                        setIsScrolledNearBottom(atBottom);
                                        if (atBottom) setHasNewMessages(false);
                                    }}
                                    initialTopMostItemIndex={messages.length - 1} // Start at bottom
                                />

                                {!isScrolledNearBottom && hasNewMessages && (
                                    <button
                                        onClick={() => virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, behavior: 'smooth' })}
                                        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-sky-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 z-20 animate-bounce"
                                    >
                                        <ArrowDown size={14} /> Novas mensagens
                                    </button>
                                )}
                            </>
                        )}


                        {/* Input */}
                        {session ? (
                            <div className="p-4 bg-gradient-to-t from-slate-900/90 to-transparent border-t border-white/5 relative z-20">
                                {warning && <div className="absolute bottom-full left-4 right-4 mb-2 bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-2 rounded-xl backdrop-blur-md flex items-center gap-2 text-xs shadow-lg"><AlertTriangle size={14} />{warning}</div>}
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder={activeTab === 'public' ? "Comente na live..." : "Mensagem privada..."}
                                        className="w-full bg-black/20 text-white placeholder-slate-400 text-sm rounded-2xl py-3.5 pl-5 pr-24 border border-white/10 focus:outline-none focus:border-white/20 focus:bg-black/40 focus:ring-1 focus:ring-white/10 transition-all shadow-sm backdrop-blur-sm"
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                        <button onClick={() => setShowDonationModal(true)} className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/10 transform active:scale-95"><Banknote size={16} /></button>
                                        <button onClick={handleSendMessage} disabled={!inputValue.trim()} className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 transform active:scale-95"><Send size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 text-center bg-gradient-to-t from-slate-900/80 to-transparent"><button onClick={() => window.location.href = '/auth'} className="px-8 py-3 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-400 shadow-xl shadow-sky-500/20 transition-all transform active:scale-95 text-sm uppercase tracking-wide">Entrar no Chat</button></div>
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
                        <DonationModal
                            isOpen={showDonationModal}
                            onClose={() => setShowDonationModal(false)}
                            onConfirm={handleDonateConfirm}
                            user={session?.user}
                        />
                    </>
                )}
            </div>
        </div >
    );
};
export default Chat;
