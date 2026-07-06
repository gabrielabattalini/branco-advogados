import { Mulish, Spectral } from "next/font/google";
import "@/components/site/site.css";
import { CookieBanner } from "@/components/site/CookieBanner";
import { WhatsAppBtn } from "@/components/site/WhatsAppBtn";

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

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${mulish.variable} ${spectral.variable}`}>
      {children}
      <WhatsAppBtn />
      <CookieBanner />
    </div>
  );
}
