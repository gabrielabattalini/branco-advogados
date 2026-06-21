// Envio de e-mail via Resend (HTTP, sem SDK). Se RESEND_API_KEY não estiver
// configurada, o envio é ignorado (a estrutura fica pronta para ligar depois).

type EnvioResultado =
  | { enviado: true; id?: string }
  | { enviado: false; motivo: string };

export function emailConfigurado(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export async function enviarEmail(msg: {
  para: string[];
  assunto: string;
  html: string;
  texto?: string;
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
