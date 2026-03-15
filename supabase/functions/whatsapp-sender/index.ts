import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const API_URL = Deno.env.get('EVOLUTION_API_URL')
const API_KEY = Deno.env.get('EVOLUTION_API_KEY')
const INSTANCE = Deno.env.get('EVOLUTION_INSTANCE')

serve(async (req) => {
  try {
    const { phone, message } = await req.json()

    // Limpa o número (remove caracteres não numéricos)
    const cleanPhone = phone.replace(/\D/g, '')

    const response = await fetch(`${API_URL}/message/sendText/${INSTANCE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY
      },
      body: JSON.stringify({
        number: cleanPhone,
        text: message,
        delay: 1200, 
        linkPreview: true
      })
    })

    const result = await response.json()
    return new Response(JSON.stringify(result), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})