"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { entrarCliente } from "@/lib/cliente-actions";

export function ClienteLoginForm({ loginInicial }: { loginInicial?: string }) {
  const router = useRouter();
  const [login, setLogin] = useState(loginInicial ?? "");
  const [senha, setSenha] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (entrando) return;
    setEntrando(true);
    setErro("");
    const res = await entrarCliente({ login, senha });
    if (res.ok) {
      router.replace("/cliente");
      router.refresh();
      return;
    }
    setErro(res.erro);
    setEntrando(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="font-serif text-2xl font-semibold text-navy">
            BRANCO
          </div>
          <div className="text-[11px] tracking-[0.35em] text-gold">
            ADVOGADOS
          </div>
        </div>
        <form
          onSubmit={submit}
          className="rounded-xl border border-line bg-surface p-6 shadow-sm"
        >
          <h1 className="font-serif text-xl text-navy">Área do Cliente</h1>
          <p className="mt-1 mb-4 text-[13px] text-muted">
            Acompanhe o andamento dos seus processos.
          </p>
          <label className="mb-1 block text-[12px] text-muted">Acesso</label>
          <input
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            className="mb-3 w-full rounded-md border border-line bg-cream/40 px-3 py-2 text-sm text-ink outline-none focus:border-navy/60"
            placeholder="seu identificador de acesso"
          />
          <label className="mb-1 block text-[12px] text-muted">Senha</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full rounded-md border border-line bg-cream/40 px-3 py-2 text-sm text-ink outline-none focus:border-navy/60"
            placeholder="••••••••"
          />
          {erro && <p className="mt-3 text-[12px] text-danger">{erro}</p>}
          <button
            type="submit"
            disabled={entrando || !login || !senha}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-navy px-3 py-2.5 text-sm text-cream hover:bg-navy-dark disabled:opacity-40"
          >
            <Lock size={15} /> {entrando ? "Entrando…" : "Entrar"}
          </button>
          <p className="mt-4 text-center text-[11px] text-faint">
            Acesso fornecido pelo escritório. Em caso de dúvida, fale com o seu
            advogado.
          </p>
        </form>
      </div>
    </div>
  );
}
