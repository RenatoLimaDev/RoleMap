// Match do grupo: nota de 0 a 1 de cada lugar para cada amigo, combinada para o grupo.
// shortcut: pesos fixos, calibrar com uso real.

export const PESOS = { categoria: 0.4, preco: 0.2, nota: 0.2, distancia: 0.2 };
const JUSTICA = 0.3; // quanto o descontente pesa: grupo = 0.7*média + 0.3*pior nota

const CENTRO_PADRAO = { lat: -23.55, lon: -46.63 }; // usado só se ninguém compartilhar localização

export function distanciaKm(a, b) {
  const rad = (g) => (g * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

// Ponto de encontro: centro das posições, ponderado pela disposição de cada um.
// Quem topa se deslocar pouco (distMaxKm baixo) pesa mais e puxa o ponto para perto de si.
export function pontoDeEncontro(amigos) {
  const com = amigos.filter((a) => a.pos);
  if (!com.length) return CENTRO_PADRAO;
  const pesos = com.map((a) => 1 / a.distMaxKm);
  const soma = pesos.reduce((s, w) => s + w, 0);
  return {
    lat: com.reduce((s, a, i) => s + a.pos.lat * pesos[i], 0) / soma,
    lon: com.reduce((s, a, i) => s + a.pos.lon * pesos[i], 0) / soma,
  };
}

// shortcut: os lugares do catálogo têm só um deslocamento (km) em relação ao ponto de encontro;
// trocar por coordenadas reais quando houver busca de lugares (Google Places) em volta desse ponto.
export function posicionarLugares(lugares, amigos) {
  const centro = pontoDeEncontro(amigos);
  return lugares.map((l) => ({
    ...l,
    pos: { lat: centro.lat + l.norteKm / 111.32, lon: centro.lon + l.lesteKm / (111.32 * Math.cos((centro.lat * Math.PI) / 180)) },
  }));
}

export const CATEGORIAS = ["Bar", "Balada", "Drinks", "Pizza", "Sushi", "Burger", "Café", "Cinema"];

const validarPos = (p) =>
  p && Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180 && Number.isFinite(p.lat) && Number.isFinite(p.lon) ? { lat: Number(p.lat), lon: Number(p.lon) } : null;

// Dado vindo do cliente: nunca confiar, sempre limitar.
export function normalizarPrefs(p = {}) {
  const num = (v, min, max, padrao) => (Number.isFinite(Number(v)) ? Math.min(max, Math.max(min, Number(v))) : padrao);
  return {
    categorias: Array.isArray(p.categorias) ? p.categorias.filter((c) => CATEGORIAS.includes(c)) : [],
    distMaxKm: num(p.distMaxKm, 1, 50, 10),
    precoMax: Math.round(num(p.precoMax, 0, 3, 1)),
    notaMin: num(p.notaMin, 0, 5, 4),
    pos: validarPos(p.pos),
  };
}

// 1 se atende; cai de forma linear conforme passa do limite, até 0
const folga = (ok, excesso, tolerancia) => (ok ? 1 : Math.max(0, 1 - excesso / tolerancia));

export function notaAmigo(amigo, lugar) {
  // sem localização não dá para medir: nota neutra (0.5) em vez de punir ou premiar
  const d = amigo.pos ? distanciaKm(amigo.pos, lugar.pos) : null;
  const partes = {
    categoria: amigo.categorias.length === 0 || amigo.categorias.includes(lugar.categoria) ? 1 : 0,
    preco: folga(lugar.preco <= amigo.precoMax, lugar.preco - amigo.precoMax, 2),
    nota: folga(lugar.nota >= amigo.notaMin, amigo.notaMin - lugar.nota, 2),
    // dentro do que o amigo topa: quanto mais perto, melhor (1 colado, 0.6 no limite).
    // passou do limite: despenca, e zera a 1.5x o limite.
    distancia: d === null ? 0.5 : d <= amigo.distMaxKm ? 1 - 0.4 * (d / amigo.distMaxKm) : Math.max(0, 0.6 * (1 - (d - amigo.distMaxKm) / (0.5 * amigo.distMaxKm))),
  };
  const total = Object.keys(PESOS).reduce((s, k) => s + PESOS[k] * partes[k], 0);
  return { total, partes, d };
}

export function ranquear(amigos, lugares) {
  return lugares
    .map((lugar) => {
      const notas = amigos.map((a) => notaAmigo(a, lugar));
      const totais = notas.map((n) => n.total);
      const media = totais.reduce((s, n) => s + n, 0) / totais.length;
      const pior = Math.min(...totais);
      return { lugar, notas, media, pior, total: (1 - JUSTICA) * media + JUSTICA * pior };
    })
    .sort((a, b) => b.total - a.total);
}

// Opções para o grupo votar: a melhor orgânica; depois, se houver, UMA patrocinada que combine com a região
// (match >= 55% e ninguém além do limite de deslocamento que escolheu); depois as próximas orgânicas.
// A patrocinada nunca ocupa a 1ª posição e sempre vem marcada (`patrocinado: true`) para a tela avisar.
export function montarOpcoes(amigos, lugares, n = 3) {
  const todos = ranquear(amigos, posicionarLugares(lugares, amigos));
  const organicos = todos.filter((r) => !r.lugar.patrocinado);
  const patrocinada = todos.find(
    (r) => r.lugar.patrocinado && r.total >= 0.55 && r.notas.every((x, i) => x.d === null || x.d <= amigos[i].distMaxKm),
  );
  const lista = organicos.slice(0, 1);
  if (patrocinada) lista.push(patrocinada);
  for (const r of organicos.slice(1)) if (lista.length < n) lista.push(r);
  return lista;
}
