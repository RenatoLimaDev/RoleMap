// Rostos de avatar, tomate e mancha em SVG (sem emoji do sistema).

export function Rosto({ tipo, inicial }) {
  if (!tipo) return inicial;
  const traco = tipo === "raiva" ? "#fff" : "#14102a";
  return (
    <svg viewBox="0 0 40 40" className="w-9 h-9" fill="none" stroke={traco} strokeWidth="3" strokeLinecap="round" aria-hidden="true">
      {tipo === "feliz" ? (
        <>
          <circle cx="14" cy="16" r="1.8" fill={traco} stroke="none" />
          <circle cx="26" cy="16" r="1.8" fill={traco} stroke="none" />
          <path d="M11 24c3 7 15 7 18 0" />
        </>
      ) : (
        <>
          <path d="M8 9l9 5M32 9l-9 5" />
          <circle cx="14" cy="20" r="1.8" fill={traco} stroke="none" />
          <circle cx="26" cy="20" r="1.8" fill={traco} stroke="none" />
          <path d="M12 31c4-7 12-7 16 0" />
        </>
      )}
    </svg>
  );
}

export function Tomate({ className = "w-7 h-7" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="13.5" r="9" fill="#ef4444" />
      <path d="M7 10a6 6 0 0 1 4-3" stroke="#fecaca" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M12 5.5 9 3l1 3-3.5.5L9.5 8 8 11l4-2 4 2-1.5-3 3-1.5L14 6l1-3z" fill="#22c55e" />
    </svg>
  );
}

export function Mancha() {
  return (
    <svg viewBox="0 0 56 56" className="absolute -inset-1 h-[calc(100%+0.5rem)] w-[calc(100%+0.5rem)] pointer-events-none animate-pop" aria-hidden="true">
      <path d="M10 28C5 16 20 6 28 13c9-7 23 3 17 14 7 9-5 22-15 17-8 7-24 0-20-16z" fill="#dc2626" opacity=".85" />
      <circle cx="8" cy="46" r="3" fill="#dc2626" opacity=".8" />
      <circle cx="49" cy="8" r="2.5" fill="#dc2626" opacity=".8" />
      <circle cx="22" cy="24" r="1.6" fill="#fde68a" />
      <circle cx="33" cy="33" r="1.6" fill="#fde68a" />
      <circle cx="36" cy="20" r="1.3" fill="#fde68a" />
    </svg>
  );
}

// estouro do tomate: gotas em volta do avatar e um "SPLAT!" subindo
export function Impacto() {
  const gotas = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * 2 * Math.PI;
    return [Math.cos(a) * 36, Math.sin(a) * 36];
  });
  return (
    <span className="absolute inset-0 z-30 pointer-events-none">
      {gotas.map(([dx, dy], i) => (
        <span key={i} className="absolute left-1/2 top-1/2 -ml-1 -mt-1 h-2 w-2 rounded-full bg-red-500 animate-gota" style={{ "--dx": `${dx}px`, "--dy": `${dy}px` }} />
      ))}
      <span className="absolute inset-x-0 -top-3 text-center text-sm font-black text-red-400 [text-shadow:0_1px_0_#7f1d1d] animate-splat">SPLAT!</span>
    </span>
  );
}
