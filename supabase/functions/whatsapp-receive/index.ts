import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

serve(async (req) => {
  try {
    const body = await req.json()
    
    // Conecta ao Supabase com privilégios de admin para salvar a mensagem
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // O evento 'messages.upsert' é disparado quando uma mensagem chega ou é enviada
    if (body.event === 'messages.upsert') {
      const msgData = body.data;
      
      // IMPORTANTE: Só processamos se fromMe for false (mensagem vinda do CLIENTE)
      if (!msgData.key.fromMe) {
        // Extrai o número do WhatsApp (ex: 5511999999999@s.whatsapp.net -> 5511999999999)
        const rawPhone = msgData.key.remoteJid.split('@')[0];
        
        // Remove o prefixo do país para bater com o formato que costuma salvar no banco (opcional)
        const cleanPhone = rawPhone.replace(/^55/, '');

        // Pega o conteúdo de texto da mensagem
        const content = msgData.message?.conversation || 
                        msgData.message?.extendedTextMessage?.text || 
                        "Mensagem de mídia/arquivo";

        // 1. Localiza o Lead no seu banco pelo telefone (usando busca flexível)
        const { data: lead } = await supabase
          .from('leads')
          .select('id')
          .or(`phone.ilike.%${cleanPhone}%,phone.ilike.%${rawPhone}%`)
          .single();

        if (lead) {
          // 2. Insere a mensagem na tabela para o chat atualizar em tempo real
          await supabase
            .from('messages')
            .insert([{
              leadId: lead.id,
              content: content,
              direction: 'received',
              status: 'unread',
              created_at: new Date().toISOString()
            }]);
            
          console.log(`Mensagem de ${rawPhone} salva para o lead ${lead.id}`);
        }
      }
    }

    return new Response(JSON.stringify({ status: "success" }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    })

  } catch (error) {
    console.error("Erro no Webhook:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})