import React from 'react';

const ConstructionTicker: React.FC = () => {
    const text = "Projeto em Construção • Estamos preparando uma nova experiência com redes sociais, interações exclusivas, notícias quentes e muito mais. Aguarde! • A revolução do ao vivo está por vir • Metabaile";

    return (
        <div className="w-full bg-transparent border-y border-brand-dark/5 py-3 overflow-hidden relative flex items-center">
            {/* 
        The marquee animation moves to -50% of the container's width.
        For a seamless loop, we need the content to be perfectly symmetrical.
        We render the text 4 times. When it moves -50% (2 text lengths), 
        the 3rd text block will be in the exact position of the 1st text block.
      */}
            <div className="flex overflow-hidden w-full">
                <div className="animate-marquee whitespace-nowrap flex items-center min-w-full shrink-0">
                    <span className="text-xs md:text-sm font-medium text-brand-dark/50 uppercase font-display tracking-widest mx-4">{text}</span>
                    <span className="text-xs md:text-sm font-medium text-brand-dark/50 uppercase font-display tracking-widest mx-4">{text}</span>
                </div>
                <div className="animate-marquee whitespace-nowrap flex items-center min-w-full shrink-0">
                    <span className="text-xs md:text-sm font-medium text-brand-dark/50 uppercase font-display tracking-widest mx-4">{text}</span>
                    <span className="text-xs md:text-sm font-medium text-brand-dark/50 uppercase font-display tracking-widest mx-4">{text}</span>
                </div>
            </div>

            {/* Fade edges for smoother look - made more subtle */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-brand-light to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-brand-light to-transparent z-10"></div>
        </div>
    );
};

export default ConstructionTicker;
