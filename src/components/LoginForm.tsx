"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { entrar, verificarCodigoLogin } from "@/lib/auth-actions";

const inputCls =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-navy/60";
const labelCls = "mb-1 block text-[13px] text-muted";

export function LoginForm() {
  const router = useRouter();
  const [fase, setFase] = useState<"senha" | "codigo">("senha");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const entrou = () => {
    router.push("/painel");
    router.refresh();
  };

  const submitSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ocupado) return;
    setOcupado(true);
    setErro("");
    try {
      const res = await entrar({ email, senha });
      if ("precisaCodigo" in res) {
        setFase("codigo");
        setCodigo("");
      } else if (res.ok) {
        entrou();
        return;
      } else {
        setErro(res.erro);
      }
    } catch {
      setErro("Erro inesperado. Tente novamente.");
    }
    setOcupado(false);
  };

  const submitCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ocupado) return;
    setOcupado(true);
    setErro("");
    try {
      const res = await verificarCodigoLogin({ email, codigo });
      if ("ok" in res && res.ok) {
        entrou();
        return;
      }
      setErro("erro" in res ? res.erro : "Código inválido.");
    } catch {
      setErro("Erro inesperado. Tente novamente.");
    }
    setOcupado(false);
  };

  if (fase === "codigo") {
    return (
      <form onSubmit={submitCodigo} className="flex flex-col gap-3">
        <p className="text-[13px] text-muted">
          Enviamos um código de 6 dígitos para <strong>{email}</strong>. Digite-o
          abaixo para confirmar este aparelho.
        </p>
        <div>
          <label htmlFor="login-codigo" className={labelCls}>
            Código
          </label>
          <input
            id="login-codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className={inputCls + " text-center text-lg tracking-[0.5em]"}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            autoFocus
          />
        </div>
        {erro && <p className="text-[12px] text-danger">{erro}</p>}
        <button
          type="submit"
          disabled={ocupado || codigo.length !== 6}
          className="mt-1 rounded-md bg-navy px-4 py-2 text-sm text-cream hover:bg-navy-dark disabled:opacity-40"
        >
          {ocupado ? "Confirmando…" : "Confirmar e entrar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setFase("senha");
            setErro("");
          }}
          className="text-center text-[12px] text-muted hover:text-navy"
        >
          ← Voltar
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={submitSenha} className="flex flex-col gap-3">
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
        disabled={ocupado || !email || !senha}
        className="mt-1 rounded-md bg-navy px-4 py-2 text-sm text-cream hover:bg-navy-dark disabled:opacity-40"
      >
        {ocupado ? "Entrando…" : "Entrar"}
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
