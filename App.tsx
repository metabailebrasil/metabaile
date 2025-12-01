import React, { useState, PropsWithChildren } from 'react';
import Navbar from './components/Navbar';
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
   <div className={`relative p-8 rounded-[2rem] border transition-all duration-500 hover:scale-[1.02] group overflow-hidden ${plan.highlight ? 'bg-white/10 border-brand-primary/50 shadow-[0_0_30px_rgba(167,211,255,0.15)]' : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'}`}>
      {plan.highlight && (
         <>
            <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/10 to-transparent opacity-50 pointer-events-none" />
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-brand-primary text-brand-dark text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg z-10">Mais Popular</div>
         </>
      )}
      <div className="relative z-10">
         <h3 className={`text-2xl font-display font-bold mb-2 ${plan.highlight ? 'text-white' : 'text-slate-200'}`}>{plan.name}</h3>
         <div className="flex items-baseline mb-6">
            <span className={`text-4xl font-bold ${plan.highlight ? 'text-brand-primary drop-shadow-[0_0_10px_rgba(167,211,255,0.5)]' : 'text-white'}`}>{plan.price}</span>
         </div>
         <ul className="space-y-4 mb-8">
            {plan.features.map((feat, i) => (
               <li key={i} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${plan.highlight ? 'bg-brand-primary text-brand-dark' : 'bg-white/10 text-white'}`}>
                     <Check size={12} strokeWidth={3} />
                  </div>
                  <span className={`text-sm font-medium ${plan.highlight ? 'text-slate-200' : 'text-slate-400'}`}>{feat}</span>
               </li>
            ))}
         </ul>
         <Button variant={plan.highlight ? 'primary' : 'outline-white'} className="w-full">Escolher Plano</Button>
      </div>
   </div>
);

function App() {
   const scrollToStage = () => document.getElementById('stage')?.scrollIntoView({ behavior: 'smooth' });

   return (
      <div className="min-h-screen font-sans bg-brand-light">
         <Navbar />

         {/* --- 1. HERO SECTION (Full Screen - No Buttons) --- */}
         <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 w-full h-full bg-brand-dark">
               <img src="https://img.freepik.com/free-photo/view-futuristic-city-with-lighting_23-2151069502.jpg?t=st=1708899000~exp=1708902600~hmac=a1b2c3d4e5f6" alt="Cyberpunk City" className="w-full h-full object-cover opacity-80 mix-blend-screen" style={{ filter: 'hue-rotate(180deg) saturate(1.5) contrast(1.1)' }} />
               <div className="absolute inset-0 bg-brand-dark/40 mix-blend-multiply" />
               <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/20 to-brand-primary/10" />
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 contrast-150 mix-blend-overlay"></div>
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 text-center mt-[-5vh]">
               <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-brand-primary/30 px-4 py-1.5 rounded-full mb-8 animate-float">
                  <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse shadow-[0_0_10px_#A7D3FF]"></span>
                  <span className="text-brand-primary text-xs font-bold tracking-widest uppercase">Metaverso • Live • Social</span>
               </div>

               <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-bold leading-none tracking-tighter mb-6 text-white drop-shadow-[0_0_30px_rgba(167,211,255,0.3)] uppercase">
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-white to-brand-primary animate-pulse-slow">
                     {HERO_CONTENT.tagline}
                  </span>
               </h1>

               <p className="text-lg md:text-2xl text-blue-100/90 mb-10 max-w-3xl mx-auto font-light leading-relaxed drop-shadow-md">
                  {HERO_CONTENT.subTagline}
               </p>

               {/* Buttons Removed as requested */}
            </div>

            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-white/50 flex flex-col items-center gap-2 animate-bounce cursor-pointer" onClick={scrollToStage}>
               <span className="text-xs uppercase tracking-widest font-bold">Scroll to Party</span>
               <ChevronDown size={24} />
            </div>
         </section>

         {/* --- 2. STAGE SECTION (The Player) --- */}
         <section id="stage" className="relative w-full py-16 bg-brand-dark flex flex-col items-center justify-center">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-brand-dark to-transparent z-10 pointer-events-none" />
            <div className="relative z-20 w-full flex flex-col items-center">
               <div className="mb-8 flex items-center gap-3">
                  <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_15px_red]"></span>
                  <h2 className="text-white font-display font-bold tracking-widest text-sm uppercase">Ao Vivo Agora: Palco Principal</h2>
               </div>
               <ImmersivePlayer />
            </div>
         </section>

         {/* --- 3. SOCIAL HUB (Community) --- */}
         <section id="community" className="py-24 relative overflow-hidden bg-white">
            <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
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
                     <div className="pt-6 flex gap-8 border-t border-slate-100">
                        {COMMUNITY_STATS.map((stat, idx) => (<div key={idx}><p className="text-3xl font-bold font-display text-brand-dark">{stat.value}</p><p className="text-sm font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1"><stat.icon size={12} /> {stat.label}</p></div>))}
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* --- 5. GAMIFICATION --- */}
         <section id="gamification" className="py-24 bg-brand-dark text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-primary/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="max-w-7xl mx-auto px-4 relative z-10">
               <SectionTitle dark title="Jogue Enquanto Curte" subtitle="O primeiro festival onde sua participação vale recompensas reais." />
               <div className="grid md:grid-cols-3 gap-8 mt-16">
                  {GAMIFICATION_PILLARS.map((pillar, idx) => (
                     <div key={idx} className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors text-center group">
                        <div className="w-16 h-16 mx-auto bg-gradient-brand rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(167,211,255,0.3)] group-hover:scale-110 transition-transform"><pillar.icon size={32} className="text-brand-dark" /></div>
                        <h3 className="text-2xl font-bold font-display mb-3">{pillar.title}</h3>
                        <p className="text-slate-300 leading-relaxed">{pillar.description}</p>
                     </div>
                  ))}
               </div>
               <div className="mt-16 text-center"><Button variant="primary" className="mx-auto">Ver Recompensas Disponíveis</Button></div>
            </div>
         </section>

         {/* --- 6. ARTISTS / LINEUP --- */}
         <section id="artists" className="py-24 bg-white">
            <SectionTitle title="Quem Comanda o Som" subtitle="Os maiores nomes da música e da arte digital." />
            <div className="max-w-7xl mx-auto px-4">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">{ARTISTS.map((artist, idx) => (<ArtistCard key={idx} artist={artist} />))}</div>
               <div className="mt-12 text-center"><Button variant="secondary" className="mx-auto">Ver Line-up Completo</Button></div>
            </div>
         </section>

         {/* --- 7. PLANS --- */}
         <section id="plans" className="py-24 bg-brand-dark relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="relative z-10">
               <SectionTitle dark title="Escolha Seu Acesso" subtitle="De visitante a VIP. Tem espaço para todo mundo." />
               <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-6">
                  {PLANS.map((plan, idx) => (<PlanCard key={idx} plan={plan} />))}
               </div>
            </div>
         </section>

         {/* --- 8. EDITORIAL POSTER FOOTER --- */}
         <footer className="bg-brand-primary text-brand-dark py-20 relative overflow-hidden">
            <div className="max-w-[1920px] mx-auto px-6 md:px-12 relative z-10">
               <div className="w-full border-b-4 border-brand-dark pb-2 mb-12">
                  <h1 className="text-[12vw] leading-[0.85] font-display font-black tracking-tighter uppercase text-center md:text-left">{APP_NAME}</h1>
               </div>
               <div className="grid md:grid-cols-12 gap-12 items-start">
                  <div className="md:col-span-5 space-y-6">
                     <p className="text-xl md:text-2xl font-medium leading-snug max-w-xl">Nossa missão é simples: transformar o streaming passivo em uma experiência coletiva e memorável. O palco agora é de todos.</p>
                     <p className="text-sm font-bold uppercase tracking-wider opacity-60">© 2025 {APP_NAME} Experience</p>
                  </div>
                  <div className="md:col-span-7 flex flex-col md:flex-row justify-between gap-12">
                     <div className="flex flex-col gap-4">
                        <h4 className="font-bold text-xl uppercase tracking-wider mb-2">Plataforma</h4>
                        {FOOTER_LINKS.map((link, i) => (<a key={i} href={link.href} className="text-lg font-medium hover:underline decoration-2 underline-offset-4">{link.label}</a>))}
                     </div>
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