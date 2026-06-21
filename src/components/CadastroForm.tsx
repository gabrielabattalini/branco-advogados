"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cadastrar } from "@/lib/auth-actions";

const inputCls =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-navy/60";
const labelCls = "mb-1 block text-[13px] text-muted";

export function CadastroForm() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [area, setArea] = useState("civel");
  const [erro, setErro] = useState("");
  const [criando, setCriando] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (criando) return;
    setCriando(true);
    setErro("");
    try {
      const res = await cadastrar({ nome, email, senha, area });
      if (res.ok) {
        router.push("/painel");
        router.refresh();
        return;
      }
      setErro(res.erro);
    } catch {
      setErro("Erro inesperado. Tente novamente.");
    }
    setCriando(false);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div>
        <label htmlFor="cad-nome" className={labelCls}>
          Nome completo
        </label>
        <input
          id="cad-nome"
          className={inputCls}
          value={nome}
          maxLength={120}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Maria Santos"
          autoFocus
        />
      </div>
      <div>
        <label htmlFor="cad-email" className={labelCls}>
          E-mail do escritório
        </label>
        <input
          id="cad-email"
          type="email"
          autoComplete="email"
          className={inputCls}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nome@brancoadvogados.com"
        />
      </div>
      <div>
        <label htmlFor="cad-senha" className={labelCls}>
          Senha (mín. 6 caracteres)
        </label>
        <input
          id="cad-senha"
          type="password"
          autoComplete="new-password"
          className={inputCls}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="••••••••"
        />
      </div>
      <div>
        <label htmlFor="cad-area" className={labelCls}>
          Área de atuação
        </label>
        <select
          id="cad-area"
          className={inputCls}
          value={area}
          onChange={(e) => setArea(e.target.value)}
        >
          <option value="civel">Cível</option>
          <option value="trabalhista">Trabalhista</option>
        </select>
      </div>
      <p className="text-[11px] text-faint">
        O cadastro é restrito a e-mails @brancoadvogados.com. Você entra como
        Advogado; o coordenador pode ajustar seu acesso depois.
      </p>
      {erro && <p className="text-[12px] text-danger">{erro}</p>}
      <button
        type="submit"
        disabled={criando || !nome || !email || !senha}
        className="mt-1 rounded-md bg-navy px-4 py-2 text-sm text-cream hover:bg-navy-dark disabled:opacity-40"
      >
        {criando ? "Criando conta…" : "Criar conta"}
      </button>
      <p className="mt-2 text-center text-[12px] text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="text-navy underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
