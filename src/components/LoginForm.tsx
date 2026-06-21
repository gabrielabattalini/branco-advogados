"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { entrar } from "@/lib/auth-actions";

const inputCls =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-navy/60";
const labelCls = "mb-1 block text-[13px] text-muted";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (entrando) return;
    setEntrando(true);
    setErro("");
    try {
      const res = await entrar({ email, senha });
      if (res.ok) {
        router.push("/painel");
        router.refresh();
        return;
      }
      setErro(res.erro);
    } catch {
      setErro("Erro inesperado. Tente novamente.");
    }
    setEntrando(false);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div>
        <label htmlFor="login-email" className={labelCls}>
          E-mail
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          className={inputCls}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nome@brancoadvogados.com"
          autoFocus
        />
      </div>
      <div>
        <label htmlFor="login-senha" className={labelCls}>
          Senha
        </label>
        <input
          id="login-senha"
          type="password"
          autoComplete="current-password"
          className={inputCls}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="••••••••"
        />
      </div>
      {erro && <p className="text-[12px] text-danger">{erro}</p>}
      <button
        type="submit"
        disabled={entrando || !email || !senha}
        className="mt-1 rounded-md bg-navy px-4 py-2 text-sm text-cream hover:bg-navy-dark disabled:opacity-40"
      >
        {entrando ? "Entrando…" : "Entrar"}
      </button>
      <p className="mt-2 text-center text-[12px] text-muted">
        Não tem conta?{" "}
        <Link href="/cadastro" className="text-navy underline">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
