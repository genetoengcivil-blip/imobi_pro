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

    // 🚀 AÇÃO: VERIFICAR STATUS E GERAR/CRIAR QR CODE
    if (action === 'status') {
      let res = await fetch(`${API_URL}/instance/connectionState/${instance}`, {
        headers: { 'apikey': API_KEY }
      })
      let statusData = await res.json()
      let qrcode = null;

      // SE A INSTÂNCIA NÃO EXISTIR (Erro 404), VAMOS CRIÁ-LA AGORA!
      if (res.status === 404 || statusData.error || statusData.status === 404) {
        const createRes = await fetch(`${API_URL}/instance/create`, {
          method: 'POST',
          headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instanceName: instance,
            qrcode: true,
            integration: "WHATSAPP-BAILEYS"
          })
        });
        const createData = await createRes.json();
        qrcode = createData.qrcode || createData;
        statusData = { instance: { state: 'connecting' } }; // Força o status para não dar erro no front
      } 
      // SE JÁ EXISTE MAS ESTÁ DESCONECTADA, PEDE O QR CODE
      else if (statusData?.instance?.state !== 'open') {
        const resQr = await fetch(`${API_URL}/instance/connect/${instance}`, {
          headers: { 'apikey': API_KEY }
        });
        qrcode = await resQr.json();
      }

      // Tratamento para garantir que extraímos o Base64 corretamente (Compatível com Evolution v1 e v2)
      let base64 = null;
      if (qrcode?.base64) base64 = qrcode.base64;
      else if (qrcode?.qrcode?.base64) base64 = qrcode.qrcode.base64;
      else if (qrcode?.code) base64 = qrcode.code;

      return new Response(JSON.stringify({ 
        ...statusData, 
        qrcode: { base64: base64 } 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // 🚀 AÇÃO: ENVIAR MENSAGEM
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