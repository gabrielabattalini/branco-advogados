import type { Metadata } from "next";
import VideosPage from "@/components/site/VideosPage";
export const metadata: Metadata = { title: "Vídeos — Branco Advogados", description: "Minuto Branco Legal e entrevistas sobre o universo jurídico empresarial." };
export default function Page() { return <VideosPage />; }
