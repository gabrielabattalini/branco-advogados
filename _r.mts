import { readFileSync, writeFileSync } from "fs";
import { pdf } from "pdf-to-img";
const src = "C:/Users/Usuario/Downloads/Publicações Cível - 23.06.2026 (4).pdf";
const doc = await pdf(readFileSync(src), { scale: 2 });
let i = 0;
for await (const page of doc) { i++; if (i <= 2) writeFileSync(`C:/Users/Usuario/AppData/Local/Temp/claude/D--Branco-Advogados/4d06af84-d4b7-4bca-bfe7-0076b8de8a23/scratchpad/real_p${i}.png`, page); if (i >= 2) break; }
console.log("pags renderizadas:", i);
