import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { instance, number, text, action } = await req.json()
    const API_KEY = Deno.env.get('EVOLUTION_API_KEY')
    const API_URL = Deno.env.get('EVOLUTION_API_URL')

    if (!API_KEY || !API_URL) throw new Error("Secrets não configurados no Supabase.")

    // Ação: Verificar Status e gerar QR Code
    if (action === 'status') {
      const res = await fetch(`${API_URL}/instance/connectionState/${instance}`, {
        headers: { 'apikey': API_KEY }
      })
      const statusData = await res.json()

      let qrcode = null;
      if (statusData?.instance?.state !== 'open') {
        const resQr = await fetch(`${API_URL}/instance/connect/${instance}`, {
          headers: { 'apikey': API_KEY }
        })
        qrcode = await resQr.json()
      }

      return new Response(JSON.stringify({ ...statusData, qrcode }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Ação: Enviar Mensagem
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
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  }
})