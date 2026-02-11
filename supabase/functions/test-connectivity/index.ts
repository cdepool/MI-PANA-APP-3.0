// Supabase Edge Function: Connectivity Test
// Equivalent to curl -k https://adminp2p.sitca-ve.com

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        console.log('Testing connectivity to Bancamiga via Proxy...');

        const PROXY_URL = Deno.env.get('BANCAMIGA_HOST') || 'http://35.202.142.88';
        console.log(`Using Proxy URL: ${PROXY_URL}`);

        const endpoints = [
            'https://api.ipify.org?format=json',
            'http://35.202.142.88:3000/api/payments/health',
            'http://35.202.142.88/healthcheck',
            `${PROXY_URL}/healthcheck`,
            'https://adminp2p.sitca-ve.com/healthcheck'
        ];

        const results = [];

        for (const url of endpoints) {
            console.log(`Testing ${url}...`);
            try {
                const response = await fetch(url, {
                    method: 'GET', // Or POST if testing token endpoint specifically
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Supabase Edge Function)',
                    }
                });

                const body = await response.text();

                results.push({
                    url,
                    status: response.status,
                    body: body.substring(0, 100),
                    headers: Object.fromEntries(response.headers.entries())
                });
            } catch (err) {
                console.error(`Error testing ${url}:`, err);
                results.push({
                    url,
                    error: err.message
                });
            }
        }

        return new Response(JSON.stringify({
            success: true,
            proxyUsed: PROXY_URL,
            results
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Connectivity Test Failed:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
