import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  Maximize2,
  Heart,
  Gift,
  Share2,
  Play,
  Pause,
  Send,
  MoreVertical,
  Smile
} from 'lucide-react';

const MOCK_CHAT = [
  { user: 'ana.beatriz', msg: 'QUE VIBE É ESSA!!! 🔥', color: 'text-brand-primary', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
  { user: 'joao_pedro', msg: 'Aumenta o som dj', color: 'text-purple-300', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop' },
  { user: 'marcos.dev', msg: 'O drop vai ser insano...', color: 'text-green-300', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' },
  { user: 'julia_m', msg: 'Alguém sabe o nome dessa música?', color: 'text-pink-300', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop' },
  { user: 'lucas_gamer', msg: 'Salve pra galera de SP!', color: 'text-blue-300', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop' },
];

const ImmersivePlayer: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [messages, setMessages] = useState(MOCK_CHAT);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="w-[95%] md:w-[98%] max-w-[1800px] mx-auto flex flex-col lg:flex-row gap-6 h-auto lg:h-[85vh]">

      {/* --- VIDEO CONTAINER --- */}
      <div
        ref={containerRef}
        className="relative flex-1 bg-black rounded-[2rem] overflow-hidden shadow-2xl shadow-brand-primary/10 ring-1 ring-white/10 group select-none transition-all aspect-video lg:aspect-auto"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 1. Full Screen Video */}
        <img
          src="https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?q=80&w=2670&auto=format&fit=crop"
          alt="Live Concert"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />

        {/* 2. Soft Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

        {/* 3. Top Controls */}
        <div className={`absolute top-0 left-0 w-full p-6 flex justify-between items-start z-20 transition-all duration-500 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 md:opacity-100 md:translate-y-0'}`}>
          {/* Streamer Profile */}
          <div className="flex items-center gap-3 backdrop-blur-md bg-black/40 p-1.5 pr-5 rounded-full border border-white/10 hover:bg-black/50 transition-colors cursor-pointer group/profile">
            <div className="relative">
              <img src="https://images.unsplash.com/photo-1571266028243-37160d7fdd92?w=100&h=100" className="w-10 h-10 rounded-full border-2 border-brand-primary object-cover" alt="Host" />
              <div className="absolute -bottom-1 -right-1 bg-red-500 text-[9px] font-bold px-1.5 py-0.5 rounded-sm text-white tracking-wider animate-pulse">LIVE</div>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm leading-tight group-hover/profile:text-brand-primary transition-colors">DJ Lumi <span className="text-brand-primary/80 ml-1">✓</span></h3>
              <p className="text-white/60 text-xs font-medium">Electronic • 125k assistindo</p>
            </div>
          </div>

          {/* Top Right Actions */}
          <div className="flex gap-3">
            <button className="w-10 h-10 rounded-full backdrop-blur-md bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all hover:scale-110 active:scale-95">
              <Settings size={18} />
            </button>
            <button
              onClick={toggleFullScreen}
              className="w-10 h-10 rounded-full backdrop-blur-md bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all hover:scale-110 active:scale-95"
            >
              <Maximize2 size={18} />
            </button>
          </div>
        </div>

        {/* 4. Right Side Actions (Floating) */}
        <div className="absolute right-6 bottom-24 flex flex-col gap-4 z-20">
          <button onClick={() => setIsLiked(!isLiked)} className="group flex flex-col items-center gap-1">
            <div className={`w-12 h-12 rounded-full backdrop-blur-md border flex items-center justify-center transition-all duration-300 active:scale-90 ${isLiked ? 'bg-brand-primary/20 border-brand-primary text-brand-primary' : 'bg-white/10 border-white/10 text-white hover:bg-white/20'}`}>
              <Heart size={24} className={isLiked ? 'fill-brand-primary' : ''} />
            </div>
            <span className="text-white text-[10px] font-bold shadow-black/50 shadow-sm">12k</span>
          </button>

          <button className="group flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full backdrop-blur-md bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90">
              <Gift size={24} />
            </div>
            <span className="text-white text-[10px] font-bold shadow-black/50 shadow-sm">Drop</span>
          </button>

          <button className="group flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full backdrop-blur-md bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90">
              <Share2 size={24} />
            </div>
            <span className="text-white text-[10px] font-bold shadow-black/50 shadow-sm">Share</span>
          </button>
        </div>

        {/* 5. Bottom Interaction Bar */}
        <div className={`absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/90 to-transparent z-30 flex items-center gap-6 transition-all duration-500 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 md:translate-y-0 md:opacity-100'}`}>

          <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:text-brand-primary transition-colors hover:scale-110 transform duration-200">
            {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
          </button>

          {/* Progress Bar */}
          <div className="flex-1 h-1.5 bg-white/20 rounded-full cursor-pointer group/progress relative overflow-hidden">
            <div className="absolute inset-0 bg-brand-primary w-[45%] rounded-full">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-[0_0_10px_rgba(255,255,255,0.5)] scale-0 group-hover/progress:scale-150"></div>
            </div>
          </div>

          <div className="text-white text-xs font-bold tracking-widest opacity-80">
            LIVE
          </div>
        </div>
      </div>

      {/* --- CHAT CONTAINER --- */}
      <div className="w-full lg:w-[400px] bg-slate-900 rounded-[2rem] flex flex-col overflow-hidden border border-slate-800 shadow-xl h-[600px] lg:h-full">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm">
          <h3 className="text-white font-bold font-display tracking-wide flex items-center gap-2">
            Chat da Galera
            <span className="bg-brand-primary/20 text-brand-primary text-[10px] px-2 py-0.5 rounded-full">AO VIVO</span>
          </h3>
          <button className="text-slate-400 hover:text-white transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {messages.map((chat, i) => (
            <div key={i} className="flex gap-3 items-start animate-fade-in">
              <img src={chat.avatar} alt={chat.user} className="w-8 h-8 rounded-full object-cover border border-slate-700" />
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className={`text-xs font-bold ${chat.color}`}>{chat.user}</span>
                  <span className="text-[10px] text-slate-500">12:4{i}</span>
                </div>
                <p className="text-slate-300 text-sm leading-snug">{chat.msg}</p>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-800/50 border-t border-slate-800">
          <div className="relative flex items-center gap-2">
            <div className="flex-1 relative bg-slate-900 rounded-full border border-slate-700 focus-within:border-brand-primary/50 focus-within:ring-1 focus-within:ring-brand-primary/50 transition-all">
              <input
                type="text"
                placeholder="Envie uma mensagem..."
                className="w-full bg-transparent border-none outline-none text-white text-sm px-4 py-3 placeholder-slate-500"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-primary transition-colors p-1">
                <Smile size={18} />
              </button>
            </div>
            <button className="w-10 h-10 rounded-full bg-brand-primary text-brand-dark flex items-center justify-center hover:bg-brand-secondary transition-colors shadow-lg shadow-brand-primary/20">
              <Send size={18} />
            </button>
          </div>
          <div className="flex justify-between items-center mt-3 px-1">
            <div className="flex gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] text-slate-400 font-medium">Chat conectado</span>
            </div>
            <span className="text-[10px] text-slate-500">Modo lento: 3s</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ImmersivePlayer;