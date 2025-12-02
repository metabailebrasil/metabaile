import React, { useState, PropsWithChildren } from 'react';
import Navbar from './components/Navbar';
import AnnouncementBar from './components/AnnouncementBar';
import ImmersivePlayer from './components/ImmersivePlayer';
import {
   APP_NAME,
   FEATURES,
   PLANS,
   HERO_CONTENT,
   FOOTER_LINKS,
   SOCIAL_HUB_CONTENT,
   COMMUNITY_STATS,
   GAMIFICATION_PILLARS,
   ARTISTS
} from './constants';
import {
   Play,
   MessageSquare,
   Users,
   Check,
   Video,
   ChevronDown,
   Globe,
   ArrowUpRight,
   Instagram,
   Twitter,
   Youtube
} from 'lucide-react';
import { Feature, Plan, Artist } from './types';

// --- Reusable Sub-components ---

const SectionTitle: React.FC<{ id?: string; title: string; subtitle?: string; centered?: boolean; dark?: boolean }> = ({ id, title, subtitle, centered = true, dark = false }) => (
   <div id={id} className={`mb-12 md:mb-16 px-4 scroll-mt-28 ${centered ? 'text-center' : 'text-left'}`}>
      <h2 className={`text-3xl md:text-5xl font-display font-bold mb-4 tracking-tight ${dark ? 'text-white' : 'text-brand-dark'}`}>{title}</h2>
      {subtitle && <p className={`max-w-xl text-lg font-medium leading-relaxed opacity-90 mx-auto ${dark ? 'text-slate-300' : 'text-brand-gray'}`}>{subtitle}</p>}
   </div>
);

const Button: React.FC<PropsWithChildren<{ variant?: 'primary' | 'secondary' | 'white' | 'glass' | 'outline-white' | 'dark'; className?: string; icon?: React.ElementType; onClick?: () => void }>> = ({ children, variant = 'primary', className = '', icon: Icon, onClick }) => {
   const baseStyle = "px-8 py-3.5 rounded-full font-bold text-sm tracking-wide transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2 active:scale-95 cursor-pointer";
   const variants = {
      primary: "bg-brand-primary text-brand-dark shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/40 border border-transparent hover:bg-brand-secondary",
      secondary: "bg-transparent border-2 border-brand-dark/10 text-brand-dark hover:bg-white hover:border-transparent hover:shadow-lg",
      white: "bg-white text-brand-dark shadow-lg hover:shadow-xl border border-transparent",
      glass: "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:border-white/40 shadow-lg",
      "outline-white": "bg-transparent border border-white/30 text-white hover:bg-white/10 hover:border-white/60",
      dark: "bg-brand-dark text-white hover:bg-slate-800 shadow-lg"
   };
   return <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>{children}{Icon && <Icon size={18} />}</button>;
};

const FeatureCard: React.FC<{ feature: Feature }> = ({ feature }) => (
   <div className="glass-panel p-8 rounded-3xl hover:translate-y-[-5px] transition-all duration-300 group">
      <div className="w-14 h-14 rounded-2xl bg-brand-light flex items-center justify-center mb-6 group-hover:bg-brand-primary group-hover:text-brand-dark text-brand-secondary transition-colors shadow-sm"><feature.icon size={28} /></div>
      <h3 className="text-xl font-bold font-display mb-3 text-brand-dark">{feature.title}</h3>
      <p className="text-brand-gray leading-relaxed font-medium">{feature.description}</p>
   </div>
);

const ArtistCard: React.FC<{ artist: Artist }> = ({ artist }) => (
   <div className="group relative rounded-3xl overflow-hidden aspect-[3/4] cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500">
      <img src={artist.image} alt={artist.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-full p-6 translate-y-2 group-hover:translate-y-0 transition-transform">
         <h3 className="text-2xl font-bold font-display text-white mb-1">{artist.name}</h3>
         <p className="text-brand-primary font-medium text-sm tracking-wider uppercase">{artist.role}</p>
      </div>
   </div>
);

const PlanCard: React.FC<{ plan: Plan }> = ({ plan }) => (
   <div className={`relative p-8 rounded-[2rem] border transition-all duration-500 hover:scale-[1.02] group ${plan.highlight ? 'bg-white border-brand-primary shadow-[0_10px_40px_rgba(167,211,255,0.4)]' : 'bg-white/60 backdrop-blur-md border-white/40 hover:border-brand-primary/30 hover:shadow-xl'}`}>
      {plan.highlight && (
         <>
            <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/10 to-transparent opacity-50 pointer-events-none rounded-[2rem]" />
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-brand-primary text-brand-dark text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg z-10">Mais Popular</div>
         </>
      )}
      <div className="relative z-10">
         <h3 className={`text-2xl font-display font-bold mb-2 text-brand-dark`}>{plan.name}</h3>
         <div className="flex items-baseline mb-6">
            <span className={`text-4xl font-bold ${plan.highlight ? 'text-brand-primary' : 'text-brand-dark'}`}>{plan.price}</span>
         </div>
         <ul className="space-y-4 mb-8">
            {plan.features.map((feat, i) => (
               <li key={i} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${plan.highlight ? 'bg-brand-primary text-brand-dark' : 'bg-brand-light text-brand-secondary'}`}>
                     <Check size={12} strokeWidth={3} />
                  </div>
                  <span className={`text-sm font-medium ${plan.highlight ? 'text-brand-gray' : 'text-slate-500'}`}>{feat}</span>
               </li>
            ))}
         </ul>
         <Button variant={plan.highlight ? 'primary' : 'secondary'} className="w-full">Escolher {plan.name}</Button>
      </div>
   </div>
);

function App() {
   const scrollToStage = () => document.getElementById('stage')?.scrollIntoView({ behavior: 'smooth' });

   return (
      <div className="min-h-screen font-sans bg-brand-light selection:bg-brand-primary/30">
         {/* Global Fixed Background */}
         <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/20 via-brand-light to-brand-light">
               <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-brand-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
               <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-brand-secondary/10 rounded-full blur-[120px] animate-float" />
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            </div>
         </div>

         <AnnouncementBar />
         <Navbar />

         {/* --- 1. HERO SECTION (Full Screen - No Buttons) --- */}
         <section className="relative h-screen w-full flex items-center justify-center overflow-hidden z-10">
            <div className="relative z-10 max-w-5xl mx-auto px-4 text-center mt-[-5vh]">
               <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md border border-brand-primary/30 px-4 py-1.5 rounded-full mb-8 animate-float shadow-lg shadow-brand-primary/20">
                  <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse shadow-[0_0_10px_#A7D3FF]"></span>
                  <span className="text-brand-dark text-xs font-bold tracking-widest uppercase">METAVERSO • FUNK • TRAP</span>
               </div>

               <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-bold leading-none tracking-tighter mb-6 text-brand-dark drop-shadow-sm uppercase">
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-brand-dark to-brand-primary animate-pulse-slow bg-[length:200%_auto]">
                     {HERO_CONTENT.tagline}
                  </span>
               </h1>

               <p className="text-lg md:text-2xl text-brand-gray mb-10 max-w-3xl mx-auto font-light leading-relaxed whitespace-pre-line">
                  {HERO_CONTENT.subTagline}
               </p>
            </div>

            {/* Scroll indicator removed */}
         </section>

         {/* --- 2. STAGE SECTION (The Player) --- */}
         <section id="stage" className="relative w-full py-16 flex flex-col items-center justify-center overflow-hidden z-10">
            <div className="relative z-20 w-full flex flex-col items-center">
               <div className="mb-8 flex items-center gap-3 bg-white/50 backdrop-blur-md px-6 py-2 rounded-full border border-brand-primary/20 shadow-sm">
                  <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_15px_red]"></span>
                  <h2 className="text-brand-dark font-display font-bold tracking-widest text-sm uppercase">Ao Vivo Agora: Palco Principal</h2>
               </div>
               <ImmersivePlayer />
            </div>
         </section>

         {/* --- 3. SOCIAL HUB (Community) --- */}
         <section id="community" className="py-24 relative overflow-hidden z-10">
            <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center relative z-10">
               <div className="relative order-2 md:order-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {FEATURES.map((feature, idx) => (
                        <div key={idx} className="glass-panel p-6 rounded-2xl hover:translate-y-[-3px] transition-all duration-300">
                           <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center mb-4 text-brand-secondary"><feature.icon size={20} /></div>
                           <h3 className="text-lg font-bold font-display mb-2 text-brand-dark">{feature.title}</h3>
                           <p className="text-brand-gray text-sm leading-relaxed font-medium">{feature.description}</p>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="order-1 md:order-2">
                  <SectionTitle title={SOCIAL_HUB_CONTENT.title} subtitle={SOCIAL_HUB_CONTENT.subtitle} centered={false} />
                  <div className="space-y-8">
                     <div className="flex gap-4 group">
                        <div className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-brand-dark transition-colors"><MessageSquare size={24} /></div>
                        <div><h4 className="text-xl font-bold font-display text-brand-dark mb-1">{SOCIAL_HUB_CONTENT.chatFeature.title}</h4><p className="text-brand-gray">{SOCIAL_HUB_CONTENT.chatFeature.description}</p></div>
                     </div>
                     <div className="flex gap-4 group">
                        <div className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-brand-dark transition-colors"><Video size={24} /></div>
                        <div><h4 className="text-xl font-bold font-display text-brand-dark mb-1">{SOCIAL_HUB_CONTENT.squadFeature.title}</h4><p className="text-brand-gray">{SOCIAL_HUB_CONTENT.squadFeature.description}</p></div>
                     </div>
                     {/* Stats removed as requested */}
                  </div>
               </div>
            </div>
         </section>

         {/* --- 6. ARTISTS / LINEUP --- */}
         <section id="artists" className="py-24 relative overflow-hidden z-10">
            <SectionTitle title="Quem Comanda o Som" subtitle="Os maiores nomes da música e da arte digital." />
            <div className="max-w-7xl mx-auto px-4">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">{ARTISTS.map((artist, idx) => (<ArtistCard key={idx} artist={artist} />))}</div>
            </div>
         </section>

         {/* --- 7. PLANS --- */}
         <section id="plans" className="py-24 relative overflow-hidden z-10">
            <div className="relative z-10">
               <SectionTitle title="Escolha Seu Acesso" subtitle="De visitante a VIP. Tem espaço para todo mundo." />
               <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-6">
                  {PLANS.map((plan, idx) => (<PlanCard key={idx} plan={plan} />))}
               </div>
            </div>
         </section>

         {/* --- 8. EDITORIAL POSTER FOOTER --- */}
         <footer className="bg-brand-primary text-brand-dark py-20 relative overflow-hidden z-20">
            <div className="max-w-[1920px] mx-auto px-6 md:px-12 relative z-10">
               <div className="w-full border-b-4 border-brand-dark pb-2 mb-12">
                  <h1 className="text-[12vw] leading-[0.85] font-display font-black tracking-tighter uppercase text-center md:text-left">{APP_NAME}</h1>
               </div>
               <div className="grid md:grid-cols-12 gap-12 items-start">
                  <div className="md:col-span-5 space-y-6">
                     <p className="text-xl md:text-2xl font-medium leading-snug max-w-xl">Nossa missão é simples: Democratizamos grandes shows e eventos exclusivos com uma experiência imersiva. O palco agora é de todos.</p>
                     <p className="text-sm font-bold uppercase tracking-wider opacity-60">© 2025 {APP_NAME} Experience</p>
                  </div>
                  <div className="md:col-span-7 flex flex-col md:flex-row justify-end gap-16">
                     <div className="flex flex-col gap-4">
                        <h4 className="font-bold text-xl uppercase tracking-wider mb-2">Social</h4>
                        <div className="flex gap-4">
                           <a href="#" className="w-12 h-12 border-2 border-brand-dark rounded-full flex items-center justify-center hover:bg-brand-dark hover:text-brand-primary transition-all"><Instagram size={24} /></a>
                           <a href="#" className="w-12 h-12 border-2 border-brand-dark rounded-full flex items-center justify-center hover:bg-brand-dark hover:text-brand-primary transition-all"><Twitter size={24} /></a>
                           <a href="#" className="w-12 h-12 border-2 border-brand-dark rounded-full flex items-center justify-center hover:bg-brand-dark hover:text-brand-primary transition-all"><Youtube size={24} /></a>
                        </div>
                     </div>
                     <div className="flex flex-col gap-4">
                        <h4 className="font-bold text-xl uppercase tracking-wider mb-2">Global</h4>
                        <div className="flex items-center gap-2 text-lg font-medium"><Globe size={20} /> <span>Brasil (PT-BR)</span></div>
                        <button className="flex items-center gap-2 text-lg font-bold hover:underline mt-4">Fale Conosco <ArrowUpRight size={20} /></button>
                     </div>
                  </div>
               </div>
            </div>
         </footer>
      </div>
   );
}

export default App;