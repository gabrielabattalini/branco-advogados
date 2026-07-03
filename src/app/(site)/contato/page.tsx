import type { Metadata } from "next";
import ContatoPage from "@/components/site/ContatoPage";
export const metadata: Metadata = { title: "Contato — Branco Advogados", description: "Fale com o Branco Advogados em Jundiaí/SP. Telefone, e-mail, endereço e formulário de contato." };
export default function Page() { return <ContatoPage />; }
