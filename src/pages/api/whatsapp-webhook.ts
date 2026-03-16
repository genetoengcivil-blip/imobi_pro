import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(200).send('OK');

  try {
    const { event, data } = req.body;
    console.log('Webhook recebido:', { event, data });
    
    if (event === 'messages.upsert' || event === 'messages.send' || event === 'send.message') {
      const msg = data;
      if (!msg?.key?.remoteJid) return res.status(200).send('OK');

      const phone = msg.key.remoteJid.split('@')[0];
      const isFromMe = msg.key.fromMe || false;
      const messageId = msg.key.id;
      
      const content = msg.message?.conversation || 
                    msg.message?.extendedTextMessage?.text || 
                    msg.content || "📎 Mídia";

      console.log('Processando mensagem:', { phone, messageId, content });

      // Buscar lead pelo telefone
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('id')
        .ilike('phone', `%${phone.slice(-8)}%`)
        .single();

      if (leadError) {
        console.error('Lead não encontrado:', phone);
        return res.status(200).send('OK');
      }

      if (lead) {
        console.log('Lead encontrado:', lead.id);
        
        // Salvar mensagem
        const { error: insertError } = await supabase
          .from('whatsapp_messages')
          .upsert({
            message_id: messageId,
            lead_id: lead.id,
            content: content,
            direction: isFromMe ? 'sent' : 'received',
            created_at: new Date().toISOString()
          }, { 
            onConflict: 'message_id',
            ignoreDuplicates: false 
          });

        if (insertError) {
          console.error('Erro ao salvar mensagem:', insertError);
        } else {
          console.log('Mensagem salva com sucesso');
        }
      }
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Erro no webhook:', error);
    return res.status(200).send('OK');
  }
}