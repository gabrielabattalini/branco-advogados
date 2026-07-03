import type { Metadata } from "next";
import { Mulish, Spectral } from "next/font/google";
import SiteLanding from "@/components/site/SiteLanding";

const mulish = Mulish({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-mulish",
});
const spectral = Spectral({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-spectral",
});

export const metadata: Metadata = {
  title: "Branco Advogados — Advocacia em Jundiaí/SP desde 1980",
  description:
    "Advocacia séria, ética e bem estruturada desde 1980, em Jundiaí-SP. Atuação em Direito Civil, Trabalhista, Imobiliário, do Consumidor, Contratos e Apoio Jurídico Preventivo.",
};

export default function Home() {
  return (
    <div className={`${mulish.variable} ${spectral.variable}`}>
      <SiteLanding />
    </div>
  );
}
