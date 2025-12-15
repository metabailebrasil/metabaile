
import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY || '').trim(), {
    apiVersion: '2024-12-18.acacia' as any,
    typescript: true,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message_id, amount, highlight_color, message_content, return_url } = req.body;

        if (!message_id || !amount) {
            return res.status(400).json({ error: 'Missing message_id or amount' });
        }

        const successUrl = return_url || req.headers.origin || 'https://metabaile.com';

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'brl',
                        product_data: {
                            name: 'Mensagem Destacada',
                            description: message_content ? `"${message_content.substring(0, 50)}..."` : 'Super Chat',
                            metadata: {
                                message_id: message_id
                            }
                        },
                        unit_amount: Math.round(parseFloat(amount) * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${successUrl}?superchat_success=true`,
            cancel_url: `${successUrl}?superchat_canceled=true`,
            metadata: {
                message_id: message_id,
                type: 'super_chat',
                highlight_color: highlight_color || ''
            },
        });

        return res.status(200).json({ url: session.url });

    } catch (error: any) {
        console.error('Stripe error:', error);
        return res.status(500).json({ error: error.message });
    }
}
