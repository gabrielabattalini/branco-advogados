import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { getSessao } from "@/lib/sessao";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await getSessao();
  if (!s) redirect("/login");
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar nome={s.nome} papel={s.papel} iniciais={s.iniciais} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar nome={s.nome} papel={s.papel} />
        <main className="flex-1 overflow-y-auto px-8 py-7">{children}</main>
      </div>
    </div>
  );
}
