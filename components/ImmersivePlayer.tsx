import React, { useState, useRef } from 'react';
import { 
  Settings, 
  Maximize2, 
  Heart, 
  Gift, 
  Share2, 
  Play, 
  Pause, 
  Send 
} from 'lucide-react';

const ImmersivePlayer: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  
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

  return (
    <div 
      ref={containerRef}
      className="relative w-[95%] md:w-[98%] h-[75vh] md:h-[85vh] max-w-[1800px] mx-auto bg-black rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl shadow-brand-primary/20 ring-1 ring-white/10 group select-none transition-all"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. Full Screen Video */}
      <img 
        src="https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?q=80&w=2670&auto=format&fit=crop" 
        alt="Live Concert" 
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[20s] ease-linear scale-105 group-hover:scale-110 opacity-90"
      />
      
      {/* 2. Soft Gradient Overlay (Cinematic) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

      {/* 3. Top Controls (Glassmorphism) */}
      <div className={`absolute top-0 left-0 w-full p-6 md:p-8 flex justify-between items-start z-20 transition-all duration-500 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 md:opacity-100 md:translate-y-0'}`}>
        {/* Streamer Profile */}
        <div className="flex items-center gap-3 backdrop-blur-md bg-black/20 p-1.5 pr-5 rounded-full border border-white/10 hover:bg-black/30 transition-colors cursor-pointer group/profile">
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

      {/* 4. Ghost Chat (Floating) */}
      <div className="absolute bottom-24 left-6 md:bottom-28 md:left-8 w-64 md:w-80 z-20 mask-image-linear-gradient">
        <div className="space-y-3">
           {[
             { user: 'ana.beatriz', msg: 'QUE VIBE É ESSA!!! 🔥', color: 'text-brand-primary' },
             { user: 'joao_pedro', msg: 'Aumenta o som dj', color: 'text-purple-300' },
             { user: 'marcos.dev', msg: 'O drop vai ser insano...', color: 'text-green-300' },
           ].map((chat, i) => (
             <div key={i} className="flex flex-col animate-float" style={{ animationDelay: `${i * 0.5}s`, opacity: 0.9 }}>
                <span className={`text-[10px] font-bold ${chat.color} drop-shadow-md`}>@{chat.user}</span>
                <span className="text-white text-sm font-medium drop-shadow-md bg-black/20 backdrop-blur-[2px] self-start px-3 py-1.5 rounded-r-xl rounded-bl-xl rounded-tl-none border border-white/5">
                  {chat.msg}
                </span>
             </div>
           ))}
        </div>
      </div>

      {/* 5. Right Side Actions */}
      <div className="absolute right-4 bottom-24 md:right-8 md:bottom-28 flex flex-col gap-4 z-20">
         <button onClick={() => setIsLiked(!isLiked)} className="group flex flex-col items-center gap-1">
            <div className={`w-12 h-12 rounded-full backdrop-blur-md border flex items-center justify-center transition-all duration-300 active:scale-90 ${isLiked ? 'bg-brand-primary/20 border-brand-primary text-brand-primary' : 'bg-white/10 border-white/10 text-white hover:bg-white/20'}`}>
              <Heart size={24} className={isLiked ? 'fill-brand-primary' : ''} />
            </div>
            <span className="text-white text-[10px] font-bold">12k</span>
         </button>
         
         <button className="group flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full backdrop-blur-md bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90">
              <Gift size={24} />
            </div>
            <span className="text-white text-[10px] font-bold">Drop</span>
         </button>

         <button className="group flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full backdrop-blur-md bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90">
              <Share2 size={24} />
            </div>
            <span className="text-white text-[10px] font-bold">Share</span>
         </button>
      </div>

      {/* 6. Bottom Interaction Bar */}
      <div className={`absolute bottom-0 left-0 w-full p-4 md:p-6 bg-gradient-to-t from-black/90 to-transparent z-30 flex items-center gap-4 transition-all duration-500 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 md:translate-y-0 md:opacity-100'}`}>
         
         <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:text-brand-primary transition-colors">
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
         </button>

         {/* Refined Chat Input */}
         <div className="flex-1 relative h-12 bg-white/10 backdrop-blur-md rounded-full border border-white/10 flex items-center px-2 group/input transition-all duration-300 focus-within:bg-white/20 focus-within:border-brand-primary/50 focus-within:shadow-[0_0_15px_rgba(167,211,255,0.1)] focus-within:scale-[1.01]">
            <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center mr-2">
              <span className="text-[10px] font-bold text-brand-dark">EU</span>
            </div>
            <input 
              type="text" 
              placeholder="Envie uma mensagem..." 
              className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-white/30 focus:placeholder-white/50 transition-colors"
            />
            <button className="p-2 rounded-full bg-white/10 text-white hover:bg-brand-primary hover:text-brand-dark transition-colors">
              <Send size={16} />
            </button>
         </div>

         {/* Fake Progress Bar */}
         <div className="absolute top-0 left-0 w-full h-1 bg-white/10 cursor-pointer group/progress">
            <div className="h-full bg-brand-primary w-[45%] relative">
               <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg scale-0 group-hover/progress:scale-100"></div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ImmersivePlayer;