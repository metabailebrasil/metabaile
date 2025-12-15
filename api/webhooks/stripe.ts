
import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const config = {
    api: {
        bodyParser: false,
    },
};

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY || '').trim(), {
    apiVersion: '2024-12-18.acacia' as any,
    typescript: true,
});

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const getRawBody = async (req: VercelRequest): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const body: Buffer[] = [];
        req.on('data', (chunk) => body.push(chunk));
        req.on('end', () => resolve(Buffer.concat(body)));
        req.on('error', (err) => reject(err));
    });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).end();

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
        return res.status(400).send('Missing signature or webhook secret');
    }

    let event: Stripe.Event;

    try {
        const buf = await getRawBody(req);
        event = stripe.webhooks.constructEvent(buf, sig as string, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.metadata?.type === 'super_chat' && session.metadata?.message_id) {
            const messageId = session.metadata.message_id;
            const amount = session.amount_total ? session.amount_total / 100 : 0;

            if (supabaseServiceKey && supabaseUrl) {
                const supabase = createClient(supabaseUrl, supabaseServiceKey);

                // Update message status to CONFIRMED
                const { error } = await supabase
                    .from('messages')
                    .update({
                        status: 'CONFIRMED',
                        donation_amount: amount,
                        is_donation: true
                    })
                    .eq('id', messageId);

                if (error) {
                    console.error('Error updating message status:', error);
                    return res.status(500).json({ error: 'Database update failed' });
                }
            } else {
                console.error('CRITICAL: Supabase credentials missing in Webhook');
                return res.status(500).send('Server config error');
            }
        }
    }

    res.json({ received: true });
}
