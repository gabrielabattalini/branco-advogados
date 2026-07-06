"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  entrar,
  verificarCodigoLogin,
  definirSenhaPrimeiroAcesso,
} from "@/lib/auth-actions";

const inputCls =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-navy/60";
const labelCls = "mb-1 block text-[13px] text-muted";

type Fase = "senha" | "codigo" | "definirSenha";

export function LoginForm() {
  const router = useRouter();
  const [fase, setFase] = useState<Fase>("senha");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [codigo, setCodigo] = useState("");
  const [primeiroAcesso, setPrimeiroAcesso] = useState(false);
  const [ticket, setTicket] = useState("");
  const [nova, setNova] = useState("");
  const [confirma, setConfirma] = useState("");
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
        setPrimeiroAcesso(!!res.primeiroAcesso);
        setCodigo("");
        setFase("codigo");
      } else if ("precisaDefinirSenha" in res) {
        setTicket(res.ticket);
        setFase("definirSenha");
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
      if ("precisaDefinirSenha" in res) {
        setTicket(res.ticket);
        setNova("");
        setConfirma("");
        setFase("definirSenha");
      } else if ("ok" in res && res.ok) {
        entrou();
        return;
      } else {
        setErro("erro" in res ? res.erro : "Código inválido.");
      }
    } catch {
      setErro("Erro inesperado. Tente novamente.");
    }
    setOcupado(false);
  };

  const submitDefinirSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ocupado) return;
    if (nova.length < 8) {
      setErro("A senha deve ter ao menos 8 caracteres.");
      return;
    }
    if (nova !== confirma) {
      setErro("As senhas não coincidem.");
      return;
    }
    setOcupado(true);
    setErro("");
    try {
      const res = await definirSenhaPrimeiroAcesso({ email, ticket, senha: nova });
      if ("ok" in res && res.ok) {
        entrou();
        return;
      }
      setErro("erro" in res ? res.erro : "Não foi possível definir a senha.");
    } catch {
      setErro("Erro inesperado. Tente novamente.");
    }
    setOcupado(false);
  };

  // --- Fase: definir senha (1º acesso) ---
  if (fase === "definirSenha") {
    return (
      <form onSubmit={submitDefinirSenha} className="flex flex-col gap-3">
        <p className="text-[13px] text-muted">
          E-mail confirmado. Agora crie a sua senha de acesso.
        </p>
        <div>
          <label htmlFor="nova-senha" className={labelCls}>Nova senha</label>
          <input
            id="nova-senha"
            type="password"
            autoComplete="new-password"
            className={inputCls}
            value={nova}
            onChange={(e) => setNova(e.target.value)}
            placeholder="Ao menos 8 caracteres"
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="confirma-senha" className={labelCls}>Confirmar senha</label>
          <input
            id="confirma-senha"
            type="password"
            autoComplete="new-password"
            className={inputCls}
            value={confirma}
            onChange={(e) => setConfirma(e.target.value)}
            placeholder="Repita a senha"
          />
        </div>
        {erro && <p className="text-[12px] text-danger">{erro}</p>}
        <button
          type="submit"
          disabled={ocupado || !nova || !confirma}
          className="mt-1 rounded-md bg-navy px-4 py-2 text-sm text-cream hover:bg-navy-dark disabled:opacity-40"
        >
          {ocupado ? "Salvando…" : "Criar senha e entrar"}
        </button>
      </form>
    );
  }

  // --- Fase: código por e-mail ---
  if (fase === "codigo") {
    return (
      <form onSubmit={submitCodigo} className="flex flex-col gap-3">
        <p className="text-[13px] text-muted">
          Enviamos um código de 6 dígitos para <strong>{email}</strong>.{" "}
          {primeiroAcesso
            ? "Digite-o abaixo para criar a sua senha."
            : "Digite-o abaixo para confirmar este aparelho."}
        </p>
        <div>
          <label htmlFor="login-codigo" className={labelCls}>Código</label>
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
          {ocupado ? "Confirmando…" : primeiroAcesso ? "Confirmar" : "Confirmar e entrar"}
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

  // --- Fase: e-mail + senha ---
  return (
    <form onSubmit={submitSenha} className="flex flex-col gap-3">
      <div>
        <label htmlFor="login-email" className={labelCls}>E-mail</label>
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
        <label htmlFor="login-senha" className={labelCls}>Senha</label>
        <input
          id="login-senha"
          type="password"
          autoComplete="current-password"
          className={inputCls}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="••••••••"
        />
        <p className="mt-1 text-[11px] text-faint">
          Primeiro acesso? Deixe a senha em branco — você vai criá-la após o código enviado por e-mail.
        </p>
      </div>
      {erro && <p className="text-[12px] text-danger">{erro}</p>}
      <button
        type="submit"
        disabled={ocupado || !email}
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
