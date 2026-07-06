import type { Metadata } from "next";
import PrivacidadePage from "@/components/site/PrivacidadePage";

export const metadata: Metadata = {
  title: "Política de Privacidade — Branco Advogados",
  description:
    "Como o Branco Advogados trata seus dados pessoais, em conformidade com a LGPD (Lei nº 13.709/2018).",
};

export default function Page() {
  return <PrivacidadePage />;
}
