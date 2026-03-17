import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
}

serve(async (req: Request) => {
  // 1. Resposta imediata para autorizações de CORS (Preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const API_KEY = Deno.env.get('EVOLUTION_API_KEY')
    const API_URL = Deno.env.get('EVOLUTION_API_URL')

    if (!API_KEY || !API_URL) throw new Error("As chaves EVOLUTION_API não estão configuradas no Supabase.")

    const body = await req.json()
    const { instance, action } = body

    // 🛡️ MOTOR ANTI-CRASH: Impede que o Supabase mate a função por demorar muito
    const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 4000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return res;
      } catch (error) {
        clearTimeout(id);
        throw new Error(`A máquina da Evolution API (${url}) não respondeu a tempo ou bloqueou o Supabase.`);
      }
    };

    if (action === 'status') {
      console.log(`[STATUS] A verificar a instância: ${instance}`);
      
      let res = await fetchWithTimeout(`${API_URL}/instance/connectionState/${instance}`, {
        headers: { 'apikey': API_KEY }
      });
      
      let statusData = await res.json().catch(() => ({}));
      console.log(`[STATUS] Resposta da API:`, statusData);

      let qrcode = null;

      // Se a instância não existir, cria!
      if (res.status === 404 || statusData.error || statusData.status === 404) {
        console.log(`[CRIAR] Instância não existe. A criar: ${instance}`);
        const createRes = await fetchWithTimeout(`${API_URL}/instance/create`, {
          method: 'POST',
          headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ instanceName: instance, qrcode: true, integration: "WHATSAPP-BAILEYS" })
        });
        const createData = await createRes.json();
        qrcode = createData.qrcode || createData;
        statusData = { instance: { state: 'connecting' } };
      } 
      // Se existir mas estiver offline, pede o QR Code!
      else if (statusData?.instance?.state !== 'open') {
        console.log(`[CONECTAR] Instância offline. A pedir QR Code para: ${instance}`);
        const resQr = await fetchWithTimeout(`${API_URL}/instance/connect/${instance}`, {
          headers: { 'apikey': API_KEY }
        });
        qrcode = await resQr.json();
      }

      // Normaliza o Base64
      let base64 = null;
      if (qrcode?.base64) base64 = qrcode.base64;
      else if (qrcode?.qrcode?.base64) base64 = qrcode.qrcode.base64;
      else if (qrcode?.code) base64 = qrcode.code;

      return new Response(JSON.stringify({ ...statusData, qrcode: base64 ? { base64 } : null }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 
      })
    }

    return new Response(JSON.stringify({ error: "Ação não suportada." }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 
    })

  } catch (error) {
    console.error(`[ERRO FATAL CAPTURADO]: ${error.message}`);
    // Ao devolver 500 COM os cabeçalhos CORS, o navegador lê o erro perfeito em vez de "Failed to fetch"
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 
    })
  }
})