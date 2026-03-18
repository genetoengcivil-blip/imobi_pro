import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  // 1. Resposta rápida para o navegador não bloquear
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("🔔 [INÍCIO] Pedido recebido na Edge Function");

  try {
    const API_KEY = Deno.env.get('EVOLUTION_API_KEY');
    const API_URL = Deno.env.get('EVOLUTION_API_URL')?.replace(/\/$/, '');
    
    const body = await req.json();
    const { instance, action } = body;
    console.log(`🔎 [DADOS] Instância: ${instance} | Ação: ${action}`);

    if (!API_URL || !API_KEY) {
      console.error("❌ [ERRO] Variáveis de ambiente faltando!");
      throw new Error("Configuração incompleta no Supabase.");
    }

    // Chamada à Evolution API
    console.log(`🌐 [FETCH] Chamando: ${API_URL}/instance/connectionState/${instance}`);
    const res = await fetch(`${API_URL}/instance/connectionState/${instance}`, {
      headers: { 'apikey': API_KEY }
    });
    
    const data = await res.json();
    console.log("✅ [RESPOSTA API]", JSON.stringify(data));

    // Se não existir, tenta criar
    if (res.status === 404 || data.status === 404) {
      console.log("🆕 [CRIAR] Instância inexistente. Criando...");
      await fetch(`${API_URL}/instance/create`, {
        method: 'POST',
        headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName: instance, qrcode: true, integration: "WHATSAPP-BAILEYS" })
      });
      return new Response(JSON.stringify({ status: 'creating', qrcode: null }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Se existir mas estiver offline, busca o QR
    if (data?.instance?.state !== 'open') {
      console.log("📷 [QRCODE] Buscando novo código...");
      const qrRes = await fetch(`${API_URL}/instance/connect/${instance}`, {
        headers: { 'apikey': API_KEY }
      });
      const qrData = await qrRes.json();
      return new Response(JSON.stringify({
        instance: data.instance,
        qrcode: qrData?.base64 || qrData?.qrcode?.base64 || qrData?.code || null
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(data), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error(`💥 [ERRO FATAL] ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 // Usamos 200 para o navegador não "matar" a conexão
    });
  }
})