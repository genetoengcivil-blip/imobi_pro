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
    
    // Captura mensagens recebidas (upsert) e enviadas (send)
    if (event === 'messages.upsert' || event === 'messages.send' || event === 'send.message') {
      const msg = data;
      if (!msg?.key?.remoteJid) return res.status(200).send('OK');

      const phone = msg.key.remoteJid.split('@')[0];
      const isFromMe = msg.key.fromMe || false;
      const messageId = msg.key.id;
      
      const content = msg.message?.conversation || 
                    msg.message?.extendedTextMessage?.text || 
                    msg.content || "📎 Mídia";

      // 1. Localizar o Lead pelo telefone (últimos 8 dígitos para evitar erro de 9º dígito)
      const { data: lead } = await supabase
        .from('leads')
        .select('id')
        .ilike('phone', `%${phone.slice(-8)}%`)
        .single();

      if (lead) {
        // 2. UPSERT: Se o message_id já existir, ele não duplica a linha
        await supabase.from('whatsapp_messages').upsert({
          message_id: messageId,
          lead_id: lead.id,
          content: content,
          direction: isFromMe ? 'sent' : 'received',
          created_at: new Date().toISOString()
        }, { onConflict: 'message_id' });
      }
    }

    return res.status(200).send('OK');
  } catch (error) {
    return res.status(200).send('OK');
  }
}