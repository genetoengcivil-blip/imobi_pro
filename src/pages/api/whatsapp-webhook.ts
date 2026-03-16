import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Substitua pelas suas variáveis de ambiente reais
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use a Service Role para ignorar políticas de RLS no webhook
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const payload = req.body;
    
    // Filtramos apenas o evento de nova mensagem
    if (payload.event === 'messages.upsert') {
      const msg = payload.data;
      const remoteJid = msg.key?.remoteJid || '';
      const phone = remoteJid.split('@')[0];
      const isFromMe = msg.key?.fromMe || false;
      
      // Extração de texto (suporta texto simples e resposta estendida)
      let content = msg.message?.conversation || 
                    msg.message?.extendedTextMessage?.text || 
                    "📎 Arquivo de mídia";

      // 1. Encontrar o Lead pelo telefone no banco
      // Tentamos buscar pelos últimos 8 dígitos para evitar erros de 9º dígito
      const { data: lead } = await supabase
        .from('leads')
        .select('id')
        .ilike('phone', `%${phone.slice(-8)}%`)
        .single();

      if (lead) {
        // 2. Salvar na tabela whatsapp_messages
        await supabase.from('whatsapp_messages').insert({
          message_id: msg.key?.id,
          lead_id: lead.id,
          content: content,
          direction: isFromMe ? 'sent' : 'received',
          created_at: new Date().toISOString()
        });
      }
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Erro no Webhook:', error.message);
    return res.status(500).json({ error: error.message });
  }
}