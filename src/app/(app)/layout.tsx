import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { getPapel } from "@/lib/sessao";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const papel = await getPapel();
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar papel={papel} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar papel={papel} />
        <main className="flex-1 overflow-y-auto px-8 py-7">{children}</main>
      </div>
    </div>
  );
}
