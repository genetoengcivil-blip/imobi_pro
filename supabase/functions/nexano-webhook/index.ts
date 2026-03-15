import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SERVICE_ROLE_KEY') ?? ''
  )

  // Configurações da Evolution API (Seu Servidor Oracle)
  const EVOLUTION_API_URL = "https://api.imobi-pro.com/message/sendText/imobi_principal";
  const EVOLUTION_API_KEY = "IMOBIPRO_SECRET_KEY_2026";

  try {
    const body = await req.json()
    const receivedToken = body.token;
    const clientData = body.client;

    if (!clientData || !clientData.email) {
      return new Response(JSON.stringify({ error: "Dados do cliente ausentes" }), { status: 400 });
    }

    const email = clientData.email;
    const name = clientData.name;
    const cpfRaw = clientData.cpf || clientData.cnpj || "";
    const cpfClean = cpfRaw.replace(/\D/g, '');
    const phone = clientData.phone || "";
    const planoRecebido = body.offerCode || "Plano Pro"; // Identificador do plano da Nexano

    // 1. MAPEAMENTO DE TOKENS
    const tokens = {
      aprovado: Deno.env.get('WEBHOOK_TOKEN_SECRET') ?? 'wpjcmm61',
      estorno: Deno.env.get('TOKEN_ESTORNO'),
      recusado: Deno.env.get('TOKEN_RECUSADO'),
      contestacao: Deno.env.get('TOKEN_CONTESTACAO')
    };

    // --- CENÁRIO A: PAGAMENTO APROVADO / REATIVAÇÃO / MUDANÇA DE PLANO ---
    if (receivedToken === tokens.aprovado) {
      console.log(`[ATIVAÇÃO/MUDANÇA] Processando: ${email}`);

      // Verificar se usuário já existe no Auth
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      let user = users.find(u => u.email === email);

      let isNewUser = false;
      if (!user) {
        isNewUser = true;
        const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: cpfClean,
          email_confirm: true,
          user_metadata: { full_name: name, must_change_password: true }
        });
        if (authError) throw authError;
        user = newUser.user;
      }

      const slug = email.split('@')[0].toLowerCase() + Math.floor(1000 + Math.random() * 9000);
      
      // Upsert: Reativa a conta, atualiza plano e limpa bloqueios
      await supabaseAdmin.from('perfil').upsert({
        id: user.id,
        email: email,
        slug_site: slug,
        nome_exibicao: name,
        cpf: cpfClean,
        status: 'ativo',
        plano: planoRecebido,
        motivo_bloqueio: null
      }, { onConflict: 'email' });

      // Mensagem personalizada: Boas-vindas (Novo) ou Plano Atualizado (Antigo)
      let msgWpp = "";
      if (isNewUser) {
        msgWpp = `🚀 *Bem-vindo ao Imobi-PRO!* \n\nOlá ${name}, seu acesso já está liberado!\n\n🔗 *Acesse aqui:* https://imobi-pro.vercel.app\n📧 *Login:* ${email}\n🔑 *Senha inicial:* Seu CPF (apenas números)\n\n_Por segurança, crie sua senha definitiva ao entrar._`;
      } else {
        msgWpp = `✅ *Conta Atualizada!* \n\nOlá ${name}, seu plano no Imobi-PRO foi atualizado/reativado com sucesso!\n\nPlano: *${planoRecebido}*\nStatus: *Ativo*\n\nJá pode retomar de onde parou: https://imobi-pro.vercel.app`;
      }

      await enviarWhatsApp(phone, msgWpp, EVOLUTION_API_URL, EVOLUTION_API_KEY);
      return new Response(JSON.stringify({ success: true, action: 'activated' }), { status: 200 });
    }

    // --- CENÁRIO B: BLOQUEIOS ---
    const isBlockEvent = [tokens.estorno, tokens.recusado, tokens.contestacao].includes(receivedToken);

    if (isBlockEvent) {
      let motivo = "Pagamento Pendente";
      let msgBloqueio = "";

      if (receivedToken === tokens.estorno) {
        motivo = "Estorno Realizado";
        msgBloqueio = `⚠️ *Aviso Imobi-PRO*\n\nOlá ${name}, identificamos que o seu pagamento foi *estornado*. Por esse motivo, o seu acesso ao sistema foi suspenso.`;
      } else if (receivedToken === tokens.recusado) {
        motivo = "Pagamento Recusado";
        msgBloqueio = `❌ *Falha no Pagamento*\n\nOlá ${name}, o seu pagamento no Imobi-PRO não foi aprovado. Seu acesso ficará suspenso até a regularização.`;
      } else if (receivedToken === tokens.contestacao) {
        motivo = "Chargeback/Contestação";
        msgBloqueio = `🚫 *Acesso Suspenso*\n\nIdentificamos uma contestação de pagamento (Chargeback). Seu acesso foi bloqueado preventivamente.`;
      }

      await supabaseAdmin.from('perfil').update({ 
        status: 'bloqueado',
        motivo_bloqueio: motivo 
      }).eq('email', email);

      if (phone) await enviarWhatsApp(phone, msgBloqueio, EVOLUTION_API_URL, EVOLUTION_API_KEY);
      return new Response(JSON.stringify({ success: true, action: 'blocked', reason: motivo }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "Token não reconhecido" }), { status: 401 });

  } catch (error) {
    console.error("Erro no Webhook:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// --- FUNÇÃO DE ENVIO (O QUE ESTAVA FALTANDO) ---
async function enviarWhatsApp(phone: string, message: string, url: string, apiKey: string) {
  try {
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone) return;
    
    const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "apikey": apiKey 
      },
      body: JSON.stringify({
        number: formattedPhone,
        options: { delay: 1200, presence: "composing" },
        textMessage: { text: message }
      })
    });
    
    console.log(`WhatsApp enviado para ${formattedPhone}. Status: ${response.status}`);
  } catch (e) {
    console.error("Erro API Evolution:", e.message);
  }
}