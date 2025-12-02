import React from 'react';

const AnnouncementBar: React.FC = () => {
    const messages = [
        "INGRESSOS À VENDA",
        "NOVA DATA CONFIRMADA",
        "LINE-UP COMPLETO",
        "EXPERIÊNCIA IMERSIVA",
        "GARANTA SEU LUGAR",
        "METABAILE 2025"
    ];

    // Duplicate the messages to ensure smooth scrolling
    const displayMessages = [...messages, ...messages, ...messages, ...messages];

    return (
        <div className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary text-brand-dark overflow-hidden py-2.5 relative z-50 border-b border-white/20 shadow-sm">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="whitespace-nowrap animate-marquee flex gap-8 items-center relative z-10">
                {displayMessages.map((msg, index) => (
                    <span key={index} className="text-xs md:text-sm font-bold tracking-[0.2em] uppercase inline-block drop-shadow-sm">
                        {msg} •
                    </span>
                ))}
            </div>
        </div>
    );
};

export default AnnouncementBar;
