"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Check, ExternalLink } from "lucide-react";
import {
  gerarLinkTelegram,
  desconectarTelegram,
} from "@/lib/telegram-actions";

export function TelegramCard({
  configurado,
  conectado,
}: {
  configurado: boolean;
  conectado: boolean;
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const conectar = async () => {
    setCarregando(true);
    setErro("");
    const res = await gerarLinkTelegram();
    if (res.ok) {
      setUrl(res.url);
      window.open(res.url, "_blank", "noopener");
    } else {
      setErro(res.erro);
    }
    setCarregando(false);
  };

  const desconectar = async () => {
    setCarregando(true);
    await desconectarTelegram();
    setUrl("");
    router.refresh();
    setCarregando(false);
  };

  return (
    <div className="mt-5 flex flex-col gap-3 rounded-lg border border-line bg-surface p-5">
      <div className="flex items-center gap-2">
        <Send size={16} className="text-[#2f6f8f]" />
        <h2 className="text-[15px] font-medium text-navy">
          Avisos no Telegram
        </h2>
        {conectado && (
          <span className="inline-flex items-center gap-1 rounded-full bg-ok/15 px-2 py-0.5 text-[11px] font-medium text-ok">
            <Check size={12} /> Conectado
          </span>
        )}
      </div>

      {!configurado ? (
        <p className="text-[12.5px] text-muted">
          As notificações por Telegram ainda não foram ativadas pelo
          administrador do sistema.
        </p>
      ) : conectado ? (
        <>
          <p className="text-[12.5px] text-muted">
            Você recebe avisos de novas tarefas, prazos chegando e audiências
            direto no Telegram. Para parar, é só desconectar aqui ou mandar{" "}
            <code className="rounded bg-cream px-1">/stop</code> ao bot.
          </p>
          <div>
            <button
              onClick={desconectar}
              disabled={carregando}
              className="rounded-md border border-line px-4 py-2 text-sm text-danger hover:bg-cream disabled:opacity-40"
            >
              {carregando ? "…" : "Desconectar"}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-[12.5px] text-muted">
            Conecte seu Telegram para receber avisos de tarefas, prazos e
            audiências no celular. Ao tocar no botão, o app do Telegram abre no
            bot do escritório — é só apertar <strong>Iniciar</strong>.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={conectar}
              disabled={carregando}
              className="inline-flex items-center gap-2 rounded-md bg-[#2f6f8f] px-4 py-2 text-sm text-white hover:bg-[#2a6280] disabled:opacity-40"
            >
              <Send size={15} /> {carregando ? "Gerando link…" : "Conectar Telegram"}
            </button>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[12.5px] text-[#2f6f8f] hover:underline"
              >
                Abrir o bot <ExternalLink size={13} />
              </a>
            )}
          </div>
          {url && (
            <p className="text-[11px] text-faint">
              Não abriu? Toque em “Abrir o bot” e depois em <strong>Iniciar</strong>.
              Volte aqui e recarregue para ver como “Conectado”.
            </p>
          )}
        </>
      )}
      {erro && <p className="text-[12px] text-danger">{erro}</p>}
    </div>
  );
}
