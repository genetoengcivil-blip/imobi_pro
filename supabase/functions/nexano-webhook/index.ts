import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
)

serve(async (req) => {
  // 1. Validação de Segurança (Token)
  const authHeader = req.headers.get("X-Webhook-Token") || req.headers.get("Authorization");
  const validToken = Deno.env.get("NEXANO_WEBHOOK_TOKEN");

  if (!authHeader || authHeader !== validToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const payload = await req.json();
    
    // Mapeamento Adaptativo
    const email = payload.customer?.email || payload.email;
    const name = payload.customer?.name || payload.name;
    const document = payload.customer?.document || payload.cpf || payload.cnpj;
    const status = payload.status || payload.transaction_status;

    // Apenas processar se for aprovado
    if (status !== 'approved' && status !== 'paid') {
      return new Response(JSON.stringify({ message: "Aguardando aprovação" }), { status: 200 });
    }

    // 2. Idempotência (Evitar duplicados)
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    if (existingUser.users.some(u => u.email === email)) {
      return new Response(JSON.stringify({ message: "Usuário já existe" }), { status: 200 });
    }

    // 3. Criar Utilizador (Senha = CPF/CNPJ limpo)
    const cleanPassword = document.replace(/\D/g, '');

    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: cleanPassword,
      email_confirm: true,
      user_metadata: { 
        full_name: name,
        must_change_password: true // Exige troca no primeiro login
      }
    });

    if (authError) throw authError;

    return new Response(JSON.stringify({ success: true, user: newUser.user.id }), { status: 201 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
})