const named: Record<string, string> = {
  AB: "bg-info/15 text-info",
  GB: "bg-navy/10 text-navy",
  PL: "bg-trab-bg text-trab-text",
  CS: "bg-ok/15 text-ok",
};

const tones = [
  "bg-info/15 text-info",
  "bg-ok/15 text-ok",
  "bg-trab-bg text-trab-text",
  "bg-navy/10 text-navy",
  "bg-civ-bg text-civ-text",
];

function toneFor(ini: string) {
  let h = 0;
  for (let i = 0; i < ini.length; i++) h = (h * 31 + ini.charCodeAt(i)) >>> 0;
  return tones[h % tones.length];
}

export function Avatar({ ini, size = 22 }: { ini: string; size?: number }) {
  const cls = named[ini] ?? toneFor(ini);
  return (
    <span
      className={
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium " +
        cls
      }
      style={{ width: size, height: size, fontSize: Math.round(size * 0.45) }}
    >
      {ini}
    </span>
  );
}
