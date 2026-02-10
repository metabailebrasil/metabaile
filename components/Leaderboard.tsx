import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Trophy, Medal } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

// Mock Data
export const MOCK_DONORS = [
    { id: '1', name: 'MC Ryan SP', amount: 5000, avatar: 'https://i.pravatar.cc/150?u=ryan' },
    { id: '2', name: 'Anitta', amount: 3200, avatar: 'https://i.pravatar.cc/150?u=anitta' },
    { id: '3', name: 'Nobru', amount: 1500, avatar: 'https://i.pravatar.cc/150?u=nobru' },
    { id: '4', name: 'Paulinho o LOKO', amount: 800, avatar: 'https://i.pravatar.cc/150?u=paulinho' },
    { id: '5', name: 'Casimiro', amount: 650, avatar: 'https://i.pravatar.cc/150?u=caze' },
    { id: '6', name: 'Neymar Jr', amount: 500, avatar: 'https://i.pravatar.cc/150?u=neymar' },
    { id: '7', name: 'Gaules', amount: 300, avatar: 'https://i.pravatar.cc/150?u=gau' },
    { id: '8', name: 'Alanzoka', amount: 150, avatar: 'https://i.pravatar.cc/150?u=alan' },
    { id: '9', name: 'Loud Coringa', amount: 100, avatar: 'https://i.pravatar.cc/150?u=coringa' },
    { id: '10', name: 'Boca de 09', amount: 50, avatar: 'https://i.pravatar.cc/150?u=boca' },
];

export const Leaderboard: React.FC = () => {
    const top3 = MOCK_DONORS.slice(0, 3);
    const rest = MOCK_DONORS.slice(3);

    return (
        <div className="flex flex-col h-full bg-slate-900/40 backdrop-blur-sm p-4 overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-sky-500/10 blur-[80px] rounded-full pointer-events-none"></div>

            <h2 className="text-center text-white font-black text-xl mb-6 flex items-center justify-center gap-2 uppercase tracking-wide">
                <Trophy className="text-yellow-400" size={24} />
                <span className="bg-gradient-to-r from-yellow-200 to-yellow-500 bg-clip-text text-transparent">Ranking do Baile</span>
            </h2>

            {/* PODIUM */}
            <div className="flex justify-center items-end gap-2 mb-8 relative z-10">
                {/* #2 Silver */}
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <div className="absolute -inset-0.5 rounded-full bg-gradient-to-b from-slate-300 to-slate-500 blur opacity-70"></div>
                        <img src={top3[1].avatar} className="w-16 h-16 rounded-full border-2 border-slate-300 relative z-10 object-cover" alt="Silver" />
                        <div className="absolute -bottom-2 -right-1 bg-slate-300 text-slate-900 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border border-slate-400 z-20 shadow-lg">2</div>
                    </div>
                    <div className="text-center mt-2">
                        <p className="text-slate-200 font-bold text-xs truncate max-w-[80px]">{top3[1].name}</p>
                        <p className="text-slate-400 text-[10px] font-mono">R$ {top3[1].amount}</p>
                    </div>
                </div>

                {/* #1 Gold */}
                <div className="flex flex-col items-center -mb-2">
                    <Crown size={24} className="text-yellow-400 mb-1 animate-bounce" fill="currentColor" />
                    <div className="relative">
                        <div className="absolute -inset-1 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-600 blur opacity-70 animate-pulse"></div>
                        <img src={top3[0].avatar} className="w-20 h-20 rounded-full border-4 border-yellow-400 relative z-10 object-cover shadow-[0_0_20px_rgba(250,204,21,0.4)]" alt="Gold" />
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-xs font-black px-2 py-0.5 rounded-full border border-yellow-200 z-20 shadow-lg whitespace-nowrap">
                            TOP 1
                        </div>
                    </div>
                    <div className="text-center mt-4">
                        <p className="text-yellow-100 font-black text-sm truncate max-w-[100px]">{top3[0].name}</p>
                        <p className="text-yellow-400/80 text-xs font-mono font-bold">R$ {top3[0].amount}</p>
                    </div>
                </div>

                {/* #3 Bronze */}
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <div className="absolute -inset-0.5 rounded-full bg-gradient-to-b from-orange-400 to-orange-700 blur opacity-70"></div>
                        <img src={top3[2].avatar} className="w-16 h-16 rounded-full border-2 border-orange-400 relative z-10 object-cover" alt="Bronze" />
                        <div className="absolute -bottom-2 -left-1 bg-orange-400 text-orange-900 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border border-orange-500 z-20 shadow-lg">3</div>
                    </div>
                    <div className="text-center mt-2">
                        <p className="text-slate-200 font-bold text-xs truncate max-w-[80px]">{top3[2].name}</p>
                        <p className="text-slate-400 text-[10px] font-mono">R$ {top3[2].amount}</p>
                    </div>
                </div>
            </div>

            {/* LIST */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide relative z-10 fade-mask-bottom">
                {rest.map((donor, index) => (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={donor.id}
                        className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5 hover:bg-white/10 transition-colors"
                    >
                        <div className="w-6 h-6 flex items-center justify-center text-slate-500 font-mono font-bold text-xs">
                            #{index + 4}
                        </div>
                        <img src={donor.avatar} className="w-8 h-8 rounded-full bg-slate-800 object-cover" alt={donor.name} />
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-xs truncate">{donor.name}</p>
                        </div>
                        <div className="text-emerald-400 font-mono text-xs font-bold bg-emerald-400/10 px-2 py-1 rounded-md">
                            R$ {donor.amount}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
