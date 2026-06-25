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

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@construsmart.com"

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured")
      return new Response(JSON.stringify({ error: "Email service not configured" }), { status: 500, headers })
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Construsmart <${FROM_EMAIL}>`,
        to: [body.to],
        subject: body.subject,
        html: body.html,
        text: body.text || body.html.replace(/<[^>]*>/g, ""),
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error("Resend API error:", data)
      return new Response(JSON.stringify({ error: "Failed to send email", details: data }), { status: 500, headers })
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), { status: 200, headers })
  } catch (e) {
    console.error("Error:", e.message)
    return new Response(JSON.stringify({ error: e.message || "Internal server error" }), { status: 500, headers })
  }
})