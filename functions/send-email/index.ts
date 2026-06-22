import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  try {
    const { to, subject, html, text } = await req.json()
    
    // Usar Supabase Email (Resend)
    const { data, error } = await supabase.auth.admin.sendEmail({
      to,
      subject,
      html,
      text,
    })
    
    if (error) throw error
    
    return new Response(JSON.stringify({ success: true, data }), { status: 200 })
  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})