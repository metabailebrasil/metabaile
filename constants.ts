
import { 
  Users, 
  Zap, 
  Trophy, 
  Radio,
  Gamepad2,
  BarChart3,
  Heart,
  Crown,
  TrendingUp,
  Gift
} from 'lucide-react';
import { Plan, Feature, Artist } from './types';

export const APP_NAME = "METABAILE";

export const NAV_ITEMS = [
  { label: 'Experiência', href: '#experience' },
  { label: 'Features', href: '#uniques' },
  { label: 'Comunidade', href: '#community' },
  { label: 'Line-up', href: '#artists' },
  { label: 'Acesso', href: '#plans' },
];

export const HERO_CONTENT = {
  tagline: "PALCO DA NOVA GERAÇÃO",
  subTagline: "O maior palco digital do entretenimento brasileiro! Ao vivo, em qualquer lugar.",
  ctaPrimary: "Entrar na Pista",
  ctaSecondary: "Criar Evento"
};

export const SOCIAL_HUB_CONTENT = {
  title: "Sua Galera. Seu Ritmo.",
  subtitle: "Sinta a vibe de mil pessoas ou feche a sala só para os reais. Você escolhe como curtir.",
  chatFeature: {
    title: "Arena Global",
    description: "O hype em tempo real. Reações, rankings e missões coletivas que desbloqueiam drops."
  },
  squadFeature: {
    title: "Modo Squad",
    description: "Salas privadas de áudio e vídeo. A resenha com os amigos sem perder um segundo do show."
  }
};

export const FEATURES: Feature[] = [
  {
    title: 'Interação Real',
    description: 'Você não só assiste. Você controla câmeras e escolhe o setlist.',
    icon: Zap
  },
  {
    title: 'Watch Party',
    description: 'Áudio espacial e salas privadas. Parece que vocês estão lado a lado.',
    icon: Users
  },
  {
    title: 'Gamificação',
    description: 'Complete missões, ganhe XP e desbloqueie status na comunidade.',
    icon: Gamepad2
  },
  {
    title: 'After Infinito',
    description: 'O show acaba, a resenha continua. Feed de cortes, memes e destaques.',
    icon: Heart
  },
  {
    title: 'Apoie Creators',
    description: 'Drops e micro-tipping direto para quem faz o show acontecer.',
    icon: BarChart3
  }
];

export const COMMUNITY_STATS = [
  { label: 'Online Agora', value: '125k', icon: Users },
  { label: 'Drops', value: '850k', icon: Trophy },
  { label: 'Creators', value: '3.2k', icon: Radio },
];

export const GAMIFICATION_PILLARS = [
  {
    title: "Status",
    description: "Badges exclusivos mostram quem manda na pista.",
    icon: Crown
  },
  {
    title: "Evolução",
    description: "XP e níveis que destravam recursos novos.",
    icon: TrendingUp
  },
  {
    title: "Drops",
    description: "Itens digitais e recompensas que valem de verdade.",
    icon: Gift
  }
];

export const ARTISTS: Artist[] = [
  { name: 'DJ Lumi', role: 'Electronic', image: 'https://images.unsplash.com/photo-1571266028243-37160d7fdd92?w=400&h=500&fit=crop' },
  { name: 'MC Flow', role: 'Trap / Funk', image: 'https://images.unsplash.com/photo-1517230874863-439977a74349?w=400&h=500&fit=crop' },
  { name: 'Studio Z', role: 'Visual Art', image: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=400&h=500&fit=crop' },
  { name: 'Sara B', role: 'Open Format', image: 'https://images.unsplash.com/photo-1520333789090-1afc82db536a?w=400&h=500&fit=crop' },
];

export const PLANS: Plan[] = [
  {
    name: 'Free',
    price: 'Visitante',
    features: ['Acesso ao show', 'Modo Espectador', 'Visualização passiva'],
    color: 'border-slate-100'
  },
  {
    name: 'Fan',
    price: 'Membro',
    features: ['Chat & Reações', 'Ranking Global', 'XP Padrão'],
    color: 'border-brand-primary',
    highlight: false
  },
  {
    name: 'VIP',
    price: 'R$ 29/mês',
    features: ['Backstage Pass', 'Drops Raros', 'Badge Dourado', 'XP Dobrado'],
    highlight: true,
    color: 'border-brand-secondary'
  },
  {
    name: 'Creator',
    price: 'Parceiro',
    features: ['Verificado', 'Ferramentas de Live', 'Monetização'],
    color: 'border-purple-300'
  }
];

export const FOOTER_LINKS = [
  { label: 'Sobre', href: '#' },
  { label: 'Ajuda', href: '#' },
  { label: 'Privacidade', href: '#' },
];
