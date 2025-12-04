import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Smile, Users, MessageSquare, Plus, Lock, Hash, Copy, ArrowDown, Shield, Star, Crown, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

    return (
        <div className={cn("bg-[#0F172A] rounded-3xl shadow-2xl border border-white/10 flex flex-col overflow-hidden font-sans h-full", className)}>
            {/* Header */}
            <div className="p-4 bg-[#1E293B]/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between z-10">
                <div className="flex flex-col gap-1 min-w-0 flex-1 mr-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-white font-bold text-lg tracking-tight truncate" title={activeTab === 'public' ? 'Chat da Galera' : (myRooms.find(r => r.id === activeRoomId)?.name || 'Minha Resenha')}>
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
                <div className="flex bg-black/20 rounded-lg p-1 gap-1">
                    <button
                        onClick={() => setActiveTab('public')}
                        className={cn("px-3 py-2 rounded-md transition-all flex items-center gap-2 text-sm font-bold", activeTab === 'public' ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300")}
                    >
                        <MessageSquare size={16} />
                        <span className="hidden md:inline">Geral</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('group')}
                        className={cn("px-3 py-2 rounded-md transition-all flex items-center gap-2 text-sm font-bold", activeTab === 'group' ? "bg-brand-primary/20 text-brand-primary" : "text-slate-500 hover:text-slate-300")}
                    >
                        <Users size={16} />
                        <span className="hidden md:inline">{myRooms.length > 0 ? 'Minha Resenha' : 'Criar Sala'}</span>
                    </button>
                </div>
            </div>

            {/* Sub-Header for Groups */}
            {activeTab === 'group' && (
                <div className="p-2 bg-[#0F172A] border-b border-white/5 flex gap-2 overflow-x-auto scrollbar-hide">
                    <button onClick={() => setShowCreateModal(true)} className="flex-shrink-0 px-3 py-1 rounded-full bg-brand-primary/20 text-brand-primary border border-brand-primary/30 flex items-center gap-1 hover:bg-brand-primary hover:text-black transition-all text-xs font-bold">
                        <Plus size={14} /> Nova Sala
                    </button>
                    <button onClick={() => setShowJoinModal(true)} className="flex-shrink-0 px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-white/10 flex items-center gap-1 hover:bg-white/10 hover:text-white transition-all text-xs font-bold">
                        <Hash size={14} /> Entrar
                    </button>
                    <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
                    {myRooms.map(room => (
                        <button key={room.id} onClick={() => setActiveRoomId(room.id)} className={cn("px-3 py-1 rounded-full text-xs font-bold border transition-all whitespace-nowrap", activeRoomId === room.id ? 'bg-brand-primary text-black border-brand-primary' : 'bg-slate-800 text-slate-400 border-white/10 hover:border-white/30')}>
                            {room.emoji} {room.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Messages Area */}
            <div
                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide relative"
                ref={messagesContainerRef}
                onScroll={handleScroll}
            >
                {activeTab === 'group' && myRooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-80 animate-fade-in">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <Users size={32} className="text-brand-primary" />
                        </div>
                        <h3 className="text-white font-bold text-lg mb-2">Crie sua Resenha Privada</h3>
                        <p className="text-slate-400 text-sm mb-6 max-w-[200px]">Junte seus amigos em uma sala exclusiva para comentar o show!</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-3 bg-brand-primary text-black font-bold rounded-full hover:scale-105 transition-transform shadow-lg shadow-brand-primary/20 flex items-center gap-2"
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
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className={cn("flex gap-3 group", msg.isMe && "flex-row-reverse")}
                                >
                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                        <img
                                            src={msg.user_meta?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.user_id}`}
                                            alt="Avatar"
                                            className="w-8 h-8 rounded-full object-cover border border-white/10 ring-2 ring-transparent group-hover:ring-white/10 transition-all"
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className={cn("flex flex-col max-w-[85%]", msg.isMe ? "items-end" : "items-start")}>
                                        <div className="flex items-baseline gap-2 mb-0.5">
                                            {/* Badges */}
                                            {msg.role_badge === 'admin' && <Shield size={12} className="text-red-500" />}
                                            {msg.role_badge === 'vip' && <Star size={12} className="text-yellow-500" />}

                                            {/* Username */}
                                            <span className={cn("text-sm font-bold tracking-wide", msg.isMe ? "text-white" : getUsernameColor(msg.user_meta?.name || 'User'))}>
                                                {msg.user_meta?.name || 'Usuário'}
                                            </span>

                                            {/* Timestamp */}
                                            <span className="text-[10px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        {/* Message Bubble / Text */}
                                        <p className={cn("text-[15px] leading-relaxed font-medium", msg.isMe ? "text-slate-200 text-right" : "text-slate-300")}>
                                            {msg.content}
                                        </p>
                                    </div>
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
                                    className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-brand-primary text-brand-dark px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 hover:scale-105 transition-transform z-20"
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
                <div className="p-4 bg-[#1E293B]/30 border-t border-white/5 backdrop-blur-sm">
                    <div className="relative group">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={activeTab === 'public' ? "Comente na live..." : "Mensagem privada..."}
                            className="w-full bg-[#0F172A] text-white placeholder-slate-500 text-sm rounded-full py-3.5 pl-5 pr-12 border border-white/10 focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/50 transition-all shadow-inner"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-brand-primary text-brand-dark flex items-center justify-center hover:bg-white transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                        >
                            <Send size={18} className={inputValue.trim() ? "translate-x-0.5" : ""} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between mt-2 px-2">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[10px] text-slate-400 font-medium tracking-wide">Conectado</span>
                        </div>
                        <span className="text-[10px] text-slate-600">Slow Mode: 3s</span>
                    </div>
                </div>
            ) : (
                <div className="p-6 bg-[#1E293B]/80 backdrop-blur-md border-t border-white/5 flex flex-col items-center justify-center text-center gap-3">
                    <p className="text-slate-300 text-sm font-medium">Faça login para participar da resenha!</p>
                    <button
                        onClick={() => window.location.href = '/auth'}
                        className="px-6 py-2.5 bg-brand-primary text-brand-dark font-bold rounded-full text-sm hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/20 hover:scale-105"
                    >
                        Entrar no Chat
                    </button>
                </div>
            )}

            {/* Modals (Create/Join) - Kept simple */}
            {showCreateModal && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1E293B] p-6 rounded-2xl border border-white/10 w-full max-w-sm shadow-2xl">
                        <h3 className="text-white font-bold text-lg mb-4">Criar Sala Privada</h3>
                        <input type="text" placeholder="Nome da Sala" className="w-full bg-[#0F172A] text-white p-3 rounded-xl border border-white/10 mb-3 focus:border-brand-primary outline-none" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} />
                        <input type="password" placeholder="Senha (Opcional)" className="w-full bg-[#0F172A] text-white p-3 rounded-xl border border-white/10 mb-4 focus:border-brand-primary outline-none" value={newRoomPass} onChange={e => setNewRoomPass(e.target.value)} />
                        <div className="flex gap-2">
                            <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2 text-slate-400 hover:text-white transition-colors">Cancelar</button>
                            <button onClick={handleCreateRoom} className="flex-1 py-2 bg-brand-primary text-black font-bold rounded-xl hover:bg-brand-secondary transition-colors">Criar</button>
                        </div>
                    </div>
                </div>
            )}
            {showJoinModal && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1E293B] p-6 rounded-2xl border border-white/10 w-full max-w-sm shadow-2xl">
                        <h3 className="text-white font-bold text-lg mb-4">Entrar em Sala</h3>
                        <input type="text" placeholder="Nome ou ID da Sala" className="w-full bg-[#0F172A] text-white p-3 rounded-xl border border-white/10 mb-3 focus:border-brand-primary outline-none" value={joinRoomId} onChange={e => setJoinRoomId(e.target.value)} />
                        <input type="password" placeholder="Senha" className="w-full bg-[#0F172A] text-white p-3 rounded-xl border border-white/10 mb-4 focus:border-brand-primary outline-none" value={joinRoomPass} onChange={e => setJoinRoomPass(e.target.value)} />
                        <div className="flex gap-2">
                            <button onClick={() => setShowJoinModal(false)} className="flex-1 py-2 text-slate-400 hover:text-white transition-colors">Cancelar</button>
                            <button onClick={handleJoinRoom} className="flex-1 py-2 bg-brand-primary text-black font-bold rounded-xl hover:bg-brand-secondary transition-colors">Entrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;
