export function EmBreve({ titulo }: { titulo: string }) {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-serif text-2xl text-navy">{titulo}</h1>
      <div className="mt-6 rounded-lg border border-dashed border-line bg-surface p-10 text-center">
        <p className="text-sm text-muted">
          Esta tela faz parte das próximas fases do projeto.
        </p>
        <p className="mt-1 text-[13px] text-faint">
          O protótipo já foi aprovado — em breve funcionando aqui.
        </p>
      </div>
    </div>
  );
}
