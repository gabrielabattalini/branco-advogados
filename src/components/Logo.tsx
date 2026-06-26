// Marca do escritório (wordmark): BRANCO sobre ADVOGADOS, serifada e
// monocromática, como na identidade. tone="claro" (texto creme, p/ fundo verde)
// ou tone="verde" (texto verde, p/ fundo claro).
export function Logo({
  size = 28,
  tone = "claro",
  className = "",
}: {
  size?: number;
  tone?: "claro" | "verde";
  className?: string;
}) {
  const cor = tone === "verde" ? "text-navy" : "text-cream";
  return (
    <div className={`select-none text-center font-serif ${cor} ${className}`}>
      <div
        className="font-semibold leading-none"
        style={{ fontSize: size, letterSpacing: "0.015em" }}
      >
        BRANCO
      </div>
      <div
        className="font-medium leading-none"
        style={{
          fontSize: size * 0.44,
          letterSpacing: "0.4em",
          marginTop: size * 0.16,
          paddingLeft: "0.4em",
        }}
      >
        ADVOGADOS
      </div>
    </div>
  );
}
