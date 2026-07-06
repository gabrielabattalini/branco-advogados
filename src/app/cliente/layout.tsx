// Layout isolado do portal do cliente — sem qualquer chrome do sistema interno.
export const dynamic = "force-dynamic";

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-cream">{children}</div>;
}
