// Helpers de audiência — módulo puro (client + server).

// Brasil não observa horário de verão desde 2019: BRT = UTC-3 constante.
export function instanteBRT(data: string, hora: string): Date {
  return new Date(`${data}T${(hora || "00:00").slice(0, 5)}:00-03:00`);
}

export function brData(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export const TIPOS_AUDIENCIA = [
  { key: "instrucao", label: "Instrução e julgamento" },
  { key: "conciliacao", label: "Conciliação" },
  { key: "inicial", label: "Audiência inicial" },
  { key: "una", label: "Audiência una" },
  { key: "outra", label: "Outra" },
];

export function labelTipoAudiencia(t: string): string {
  return TIPOS_AUDIENCIA.find((x) => x.key === t)?.label ?? "Audiência";
}

// Opções prontas de antecedência para os lembretes (valor em minutos).
export const PRESETS_LEMBRETE = [
  { min: 30, label: "30 minutos antes" },
  { min: 60, label: "1 hora antes" },
  { min: 120, label: "2 horas antes" },
  { min: 180, label: "3 horas antes" },
  { min: 1440, label: "1 dia antes" },
  { min: 2880, label: "2 dias antes" },
  { min: 10080, label: "1 semana antes" },
];

export function formatOffset(min: number): string {
  if (min >= 1440 && min % 1440 === 0) {
    const d = min / 1440;
    return d === 7 ? "1 semana antes" : `${d} dia${d > 1 ? "s" : ""} antes`;
  }
  if (min >= 60 && min % 60 === 0) {
    const h = min / 60;
    return `${h} hora${h > 1 ? "s" : ""} antes`;
  }
  return `${min} min antes`;
}

// Converte valor + unidade (vindo do formulário) em minutos.
export function paraMinutos(valor: number, unidade: "min" | "h" | "d"): number {
  if (unidade === "d") return valor * 1440;
  if (unidade === "h") return valor * 60;
  return valor;
}

// Só aceita http/https como link clicável (evita javascript:, etc.).
export function linkSeguro(url: string): string {
  const u = (url || "").trim();
  return /^https?:\/\//i.test(u) ? u : "";
}
