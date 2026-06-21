"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { definirPapel } from "@/lib/actions";

// Seletor TEMPORÁRIO de perfil (enquanto não há login Microsoft).
export function RoleSwitcher({ papel }: { papel: string }) {
  const router = useRouter();
  const [trocando, setTrocando] = useState(false);

  const trocar = async (p: string) => {
    setTrocando(true);
    await definirPapel(p);
    router.refresh();
    setTrocando(false);
  };

  return (
    <div
      className={
        "flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-[12px] " +
        (trocando ? "opacity-60" : "")
      }
      title="Perfil simulado (será definido pelo login depois)"
    >
      <span className="text-faint">Perfil:</span>
      <select
        value={papel}
        onChange={(e) => trocar(e.target.value)}
        disabled={trocando}
        className="cursor-pointer bg-transparent font-medium text-navy outline-none"
        aria-label="Perfil"
      >
        <option value="coordenador">Coordenador</option>
        <option value="advogado">Advogado</option>
      </select>
    </div>
  );
}
