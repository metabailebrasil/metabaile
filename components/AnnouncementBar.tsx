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

    // Create a single string of messages separated by bullets
    const singleSet = messages.map(msg => `${msg} •`).join('   ');

    return (
        <div className="bg-transparent overflow-hidden py-2.5 relative z-50">
            {/* Fade edges for smoother look */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-brand-light to-transparent z-20"></div>
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-brand-light to-transparent z-20"></div>

            {/* 
                We render the full set of messages 4 times.
                The animation moves -50%, so we need enough content to cover that width seamlessly.
            */}
            <div className="whitespace-nowrap animate-marquee flex items-center relative z-10">
                <span className="text-xs md:text-sm font-medium text-brand-dark/50 tracking-widest uppercase inline-block mx-4 font-display">{singleSet}</span>
                <span className="text-xs md:text-sm font-medium text-brand-dark/50 tracking-widest uppercase inline-block mx-4 font-display">{singleSet}</span>
                <span className="text-xs md:text-sm font-medium text-brand-dark/50 tracking-widest uppercase inline-block mx-4 font-display">{singleSet}</span>
                <span className="text-xs md:text-sm font-medium text-brand-dark/50 tracking-widest uppercase inline-block mx-4 font-display">{singleSet}</span>
            </div>
        </div>
    );
};

export default AnnouncementBar;
