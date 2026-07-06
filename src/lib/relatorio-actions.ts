"use server";

import { getSessao } from "@/lib/sessao";
import { ehGestor } from "@/lib/papeis";
import { enviarRelatorioDiario, type ResultadoEnvio } from "@/lib/relatorio-envio";

// Envia o relatório do dia por e-mail na hora (botão "Enviar agora"). Gestor-only.
export async function enviarRelatorioAgora(
  dataISO: string,
): Promise<ResultadoEnvio> {
  const s = await getSessao();
  if (!s || !ehGestor(s.papel))
    return { ok: false, acoes: 0, erro: "sem permissão" };
  return enviarRelatorioDiario(dataISO);
}
