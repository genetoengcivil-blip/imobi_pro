import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  try {
    const payload = await req.json()

    // Verifica se o evento é de uma nova mensagem ("messages.upsert")
    if (payload.event === "messages.upsert") {
      const instanceId = payload.instance; // O ID do corretor (nome da instância)
      const messageData = payload.data.messages[0];

      // Ignora mensagens enviadas pelo próprio corretor (evita loop infinito)
      if (messageData.key.fromMe) {
        return new Response("Ignorado: Mensagem enviada pelo sistema", { status: 200 });
      }

      // Extrair telefone e texto da mensagem
      const remoteJid = messageData.key.remoteJid;
      const phoneNumber = remoteJid.split("@")[0]; // Ex: 5511999999999
      
      let text = "";
      if (messageData.message?.conversation) {
        text = messageData.message.conversation;
      } else if (messageData.message?.extendedTextMessage) {
        text = messageData.message.extendedTextMessage.text;
      }

      // Conectar ao Supabase (As chaves são injetadas automaticamente no ambiente Edge)
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!; 
      const supabase = createClient(supabaseUrl, supabaseKey);

      // 1. Procurar na tabela de "leads" a quem pertence este número
      // Utilizamos 'like' para flexibilidade de formatação do número
      const { data: leads } = await supabase
        .from('leads')
        .select('id')
        .eq('user_id', instanceId)
        .like('phone', `%${phoneNumber.substring(4)}%`) // Busca pelos últimos dígitos
        .limit(1);

      let leadId = null;
      if (leads && leads.length > 0) {
        leadId = leads[0].id;
      }

      // 2. Se encontrou o lead, guarda a mensagem na tabela
      if (leadId && text) {
        await supabase.from('whatsapp_messages').insert([{
          lead_id: leadId,
          content: text,
          direction: 'received',
          user_id: instanceId,
          // Guardamos o ID da mensagem para evitar duplicações no futuro
          message_id: messageData.key.id 
        }]);
      }
    }

    return new Response("Webhook processado com sucesso", { status: 200 })
  } catch (error) {
    console.error("Erro no processamento do webhook:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})