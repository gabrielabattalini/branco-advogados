import { labelTipoAudiencia, linkSeguro, brData } from "@/lib/audiencia";
import { escT } from "@/lib/telegram";

export type AudienciaAviso = {
  titulo: string;
  data: string;
  hora: string;
  tipo: string;
  modalidade: string;
  link: string;
  local: string;
  partes: string;
  processoNumero?: string;
};

export function modalidadeLabel(m: string): string {
  return m === "virtual" ? "Virtual" : "Presencial";
}

// Linhas de detalhe de uma audiência para a mensagem do Telegram (HTML).
// Traz tipo, modalidade (presencial/virtual), data/hora, link (se virtual),
// local (vara), partes e número do processo — o que não existir é omitido.
export function linhasAudienciaTelegram(a: AudienciaAviso): string[] {
  const linhas: string[] = [
    `📋 ${escT(labelTipoAudiencia(a.tipo))} · ${modalidadeLabel(a.modalidade)}`,
    `🗓 ${escT(brData(a.data))} às ${escT(a.hora)}`,
  ];
  if (a.modalidade === "virtual") {
    const l = linkSeguro(a.link);
    linhas.push(l ? `🔗 ${escT(l)}` : "🔗 (link ainda não informado)");
  }
  if (a.local) linhas.push(`📍 ${escT(a.local)}`);
  if (a.partes) linhas.push(`👥 ${escT(a.partes)}`);
  if (a.processoNumero) linhas.push(`📄 Processo ${escT(a.processoNumero)}`);
  return linhas;
}
