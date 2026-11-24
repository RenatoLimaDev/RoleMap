import { useMemo } from "react";

// Fundo facetado (low poly) gerado em código: grade irregular de triângulos em tons do roxo-base.
// shortcut: o roxo vem da variável CSS --color-roxo, lida uma vez; trocar a cor no CSS troca o fundo.
const W = 1600;
const H = 900;
const COL = 16;
const LIN = 9;

const rng = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

function hexParaHsl(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  const d = mx - mn;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s * 100, l * 100];
}

export default function FundoPoly() {
  const triangulos = useMemo(() => {
    const base = getComputedStyle(document.documentElement).getPropertyValue("--color-roxo").trim() || "#403068";
    const [h, s, l] = hexParaHsl(base);
    const r = rng(7);
    const cw = W / COL;
    const ch = H / LIN;
    // pontos com jitter; as bordas ficam fora da tela para não aparecer vazio
    const pts = Array.from({ length: LIN + 1 }, (_, j) =>
      Array.from({ length: COL + 1 }, (_, i) => [i * cw + (r() - 0.5) * cw * 0.7, j * ch + (r() - 0.5) * ch * 0.7]),
    );
    const cor = (cx, cy) => {
      // luz vindo do canto superior esquerdo + ruído por faceta, sempre perto do roxo-base
      const luz = (1 - (cx / W + cy / H) / 2) * 0.05;
      const dl = luz - 0.025 + (r() - 0.5) * 0.04;
      return `hsl(${h + (r() - 0.5) * 6} ${s}% ${Math.min(l + dl * 100, l + 4.5)}%)`;
    };
    const out = [];
    for (let j = 0; j < LIN; j++) {
      for (let i = 0; i < COL; i++) {
        const a = pts[j][i], b = pts[j][i + 1], c = pts[j + 1][i], d = pts[j + 1][i + 1];
        const alt = (i + j) % 2 === 0; // alterna a diagonal para não formar padrão
        const tris = alt ? [[a, b, c], [b, d, c]] : [[a, b, d], [a, d, c]];
        for (const t of tris) out.push({ pts: t.map((p) => p.join(",")).join(" "), fill: cor((t[0][0] + t[1][0] + t[2][0]) / 3, (t[0][1] + t[1][1] + t[2][1]) / 3) });
      }
    }
    return out;
  }, []);

  return (
    <svg className="pointer-events-none fixed inset-0 -z-10 h-full w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {triangulos.map((t, k) => (
        <polygon key={k} points={t.pts} fill={t.fill} stroke={t.fill} strokeWidth="1" />
      ))}
    </svg>
  );
}
