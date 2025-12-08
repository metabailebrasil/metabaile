
import { supabase } from './supabase';

export const createCheckoutSession = async (eventId: string, priceId?: string) => {
    // 1. Verify if user is logged in
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'need_auth' };
    }

    try {
        console.log(`[Stripe] Creating checkout for event ${eventId} user ${user.id} with price ${priceId}`);

        // 2. Call our Vercel Serverless Function
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                eventId,
                userId: user.id,
                priceId
            })
        });

        // --- DEV ENVIRONMENT HANDLING ---
        // If we are on localhost and the API returns 404 (endpoint not found),
        // it means the Vercel function isn't running. We mock success to unblock UI testing.
        if (response.status === 404) {
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.warn("[Dev] API endpoint not found (404). Simulating Stripe Redirect.");
                alert("MOCK MODE: API não encontrada (404).\n\nComo você está em localhost sem backend rodando, vou simular o sucesso para você ver a tela.");

                await new Promise(resolve => setTimeout(resolve, 1000));
                return { success: true };
            }
        }

        // Check content-type to ensure we got JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            // Additional check for non-JSON responses (like 500 HTML error pages)
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.warn("[Dev] API endpoint returned non-JSON. Simulating Stripe Redirect.");
                alert("MOCK MODE: Resposta inválida da API.\n\nSimulando redirecionamento...");

                await new Promise(resolve => setTimeout(resolve, 1000));
                return { success: true };
            }
            throw new Error(`Resposta inválida da API: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao criar sessão de pagamento');
        }

        if (data.url) {
            // Redirect to Stripe
            window.location.href = data.url;
            return { success: true };
        } else {
            throw new Error('Nenhuma URL de checkout retornada');
        }

    } catch (error: any) {
        console.error('Erro no checkout:', error);

        // Friendly error for empty JSON input (common with opaque 500s or network issues)
        if (error.message.includes('JSON')) {
            if (window.location.hostname === 'localhost') {
                alert("Ambiente de Desenvolvimento: A API '/api' não está acessível.\nExecute com 'vercel dev' para testar pagamentos reais.");
                return { success: true }; // Treat as success to unblock UI testing
            }
        }

        alert(`Erro ao iniciar pagamento: ${error.message}`);
        return { error: error.message };
    }
};
