import { ElementType } from 'react';

export interface Feature {
    icon: ElementType;
    title: string;
    description: string;
}

export interface Plan {
    name: string;
    price: string;
    features: string[];
    highlight?: boolean;
}

export interface Artist {
    name: string;
    role: string;
    image: string;
}
