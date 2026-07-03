import type { Metadata } from "next";
import SiteLanding from "@/components/site/SiteLanding";

export const metadata: Metadata = {
  title: "Branco Advogados — Advocacia em Jundiaí/SP desde 1980",
  description:
    "Advocacia séria, ética e bem estruturada desde 1980, em Jundiaí-SP. Atuação em Direito Civil, Trabalhista, Imobiliário, do Consumidor, Contratos e Apoio Jurídico Preventivo.",
};

export default function Home() {
  return <SiteLanding />;
}
