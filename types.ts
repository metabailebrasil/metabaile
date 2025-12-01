import { LucideIcon } from 'lucide-react';

export interface Plan {
  name: string;
  price: string;
  features: string[];
  highlight?: boolean;
  color: string;
}

export interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface Artist {
  name: string;
  role: string;
  image: string;
}

export interface NavItem {
  label: string;
  href: string;
}