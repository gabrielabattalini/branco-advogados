// Envio de e-mail via Resend (HTTP, sem SDK). Se RESEND_API_KEY não estiver
// configurada, o envio é ignorado (a estrutura fica pronta para ligar depois).

type EnvioResultado =
  | { enviado: true; id?: string }
  | { enviado: false; motivo: string };

export function emailConfigurado(): boolean {
  return !!process.env.RESEND_API_KEY;
}

const esc = (s: string) =>
  s.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!,
  );

// Código de verificação (2FA) no login de aparelho novo.
export async function enviarCodigoLogin(
  para: string,
  codigo: string,
  nome: string,
): Promise<EnvioResultado> {
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#2a2a28;max-width:480px">
  <h2 style="color:#056235;margin:0 0 8px">Seu código de acesso</h2>
  <p>Olá, ${esc(nome.split(/\s+/)[0] || "")}. Use o código abaixo para entrar no sistema:</p>
  <p style="font-size:30px;font-weight:700;letter-spacing:6px;color:#056235;margin:16px 0">${esc(codigo)}</p>
  <p style="color:#6e6a60;font-size:13px">Vale por 10 minutos. Se não foi você, ignore este e-mail e troque sua senha.</p>
  <p style="color:#9a9488;font-size:12px;margin-top:16px">Branco Advogados · sistema interno</p>
</div>`;
  return enviarEmail({
    para: [para],
    assunto: `Código de acesso: ${codigo}`,
    html,
    texto: `Seu código de acesso é ${codigo} (válido por 10 minutos).`,
  });
}

// Aviso de login em aparelho novo.
export async function enviarAvisoAparelho(
  para: string,
  nome: string,
  quando: string,
  navegador: string,
): Promise<EnvioResultado> {
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#2a2a28;max-width:480px">
  <h2 style="color:#056235;margin:0 0 8px">Novo acesso à sua conta</h2>
  <p>Olá, ${esc(nome.split(/\s+/)[0] || "")}. Houve um login em um aparelho novo:</p>
  <ul style="line-height:1.6">
    <li><strong>Quando:</strong> ${esc(quando)}</li>
    <li><strong>Navegador:</strong> ${esc(navegador || "desconhecido")}</li>
  </ul>
  <p style="color:#6e6a60;font-size:13px">Se foi você, tudo certo. Se não reconhece, troque sua senha imediatamente.</p>
  <p style="color:#9a9488;font-size:12px;margin-top:16px">Branco Advogados · sistema interno</p>
</div>`;
  return enviarEmail({
    para: [para],
    assunto: "Novo acesso à sua conta",
    html,
    texto: `Novo login em ${quando} (${navegador || "navegador desconhecido"}).`,
  });
}

export async function enviarEmail(msg: {
  para: string[];
  assunto: string;
  html: string;
  texto?: string;
  anexos?: { nome: string; conteudoBase64: string }[];
}): Promise<EnvioResultado> {
  const key = process.env.RESEND_API_KEY;
  const from =
    process.env.EMAIL_FROM ||
    "Branco Advogados <lembretes@brancoadvogados.com>";
  const destinatarios = msg.para.filter(Boolean);
  if (!key) return { enviado: false, motivo: "RESEND_API_KEY não configurada" };
  if (destinatarios.length === 0)
    return { enviado: false, motivo: "sem destinatários" };
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: destinatarios,
        subject: msg.assunto,
        html: msg.html,
        text: msg.texto,
        ...(msg.anexos && msg.anexos.length
          ? {
              attachments: msg.anexos.map((a) => ({
                filename: a.nome,
                content: a.conteudoBase64,
              })),
            }
          : {}),
      }),
    });
    if (!resp.ok) {
      const corpo = await resp.text().catch(() => "");
      return { enviado: false, motivo: `Resend ${resp.status}: ${corpo.slice(0, 200)}` };
    }
    const data = (await resp.json().catch(() => ({}))) as { id?: string };
    return { enviado: true, id: data.id };
  } catch (e) {
    return {
      enviado: false,
      motivo: e instanceof Error ? e.message : "falha no envio",
    };
  }
}
