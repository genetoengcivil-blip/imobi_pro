import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const payload = req.body;
    
    // Captura mensagens novas e confirmações de envio
    if (payload.event === 'messages.upsert' || payload.event === 'messages.send') {
      const msg = payload.data;
      if (!msg) return res.status(200).send('OK');

      const phone = (msg.key?.remoteJid || '').split('@')[0];
      const isFromMe = msg.key?.fromMe || false;
      const content = msg.message?.conversation || 
                    msg.message?.extendedTextMessage?.text || 
                    "📎 Arquivo de mídia";

      const { data: lead } = await supabase
        .from('leads')
        .select('id')
        .ilike('phone', `%${phone.slice(-8)}%`)
        .single();

      if (lead) {
        // ✅ UPSERT: Evita duplicados comparando o message_id
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
  } catch (error: any) {
    return res.status(200).send('OK');
  }
}