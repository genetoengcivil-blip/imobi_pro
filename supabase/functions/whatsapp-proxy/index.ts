import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  // Tratamento de CORS para o Navegador
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { instance, number, text, action } = await req.json()
    const API_KEY = Deno.env.get('EVOLUTION_API_KEY')
    const API_URL = Deno.env.get('EVOLUTION_API_URL')

    if (!API_KEY || !API_URL) {
      throw new Error("Secrets não configurados no Supabase.")
    }

    // Ação para verificar se o WhatsApp está ligado
    if (action === 'status') {
      const res = await fetch(`${API_URL}/instance/connectionState/${instance}`, {
        headers: { 'apikey': API_KEY }
      })
      const data = await res.json()
      return new Response(JSON.stringify(data), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Ação para enviar mensagem de texto
    const cleanNumber = number.replace(/\D/g, "")
    const response = await fetch(`${API_URL}/message/sendText/${instance}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": API_KEY },
      body: JSON.stringify({
        number: cleanNumber,
        text: text,
        options: { delay: 1200, presence: "composing" }
      })
    })

    const result = await response.json()
    return new Response(JSON.stringify(result), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  }
})