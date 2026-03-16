import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(200).send('OK');
  try {
    const { event, data } = req.body;
    if (!data || !data.key) return res.status(200).send('OK');

    const remoteJid = data.key.remoteJid || '';
    const phone = remoteJid.split('@')[0];
    const messageId = data.key.id;
    const isFromMe = data.key.fromMe || false;
    const content = data.message?.conversation || data.message?.extendedTextMessage?.text || "📎 Mídia";

    const { data: lead } = await supabase.from('leads').select('id').ilike('phone', `%${phone.slice(-8)}%`).single();

    if (lead) {
      await supabase.from('whatsapp_messages').upsert({
        message_id: messageId,
        lead_id: lead.id,
        content: content,
        direction: isFromMe ? 'sent' : 'received',
        created_at: new Date().toISOString()
      }, { onConflict: 'message_id' });
    }
    return res.status(200).send('OK');
  } catch (e) { return res.status(200).send('OK'); }
}