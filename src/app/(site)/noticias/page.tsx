import type { Metadata } from "next";
import NoticiasPage from "@/components/site/NoticiasPage";
export const metadata: Metadata = { title: "Notícias & Artigos — Branco Advogados", description: "Análises e orientações sobre o universo jurídico empresarial." };
export default function Page() { return <NoticiasPage />; }
