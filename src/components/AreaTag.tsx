import { Area } from "@/lib/mock";

export function AreaTag({ area }: { area: Area }) {
  if (area === "trabalhista") {
    return (
      <span className="whitespace-nowrap rounded bg-trab-bg px-2 py-0.5 text-[11px] text-trab-text">
        Trabalhista
      </span>
    );
  }
  return (
    <span className="whitespace-nowrap rounded bg-civ-bg px-2 py-0.5 text-[11px] text-civ-text">
      Cível
    </span>
  );
}
