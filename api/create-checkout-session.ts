
import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2024-12-18.acacia' as any, // Cast to any to bypass strict typing if mismatch, or use '2025-02-24.acacia' if valid
});

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { eventId, priceId } = req.body;

        // TODO: Validate user session if strict security is needed.
        // For now, we assume the client is handling auth and we trust the request 
        // or we can verify the JWT from the Authorization header if we have the supabase-admin here.

        // Basic validation
        if (!eventId && !priceId) {
            return res.status(400).json({ error: 'Missing eventId or priceId' });
        }

        // For this example, we'll create a generic product/price or use a predefined one.
        // In a real app, you'd look up the event price from your DB using eventId.
        // We'll simulate a dynamic price for the event.

        let lineItems;

        if (priceId) {
            // If a specific price ID (or product ID logic) is passed.
            // In this case, user passed a Product ID 'prod_TZIG0vlyiE8WyQ' which implies a specific setup.
            // If priceId starts with 'price_', we use it directly.
            // If we are treating 'priceId' as a plan identifier or Product ID, we adjust:

            // Check if it's the specific Fan Plan product ID
            if (priceId === 'prod_TZIG0vlyiE8WyQ') {
                lineItems = [
                    {
                        price_data: {
                            currency: 'brl',
                            product: 'prod_TZIG0vlyiE8WyQ', // Use the existing product
                            unit_amount: 999, // R$ 9,99 - fallback/override if price not set on product
                        },
                        quantity: 1,
                    }
                ];
            } else if (priceId === 'prod_TZaoKg7gwyvkMv') {
                lineItems = [
                    {
                        price_data: {
                            currency: 'brl',
                            product: 'prod_TZaoKg7gwyvkMv',
                            unit_amount: 999, // R$ 9,99
                        },
                        quantity: 1,
                    }
                ];
            } else {
                // Fallback or other prices
                lineItems = [
                    {
                        price: priceId,
                        quantity: 1
                    }
                ];
            }

        } else {
            // Default / Old logic
            // Example: Standard Ticket R$ 9,99
            lineItems = [
                {
                    price_data: {
                        currency: 'brl',
                        product_data: {
                            name: 'Ingresso - Metabaile',
                            description: 'Acesso ao evento exclusivo no Metaverso',
                            images: ['https://metabaile.com/logo.png'], // Replace with real image
                        },
                        unit_amount: 999, // R$ 9,99
                    },
                    quantity: 1,
                },
            ];
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'boleto'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/?canceled=true`,
            metadata: {
                eventId: eventId,
                priceId: priceId || 'default'
                // userId: user.id // Pass user ID if available
            }
        });

        return res.status(200).json({ url: session.url });

    } catch (error: any) {
        console.error('Stripe error:', error);
        return res.status(500).json({ error: error.message });
    }
}
