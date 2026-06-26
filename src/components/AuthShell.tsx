import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

export function AuthShell({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-sm">
        <Logo size={38} tone="verde" className="mb-7" />
        <div className="rounded-lg border border-line bg-surface p-6 shadow-sm">
          <h1 className="font-serif text-xl text-navy">{titulo}</h1>
          <p className="mt-1 mb-5 text-[13px] text-muted">{subtitulo}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
