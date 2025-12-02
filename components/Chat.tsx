import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, Flame, Heart, Users, MessageSquare, X, MoreVertical } from 'lucide-react';

interface Message {
    id: string;
    user: string;
    avatar: string;
    content: string;
    timestamp: string;
    isMe?: boolean;
}

const PUBLIC_MESSAGES: Message[] = [
    { id: '1', user: 'ana.beatriz', avatar: 'https://i.pravatar.cc/150?u=ana', content: 'QUE VIBE É ESSA!!! 🔥', timestamp: '12:40' },
    { id: '2', user: 'joao_pedro', avatar: 'https://i.pravatar.cc/150?u=joao', content: 'Aumenta o som dj', timestamp: '12:41' },
    { id: '3', user: 'marcos.dev', avatar: 'https://i.pravatar.cc/150?u=marcos', content: 'O drop vai ser insano...', timestamp: '12:42' },
    { id: '4', user: 'julia_m', avatar: 'https://i.pravatar.cc/150?u=julia', content: 'Alguém sabe o nome dessa música?', timestamp: '12:43' },
    { id: '5', user: 'lucas_gamer', avatar: 'https://i.pravatar.cc/150?u=lucas', content: 'Salve pra galera de SP!', timestamp: '12:44' },
];

const GROUP_MESSAGES: Message[] = [
    { id: 'g1', user: 'Bestie 1', avatar: 'https://i.pravatar.cc/150?u=b1', content: 'Gente, olha esse palco!', timestamp: '12:42' },
    { id: 'g2', user: 'Bestie 2', avatar: 'https://i.pravatar.cc/150?u=b2', content: 'Tô amando muito', timestamp: '12:43' },
];

const Chat: React.FC<{ className?: string }> = ({ className = '' }) => {
    const [activeTab, setActiveTab] = useState<'public' | 'group'>('public');
    const [messages, setMessages] = useState<Message[]>(PUBLIC_MESSAGES);
    const [groupMessages, setGroupMessages] = useState<Message[]>(GROUP_MESSAGES);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, groupMessages, activeTab]);

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            user: 'você',
            avatar: 'https://i.pravatar.cc/150?u=me',
            content: inputValue,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: true,
        };

        if (activeTab === 'public') {
            setMessages((prev) => [...prev, newMessage]);
        } else {
            setGroupMessages((prev) => [...prev, newMessage]);
        }
        setInputValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    const currentMessages = activeTab === 'public' ? messages : groupMessages;

    // --- AUTH STATE ---
    const [session, setSession] = useState<any>(null);

    useEffect(() => {
        // Check active session
        import('../lib/supabase').then(({ supabase }) => {
            supabase.auth.getSession().then(({ data: { session } }) => {
                setSession(session);
            });

            const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
                setSession(session);
            });
            return () => subscription.unsubscribe();
        });
    }, []);

    return (
        <div className={`bg-[#0F172A] rounded-3xl shadow-2xl border border-white/10 flex flex-col overflow-hidden font-sans ${className}`}>
            {/* Header */}
            <div className="p-4 bg-[#1E293B]/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-white font-bold text-lg">
                        {activeTab === 'public' ? 'Chat da Galera' : 'Grupinho VIP'}
                    </h2>
                    {activeTab === 'public' && (
                        <span className="bg-brand-primary/20 text-brand-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-brand-primary/30">
                            AO VIVO
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                    <button className="hover:text-white transition-colors"><MoreVertical size={20} /></button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-[#0F172A] border-b border-white/5">
                <button
                    onClick={() => setActiveTab('public')}
                    className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'public' ? 'bg-[#1E293B] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    <MessageSquare size={16} /> Geral
                </button>
                <button
                    onClick={() => setActiveTab('group')}
                    className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'group' ? 'bg-[#1E293B] text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    <Users size={16} /> Grupinho
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide relative">
                {currentMessages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.isMe ? 'flex-row-reverse' : ''} animate-fade-in`}>
                        <img src={msg.avatar} alt={msg.user} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                        <div className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className={`text-sm font-bold ${msg.isMe ? 'text-brand-primary' : 'text-[#60A5FA]'}`}>
                                    {msg.user}
                                </span>
                                <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                            </div>
                            <p className={`text-sm leading-relaxed ${msg.isMe ? 'text-slate-200 text-right' : 'text-slate-300'}`}>
                                {msg.content}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />

                {/* Blur Overlay for Non-Logged Users (Optional style choice, keeping it clean for now) */}
            </div>

            {/* Input Area OR Login CTA */}
            {session ? (
                <div className="p-4 bg-[#1E293B]/30 border-t border-white/5">
                    <div className="relative">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Envie uma mensagem..."
                            className="w-full bg-[#0F172A] text-white placeholder-slate-500 text-sm rounded-full py-3 pl-4 pr-12 border border-white/10 focus:outline-none focus:border-brand-primary/50 transition-all"
                        />
                        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-primary transition-colors">
                            <Smile size={20} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[10px] text-slate-400 font-medium">Chat conectado</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="text-slate-400 hover:text-red-500 transition-colors hover:scale-110 transform"><Heart size={20} /></button>
                            <button className="text-slate-400 hover:text-orange-500 transition-colors hover:scale-110 transform"><Flame size={20} /></button>
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
                    <p className="text-slate-300 text-sm">Faça login para participar do chat e interagir com a galera!</p>
                    <button
                        onClick={() => window.location.href = '/auth'}
                        className="px-6 py-2 bg-brand-primary text-brand-dark font-bold rounded-full text-sm hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/20"
                    >
                        Entrar no Chat
                    </button>
                </div>
            )}
        </div>
    );
};

export default Chat;
