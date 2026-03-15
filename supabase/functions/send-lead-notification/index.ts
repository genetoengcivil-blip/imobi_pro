import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "https://esm.sh/resend"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
)

serve(async (req) => {
  try {
    const { record } = await req.json() // O Supabase envia o novo lead aqui

    // 1. Buscar o e-mail do corretor (dono do lead)
    const { data: broker } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', record.user_id)
      .single()

    if (!broker?.email) throw new Error("E-mail do corretor não encontrado")

    // 2. Enviar o e-mail de alerta
    await resend.emails.send({
      from: 'ImobiPro Alertas <alertas@imobi-pro.com>',
      to: [broker.email],
      subject: `🔥 Novo Lead: ${record.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 20px;">
          <h2 style="color: #0217ff; font-style: italic;">Você tem um novo interessado!</h2>
          <p>Um novo lead acabou de chegar através do seu site público.</p>
          
          <div style="background: white; padding: 20px; border-radius: 15px; border: 1px solid #eee;">
            <p><strong>Nome:</strong> ${record.name}</p>
            <p><strong>WhatsApp:</strong> ${record.phone || 'Não informado'}</p>
            <p><strong>E-mail:</strong> ${record.email || 'Não informado'}</p>
            <p><strong>Mensagem:</strong> <em>"${record.message || 'Sem mensagem'}"</em></p>
          </div>

          <div style="margin-top: 25px; text-align: center;">
            <a href="https://imobi-pro.com/app/leads" style="background: #0217ff; color: white; padding: 15px 25px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px;">
              ABRIR NO CRM
            </a>
          </div>
        </div>
      `
    })

    return new Response(JSON.stringify({ sent: true }), { status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})