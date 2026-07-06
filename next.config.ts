import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mantém o Prisma como pacote externo do servidor (motor não é empacotado
  // pelo bundler, e o binário do engine vai junto na função serverless).
  serverExternalPackages: ["@prisma/client", "prisma", "@react-pdf/renderer"],
  // Anexos de documentos passam pela server action — libera arquivos maiores.
  experimental: {
    serverActions: { bodySizeLimit: "20mb" },
  },
};

export default nextConfig;
