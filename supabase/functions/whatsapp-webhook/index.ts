import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  try {
    const payload = await req.json()

    if (payload.event === "messages.upsert") {
      const instanceId = payload.instance; 
      const messageData = payload.data.messages[0];

      if (messageData.key.fromMe) {
        return new Response("Ignorado: Enviado pelo sistema", { status: 200 });
      }

      // Limpeza segura do número (remove '@s.whatsapp.net' e deixa só números)
      const remoteJid = messageData.key.remoteJid;
      const phoneNumber = remoteJid.split("@")[0].replace(/\D/g, "");
      
      let text = "";
      if (messageData.message?.conversation) {
        text = messageData.message.conversation;
      } else if (messageData.message?.extendedTextMessage) {
        text = messageData.message.extendedTextMessage.text;
      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!; 
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Busca o lead usando os últimos 8 dígitos (Mais seguro contra formatos diferentes de DDD)
      const phoneTerm = phoneNumber.slice(-8);

      const { data: leads } = await supabase
        .from('leads')
        .select('id')
        .eq('user_id', instanceId)
        .like('phone', `%${phoneTerm}%`)
        .limit(1);

      if (leads && leads.length > 0 && text) {
        await supabase.from('whatsapp_messages').insert([{
          lead_id: leads[0].id,
          content: text,
          direction: 'received',
          user_id: instanceId,
          message_id: messageData.key.id 
        }]);
      }
    }

    return new Response("Webhook OK", { status: 200 })
  } catch (error) {
    console.error("Erro no Webhook:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})