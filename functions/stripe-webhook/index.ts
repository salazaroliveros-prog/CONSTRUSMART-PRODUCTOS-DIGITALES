import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@12.0.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  
  if (!signature || !webhookSecret) {
    return new Response(JSON.stringify({ error: 'Missing signature or secret' }), { 
      status: 400 
    })
  }

  const body = await req.text()
  
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )

    console.log(`Webhook received: ${event.type}`)

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object)
        break
        
      case 'payment_intent.failed':
        await handlePaymentFailure(event.data.object)
        break
        
      case 'charge.refunded':
        await handleRefund(event.data.object)
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
    
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 400 })
  }
})

async function handlePaymentSuccess(paymentIntent: any) {
  try {
    const metadata = paymentIntent.metadata
    
    // Actualizar orden en la base de datos
    const { error } = await supabase
      .from('constructora_orders')
      .update({ 
        status: 'paid',
        payment_intent_id: paymentIntent.id,
        paid_at: new Date().toISOString()
      })
      .eq('notes', `Stripe PaymentIntent: ${paymentIntent.id}`)
    
    if (error) throw error
    
    console.log(`Order updated for payment intent: ${paymentIntent.id}`)
    
  } catch (error) {
    console.error('Error handling payment success:', error)
    throw error
  }
}

async function handlePaymentFailure(paymentIntent: any) {
  try {
    const metadata = paymentIntent.metadata
    
    // Actualizar orden como fallida
    const { error } = await supabase
      .from('constructora_orders')
      .update({ 
        status: 'failed',
        payment_intent_id: paymentIntent.id,
        failure_reason: paymentIntent.last_payment_error?.message
      })
      .eq('notes', `Stripe PaymentIntent: ${paymentIntent.id}`)
    
    if (error) throw error
    
    console.log(`Order marked as failed: ${paymentIntent.id}`)
    
  } catch (error) {
    console.error('Error handling payment failure:', error)
    throw error
  }
}

async function handleRefund(charge: any) {
  try {
    // Actualizar orden como reembolsada
    const { error } = await supabase
      .from('constructora_orders')
      .update({ 
        status: 'refunded',
        refund_amount: charge.amount_refunded / 100,
        refunded_at: new Date().toISOString()
      })
      .eq('payment_intent_id', charge.payment_intent)
    
    if (error) throw error
    
    console.log(`Order refunded: ${charge.payment_intent}`)
    
  } catch (error) {
    console.error('Error handling refund:', error)
    throw error
  }
}