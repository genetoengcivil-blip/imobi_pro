import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const API_KEY = Deno.env.get('EVOLUTION_API_KEY')
    const API_URL = Deno.env.get('EVOLUTION_API_URL')?.replace(/\/$/, '') // Remove barra final se houver
    
    const { instance, action } = await req.json()
    console.log(`[LOG] Ação: ${action} para instância: ${instance}`)

    // 1. Tentar ver o status
    const response = await fetch(`${API_URL}/instance/connectionState/${instance}`, {
      headers: { 'apikey': API_KEY }
    })
    
    const data = await response.json()

    // 2. Se não existir (404), manda criar mas não espera o resultado eterno
    if (response.status === 404 || data.status === 404) {
      console.log("[LOG] Instância 404. Mandando criar...")
      
      // Chamada de criação "fire and forget" (rápida)
      fetch(`${API_URL}/instance/create`, {
        method: 'POST',
        headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName: instance, qrcode: true, integration: "WHATSAPP-BAILEYS" })
      })

      return new Response(JSON.stringify({ status: 'creating', message: 'A criar instância...' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 3. Se existir mas não estiver aberto, tenta pegar o QR Code
    if (data?.instance?.state !== 'open') {
      const qrRes = await fetch(`${API_URL}/instance/connect/${instance}`, {
        headers: { 'apikey': API_KEY }
      })
      const qrData = await qrRes.json()
      
      return new Response(JSON.stringify({
        instance: data.instance,
        qrcode: qrData?.base64 || qrData?.qrcode?.base64 || qrData?.code || null
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 4. Se estiver tudo OK
    return new Response(JSON.stringify(data), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error(`[ERRO]: ${error.message}`)
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 // Mandamos 200 para o navegador não bloquear o CORS
    })
  }
})