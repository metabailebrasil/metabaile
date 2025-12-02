import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, Flame, Heart, Users, MessageSquare, X, MoreVertical, Plus, Lock, Hash, Copy } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Message {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    room_id: string | null;
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

const Chat: React.FC<{ className?: string }> = ({ className = '' }) => {
    const [activeTab, setActiveTab] = useState<'public' | 'group'>('public');
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [session, setSession] = useState<any>(null);

    // Private Room State
    const [myRooms, setMyRooms] = useState<ChatRoom[]>([]);
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

    // Notifications
    const [unreadPrivate, setUnreadPrivate] = useState(false);

    // Expiration Timer
    const [timeLeft, setTimeLeft] = useState<string>('');

    // Form State
    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomPass, setNewRoomPass] = useState('');
    const [joinRoomId, setJoinRoomId] = useState('');
    const [joinRoomPass, setJoinRoomPass] = useState('');

    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Timer Logic
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

    // 1. Auth & Initial Load
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

    // 2. Fetch User's Rooms
    const fetchMyRooms = async (userId: string) => {
        const { data, error } = await supabase
            .from('room_members')
            .select('room_id, chat_rooms(id, name, emoji, created_by, expires_at)')
            .eq('user_id', userId);

        if (data) {
            const rooms = data.map((item: any) => item.chat_rooms);
            setMyRooms(rooms);
            if (rooms.length > 0) setActiveRoomId(rooms[0].id);
        }
    };

    // 3. Realtime Subscription
    useEffect(() => {
        // Determine which channel to listen to
        const channelId = activeTab === 'public' ? 'public-chat' : `room-${activeRoomId}`;
        const filter = activeTab === 'public' ? 'room_id=is.null' : `room_id=eq.${activeRoomId}`;

        // Fetch initial messages for this view
        const fetchMessages = async () => {
            let query = supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: true })
                .limit(50);

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
                setMessages(data.map(msg => ({
                    ...msg,
                    isMe: session?.user?.id === msg.user_id
                })));
            }
        };

        fetchMessages();

        // Subscribe to new messages
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
                    setMessages(prev => [...prev, newMsg]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeTab, activeRoomId, session]);

    // 4. Send Message
    const handleSendMessage = async () => {
        if (!inputValue.trim() || !session) return;

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
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`
            }
        };

        const { error } = await supabase.from('messages').insert([messageData]);

        if (error) {
            console.error('Error sending message:', error);
            alert('Erro ao enviar mensagem. Tente novamente.');
        } else {
            setInputValue('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSendMessage();
    };

    // 5. Create Room
    const handleCreateRoom = async () => {
        if (!newRoomName.trim() || !session) return;

        // Create Room
        const { data: room, error: roomError } = await supabase
            .from('chat_rooms')
            .insert([{
                name: newRoomName,
                emoji: '🎵',
                password: newRoomPass || null,
                created_by: session.user.id
            }])
            .select()
            .single();

        if (roomError) {
            alert('Erro ao criar sala: ' + roomError.message);
            return;
        }

        // Add Creator as Member
        const { error: memberError } = await supabase
            .from('room_members')
            .insert([{
                room_id: room.id,
                user_id: session.user.id
            }]);

        if (!memberError) {
            setMyRooms([...myRooms, room]);
            setActiveRoomId(room.id);
            setActiveTab('group');
            setShowCreateModal(false);
            setNewRoomName('');
            setNewRoomPass('');
        }
    };

    // 6. Join Room
    const handleJoinRoom = async () => {
        if (!joinRoomId.trim() || !session) return;

        // Verify Room Exists & Password
        const { data: room, error: roomError } = await supabase
            .from('chat_rooms')
            .select('*')
            .eq('id', joinRoomId)
            .single();

        if (roomError || !room) {
            alert('Sala não encontrada.');
            return;
        }

        if (room.password && room.password !== joinRoomPass) {
            alert('Senha incorreta.');
            return;
        }

        // Join
        const { error: joinError } = await supabase
            .from('room_members')
            .insert([{
                room_id: room.id,
                user_id: session.user.id
            }]);

        if (!joinError) {
            setMyRooms([...myRooms, room]);
            setActiveRoomId(room.id);
            setActiveTab('group');
            setShowJoinModal(false);
            setJoinRoomId('');
            setJoinRoomPass('');
        } else {
            alert('Você já está nesta sala ou ocorreu um erro.');
        }
    };


    return (
        <div className={`bg-[#0F172A] rounded-3xl shadow-2xl border border-white/10 flex flex-col overflow-hidden font-sans ${className}`}>
            {/* Header */}
            <div className="p-4 bg-[#1E293B]/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-white font-bold text-lg">
                        {activeTab === 'public' ? 'Chat da Galera' : (myRooms.find(r => r.id === activeRoomId)?.name || 'Minha Resenha')}
                    </h2>
                    {activeTab === 'public' && (
                        <span className="bg-brand-primary/20 text-brand-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-brand-primary/30">
                            AO VIVO
                        </span>
                    )}
                    {activeTab === 'group' && timeLeft && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${timeLeft === 'EXPIRADA' ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-brand-secondary/20 text-brand-secondary border-brand-secondary/30'}`}>
                            <Lock size={10} /> {timeLeft}
                        </span>
                    )}
                </div>
                {activeTab === 'group' && activeRoomId && (
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(activeRoomId);
                            alert('ID da sala copiado!');
                        }}
                        className="text-slate-400 hover:text-brand-primary transition-colors text-xs flex items-center gap-1"
                    >
                        <Copy size={14} /> Copiar ID
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-[#0F172A] border-b border-white/5">
                <button
                    onClick={() => setActiveTab('public')}
                    className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'public' ? 'bg-[#1E293B] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <MessageSquare size={16} /> Geral
                </button>
                <button
                    onClick={() => setActiveTab('group')}
                    className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 relative ${activeTab === 'group' ? 'bg-[#1E293B] text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Users size={16} />
                    {myRooms.length > 0 ? 'Minha Resenha' : 'Criar Sala'}
                    {unreadPrivate && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                </button>
            </div>

            {/* Private Room Selector (Only visible in Group Tab) */}
            {activeTab === 'group' && (
                <div className="p-2 bg-[#0F172A] border-b border-white/5 flex gap-2 overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-primary/20 text-brand-primary border border-brand-primary/30 flex items-center justify-center hover:bg-brand-primary hover:text-black transition-all"
                    >
                        <Plus size={16} />
                    </button>
                    <button
                        onClick={() => setShowJoinModal(true)}
                        className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 text-slate-400 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all"
                    >
                        <Hash size={16} />
                    </button>
                    {myRooms.map(room => (
                        <button
                            key={room.id}
                            onClick={() => setActiveRoomId(room.id)}
                            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${activeRoomId === room.id ? 'bg-brand-primary text-black border-brand-primary' : 'bg-slate-800 text-slate-400 border-white/10 hover:border-white/30'}`}
                        >
                            {room.emoji} {room.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Messages Area */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide relative scroll-smooth"
            >
                {activeTab === 'group' && myRooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-60">
                        <Users size={48} className="text-slate-500 mb-4" />
                        <h3 className="text-white font-bold mb-2">Crie sua Resenha</h3>
                        <p className="text-slate-400 text-sm mb-6">Junte seus amigos em uma sala privada para comentar o show!</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-2 bg-brand-primary text-black font-bold rounded-full hover:scale-105 transition-transform"
                        >
                            Criar Sala Agora
                        </button>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-3 ${msg.isMe ? 'flex-row-reverse' : ''} animate-fade-in`}>
                            <img src={msg.user_meta?.avatar || 'https://i.pravatar.cc/150'} alt="User" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                            <div className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className={`text-sm font-bold ${msg.isMe ? 'text-brand-primary' : 'text-[#60A5FA]'}`}>
                                        {msg.user_meta?.name || 'Usuário'}
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className={`text-sm leading-relaxed ${msg.isMe ? 'text-slate-200 text-right' : 'text-slate-300'}`}>
                                    {msg.content}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input Area */}
            {session ? (
                <div className="p-4 bg-[#1E293B]/30 border-t border-white/5">
                    <div className="relative">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={activeTab === 'public' ? "Comente na live..." : "Mensagem privada..."}
                            className="w-full bg-[#0F172A] text-white placeholder-slate-500 text-sm rounded-full py-3 pl-4 pr-12 border border-white/10 focus:outline-none focus:border-brand-primary/50 transition-all"
                        />
                        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-primary transition-colors">
                            <Smile size={20} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[10px] text-slate-400 font-medium">Conectado</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSendMessage}
                                className="w-8 h-8 rounded-full bg-brand-primary text-brand-dark flex items-center justify-center hover:bg-white transition-colors shadow-lg shadow-brand-primary/20"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-6 bg-[#1E293B]/80 backdrop-blur-md border-t border-white/5 flex flex-col items-center justify-center text-center gap-3">
                    <p className="text-slate-300 text-sm">Faça login para participar do chat!</p>
                    <button
                        onClick={() => window.location.href = '/auth'}
                        className="px-6 py-2 bg-brand-primary text-brand-dark font-bold rounded-full text-sm hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/20"
                    >
                        Entrar no Chat
                    </button>
                </div>
            )}

            {/* Modals */}
            {showCreateModal && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1E293B] p-6 rounded-2xl border border-white/10 w-full max-w-sm">
                        <h3 className="text-white font-bold text-lg mb-4">Criar Sala Privada</h3>
                        <input
                            type="text"
                            placeholder="Nome da Sala (ex: Os de Verdade)"
                            className="w-full bg-[#0F172A] text-white p-3 rounded-xl border border-white/10 mb-3 focus:border-brand-primary outline-none"
                            value={newRoomName}
                            onChange={e => setNewRoomName(e.target.value)}
                            autoComplete="off"
                        />
                        <input
                            type="password"
                            placeholder="Senha (Opcional)"
                            className="w-full bg-[#0F172A] text-white p-3 rounded-xl border border-white/10 mb-4 focus:border-brand-primary outline-none"
                            value={newRoomPass}
                            onChange={e => setNewRoomPass(e.target.value)}
                            autoComplete="new-password"
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2 text-slate-400 hover:text-white">Cancelar</button>
                            <button onClick={handleCreateRoom} className="flex-1 py-2 bg-brand-primary text-black font-bold rounded-xl">Criar</button>
                        </div>
                    </div>
                </div>
            )}

            {showJoinModal && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1E293B] p-6 rounded-2xl border border-white/10 w-full max-w-sm">
                        <h3 className="text-white font-bold text-lg mb-4">Entrar em Sala</h3>
                        <input
                            type="text"
                            placeholder="ID da Sala"
                            className="w-full bg-[#0F172A] text-white p-3 rounded-xl border border-white/10 mb-3 focus:border-brand-primary outline-none"
                            value={joinRoomId}
                            onChange={e => setJoinRoomId(e.target.value)}
                            autoComplete="off"
                        />
                        <input
                            type="password"
                            placeholder="Senha"
                            className="w-full bg-[#0F172A] text-white p-3 rounded-xl border border-white/10 mb-4 focus:border-brand-primary outline-none"
                            value={joinRoomPass}
                            onChange={e => setJoinRoomPass(e.target.value)}
                            autoComplete="new-password"
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setShowJoinModal(false)} className="flex-1 py-2 text-slate-400 hover:text-white">Cancelar</button>
                            <button onClick={handleJoinRoom} className="flex-1 py-2 bg-brand-primary text-black font-bold rounded-xl">Entrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;
