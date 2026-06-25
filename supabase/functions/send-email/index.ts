import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

Deno.serve(async (req) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers })
  }

  try {
    const body = await req.json()

    if (!body.to || !body.subject || !body.html) {
      return new Response(JSON.stringify({ error: "Missing required fields: to, subject, html" }), { status: 400, headers })
    }

    // SMTP credentials from Supabase Secrets
    const SMTP_HOST = Deno.env.get("SMTP_HOST") || "smtp.gmail.com"
    const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "587")
    const SMTP_USER = Deno.env.get("SMTP_USER")
    const SMTP_PASS = Deno.env.get("SMTP_PASS")
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@construsmartproductoswm.com"

    if (!SMTP_USER || !SMTP_PASS) {
      console.error("SMTP credentials not configured")
      return new Response(JSON.stringify({ error: "Email service not configured - configure SMTP_USER and SMTP_PASS secrets" }), { status: 500, headers })
    }

    const client = new SmtpClient()

    try {
      await client.connectTLS({
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        username: SMTP_USER,
        password: SMTP_PASS,
      })

      await client.send({
        from: `Construsmart <${FROM_EMAIL}>`,
        to: body.to,
        subject: body.subject,
        content: body.html,
        html: body.html,
      })

      await client.close()
    } catch (smtpError) {
      console.error("SMTP error:", smtpError.message)
      return new Response(JSON.stringify({ error: "Failed to send email: " + smtpError.message }), { status: 500, headers })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers })
  } catch (e) {
    console.error("Error:", e.message)
    return new Response(JSON.stringify({ error: e.message || "Internal server error" }), { status: 500, headers })
  }
})