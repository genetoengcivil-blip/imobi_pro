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
    
    if (event === 'messages.upsert' || event === 'messages.send') {
      const msg = data;
      const remoteJid = msg.key?.remoteJid || '';
      const phone = remoteJid.split('@')[0];
      const isFromMe = msg.key?.fromMe || false;
      const content = msg.message?.conversation || 
                      msg.message?.extendedTextMessage?.text || 
                      "📎 Mídia/Arquivo";

      // Busca o Lead
      const { data: lead } = await supabase
        .from('leads')
        .select('id')
        .ilike('phone', `%${phone.slice(-8)}%`)
        .single();

      if (lead) {
        // UPSERT evita a duplicação
        await supabase.from('whatsapp_messages').upsert({
          message_id: msg.key?.id,
          lead_id: lead.id,
          content: content,
          direction: isFromMe ? 'sent' : 'received',
          created_at: new Date().toISOString()
        }, { onConflict: 'message_id' });
      }
    }
    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(200).send('OK');
  }
}