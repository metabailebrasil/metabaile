import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Star, Crown, Sparkles, Zap } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const getUsernameColor = (username: string) => {
    const colors = ['text-pink-500', 'text-purple-500', 'text-indigo-500', 'text-blue-500', 'text-cyan-500', 'text-teal-500', 'text-green-500', 'text-lime-500', 'text-yellow-500', 'text-orange-500', 'text-red-500'];
    let hash = 0;
    for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};

interface MessageProps {
    msg: {
        id: string;
        user_id: string;
        content: string;
        created_at: string;
        role_badge?: 'user' | 'vip' | 'admin' | 'moderator';
        user_meta: { name: string; avatar: string; };
        isMe?: boolean;
        is_donation?: boolean;
        donation_amount?: number;
        status?: 'PENDING' | 'CONFIRMED';
    };
}

export const ChatMessage = React.memo(({ msg }: MessageProps) => {
    const isSuper = msg.is_donation && msg.status === 'CONFIRMED';
    const amount = msg.donation_amount || 0;
    // Removed time calculation if not used, or keep if needed later.

    // --- STANDARD MESSAGE (YouTube/Twitch Compact Style) ---
    if (!isSuper) {
        return (
            <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                    "group relative pl-2 pr-2 py-0.5 transition-colors rounded hover:bg-white/[0.02] flex items-baseline gap-1.5 mb-0.5"
                )}
            >
                {/* Avatar (Tiny) */}
                <img
                    src={msg.user_meta?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.user_id}`}
                    className="w-5 h-5 rounded-full bg-slate-800 object-cover self-center opacity-70 group-hover:opacity-100 transition-opacity"
                    alt="Avatar"
                    loading="lazy"
                />

                {/* Name */}
                <span className={cn(
                    "text-[13px] font-bold whitespace-nowrap opacity-90 hover:underline cursor-pointer",
                    msg.isMe ? "text-slate-400" : getUsernameColor(msg.user_meta?.name || 'User')
                )}>
                    {msg.user_meta?.name || 'Usuário'}
                </span>

                {/* Badges */}
                {msg.role_badge === 'admin' && (
                    <Shield size={12} className="text-red-500 inline-block -ml-1" fill="currentColor" />
                )}

                {/* Separator */}
                <span className="text-slate-600 text-[10px] opacity-50">:</span>

                {/* Content */}
                <span className={cn(
                    "text-[13px] leading-5 break-words font-medium text-slate-300 group-hover:text-slate-200 transition-colors inline-block"
                )}>
                    {msg.content}
                </span>
            </motion.div>
        );
    }

    // --- CYBERPUNK NEON DONATION CARD ---
    // Tiers Config
    let tier = {
        color: "cyan",
        borderColor: "border-cyan-500/50",
        shadow: "shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]",
        icon: <Star size={14} className="text-cyan-400 animate-pulse" fill="currentColor" />,
        amountColor: "text-cyan-400",
        nameColor: "text-cyan-100",
        bgGradient: "bg-gradient-to-r from-cyan-950/50 to-slate-950/50",
        badge: "FORTALECEU"
    };

    if (amount >= 50) { // TIER 3: KING (Gold)
        tier = {
            color: "amber",
            borderColor: "border-amber-500/80",
            shadow: "shadow-[0_0_30px_-5px_rgba(245,158,11,0.5)]",
            icon: <Crown size={18} className="text-amber-400 animate-bounce-slow" fill="currentColor" />,
            amountColor: "text-amber-400",
            nameColor: "text-amber-100",
            bgGradient: "bg-gradient-to-r from-amber-950/60 via-yellow-900/20 to-slate-950/60",
            badge: "REI DO CAMAROTE"
        };
    } else if (amount >= 20) { // TIER 2: VIP (Purple/Magenta)
        tier = {
            color: "fuchsia",
            borderColor: "border-fuchsia-500/50",
            shadow: "shadow-[0_0_20px_-3px_rgba(217,70,239,0.4)]",
            icon: <Sparkles size={16} className="text-fuchsia-400 animate-pulse" />,
            amountColor: "text-fuchsia-400",
            nameColor: "text-fuchsia-100",
            bgGradient: "bg-gradient-to-r from-fuchsia-950/50 to-slate-950/50",
            badge: "VIP DO BAILE"
        };
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={cn(
                "relative mx-2 my-4 rounded-xl overflow-hidden backdrop-blur-md border transition-all duration-300",
                "bg-slate-950/80", // Dark base
                tier.borderColor,
                tier.shadow
            )}
        >
            {/* Top Shine/Glow Effect */}
            <div className={cn("absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-current to-transparent opacity-50", `text-${tier.color}-500`)}></div>

            <div className="p-3 relative z-10 flex gap-3">
                {/* Avatar with energetic ring */}
                <div className="relative shrink-0">
                    <div className={cn("absolute -inset-1 rounded-full blur-sm opacity-60 animate-pulse", `bg-${tier.color}-500`)}></div>
                    <img
                        src={msg.user_meta?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.user_id}`}
                        className={cn("w-10 h-10 rounded-full relative z-10 border-2 object-cover", `border-${tier.color}-500`)}
                        alt="Avatar"
                        loading="lazy"
                    />
                    {amount >= 50 && (
                        <div className="absolute -top-2 -right-1 z-20">
                            <Crown size={12} className="text-amber-400 drop-shadow-md" fill="gold" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">

                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-1">
                        <span className={cn("text-sm font-black tracking-wide truncate drop-shadow-sm", tier.nameColor)}>
                            {msg.user_meta?.name || 'Anônimo'}
                        </span>

                        <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/40 border border-white/5 backdrop-blur-sm")}>
                            {tier.icon}
                            <span className={cn("text-xs font-black font-mono tracking-tighter", tier.amountColor)}>
                                R$ {amount.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Message Body */}
                    <p className="text-[13px] text-slate-200 font-medium leading-snug drop-shadow-md">
                        {msg.content}
                    </p>
                </div>
            </div>

            {/* Background Gradient Mesh (Subtle) */}
            <div className={cn("absolute inset-0 z-0 opacity-20 pointer-events-none mix-blend-screen", tier.bgGradient)}></div>
        </motion.div>
    );
}, (prev, next) => prev.msg.id === next.msg.id && prev.msg.status === next.msg.status);
