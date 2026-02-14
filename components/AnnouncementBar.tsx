import React from 'react';

const AnnouncementBar: React.FC = () => {
    const text = "INGRESSOS À VENDA • PROJETO EM CONSTRUÇÃO • A REVOLUÇÃO DO AO VIVO ESTÁ POR VIM • EXPERIÊNCIA IMERSIVA • GARANTA SEU LUGAR • METABAILE 2026";

    return (
        <div className="bg-transparent overflow-hidden py-2.5 relative z-50">
            {/* Fade edges for smoother look */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-brand-light to-transparent z-20"></div>
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-brand-light to-transparent z-20"></div>

            {/* 
                Seamless Marquee:
                Using the exact same logic as ConstructionTicker for consistency.
                Render text 4 times to overlap the translation.
            */}
            {/* 
                Seamless Marquee:
                Duplicate content in two containers that move from 0 to -100%
            */}
            <div className="flex relative z-10 overflow-hidden w-full">
                <div className="animate-marquee whitespace-nowrap flex items-center min-w-full shrink-0">
                    <span className="text-xs md:text-sm font-medium text-brand-dark/50 tracking-widest uppercase font-display mr-4">{text}</span>
                    <span className="text-xs md:text-sm font-medium text-brand-dark/50 tracking-widest uppercase font-display mr-4">{text}</span>
                </div>
                <div className="animate-marquee whitespace-nowrap flex items-center min-w-full shrink-0">
                    <span className="text-xs md:text-sm font-medium text-brand-dark/50 tracking-widest uppercase font-display mr-4">{text}</span>
                    <span className="text-xs md:text-sm font-medium text-brand-dark/50 tracking-widest uppercase font-display mr-4">{text}</span>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementBar;
