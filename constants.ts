
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

export const LIVE_STREAM_VIDEO_ID = "w2t5PdoNMnw"; // User provided Trap/Rap Mix

export const NAV_ITEMS = [];

export const HERO_CONTENT = {
  tagline: "PALCO DA NOVA GERAÇÃO",
  subTagline: "O maior palco digital do entretenimento brasileiro!\nAo vivo, em qualquer lugar.",
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
  {
    name: 'Matuê',
    role: 'Trap / 30PRAUM',
    image: '/assets/artists/matue.png'
  },
  {
    name: 'MC IG',
    role: 'Funk / 4M',
    image: '/assets/artists/mcig.png'
  },
  {
    name: 'Recayd Mob',
    role: 'Trap / Coletivo',
    image: '/assets/artists/recaydmob.png'
  },
  {
    name: 'Ajuliacosta',
    role: 'Rap',
    image: '/assets/artists/ajuliacosta.jpg'
  }
];

export const PLANS: Plan[] = [
  {
    name: 'Pista',
    price: 'Gratuito',
    features: ['Sem cadastro', 'Acesso básico'],
    color: 'border-slate-100'
  },
  {
    name: 'Fan',
    price: 'R$ 9,99',
    features: ['7 dias de acesso', 'Acesso total', 'Chat exclusivo', 'Ranking', 'Emotes'],
    color: 'border-brand-primary',
    highlight: false
  },
  {
    name: 'Camarote VIP',
    price: 'R$ 89,90/semestre',
    features: ['Backstage', 'Sorteios', 'Top Doador', 'Assinatura Semestral'],
    highlight: true,
    color: 'border-brand-secondary'
  },
  {
    name: 'Celebridade',
    price: 'Influencer',
    features: ['Painel de impacto', 'Bônus engajamento', 'Verificado'],
    color: 'border-purple-300'
  }
];

export const FOOTER_LINKS = [
  { label: 'Sobre', href: '#' },
  { label: 'Ajuda', href: '#' },
  { label: 'Privacidade', href: '#' },
];
