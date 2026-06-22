export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { amount, currency = 'usd', metadata = {} } = await req.json();

    const gatewayApiKey = Deno.env.get("GATEWAY_API_KEY");
    if (!gatewayApiKey) throw new Error("Gateway API key not configured");
    if (!amount || amount <= 0) throw new Error("Invalid amount");

    const response = await fetch('https://stripe.gateway.fastrouter.io/payments/payment-intents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': gatewayApiKey
      },
      body: JSON.stringify({ amount, currency, metadata })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create payment intent');

    return new Response(JSON.stringify({
      clientSecret: data.clientSecret,
      paymentIntentId: data.id
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
