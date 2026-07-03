import type { Metadata } from "next";
import LivrosPage from "@/components/site/LivrosPage";
export const metadata: Metadata = { title: "Livros publicados — Branco Advogados", description: "Obras e artigos jurídicos de autoria do escritório, incluindo o Manual de Introdução ao Direito." };
export default function Page() { return <LivrosPage />; }
