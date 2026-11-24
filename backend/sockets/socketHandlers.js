import { montarOpcoes, normalizarPrefs } from "../utils/match.js";
import LUGARES from "../utils/lugares.js";

const salas = {};
const ultimoTomate = new Map(); // socket.id -> instante do último tomate (limite de spam)
// o cliente não precisa receber as preferências dos outros
const publico = (lista) => lista.map(({ id, apelido }) => ({ id, apelido }));

export default (io, socket) => {
  socket.on("entrar_na_sala", ({codigo, apelido, prefs}) => {

    socket.join(codigo);
    console.log(`🟣 ${apelido || "Usuario"} (${socket.id}) entrou na sala ${codigo}`);
    if (!salas[codigo]){
      salas[codigo] = [];
    }

    if (!salas [codigo].some ((p) => p.id === socket.id)){
      salas[codigo].push({id: socket.id, apelido, prefs: normalizarPrefs(prefs)});
    }
    io.to(codigo).emit("atualizar_participantes", publico(salas[codigo]));
   });

  socket.on("enviar_mensagem", ({ codigo, texto, voto, rodada }) => {
    // só quem está na sala pode falar; o apelido vem do servidor, não do cliente
    const autor = salas[codigo]?.find((p) => p.id === socket.id);
    const limpo = typeof texto === "string" ? texto.trim().slice(0, 300) : "";
    if (!autor || !limpo) return;
    io.to(codigo).emit("nova_mensagem", {
      de: socket.id,
      apelido: autor.apelido,
      texto: limpo,
      voto: voto === "sim" || voto === "nao" ? voto : undefined,
      rodada: Number.isInteger(rodada) && rodada >= 0 && rodada <= 2 ? rodada : undefined,
    });
  });

  socket.on("tomate", ({ codigo, alvo }) => {
    const lista = salas[codigo];
    if (!lista?.some((p) => p.id === socket.id) || !lista.some((p) => p.id === alvo) || alvo === socket.id) return;
    const agora = Date.now();
    if (agora - (ultimoTomate.get(socket.id) ?? 0) < 500) return;
    ultimoTomate.set(socket.id, agora);
    io.to(codigo).emit("tomate", { de: socket.id, alvo });
  });

  // o primeiro a entrar na sala é o anfitrião
  socket.on("iniciar_busca", ({ codigo }) => {
    const lista = salas[codigo];
    if (lista?.[0]?.id !== socket.id) return;
    const nomes = lista.map((p) => p.apelido || "Convidado");
    const amigos = lista.map((p, i) => ({ nome: nomes[i], ...p.prefs }));
    // 3 opções (1 pode ser patrocinada): se o grupo rejeitar uma, entra a próxima (sem refazer a busca)
    const opcoes = montarOpcoes(amigos, LUGARES).map((r) => {
      const kms = r.notas.map((n) => n.d).filter((d) => d !== null);
      return {
        ...r.lugar,
        grupo: r.total,
        distMedia: kms.length ? kms.reduce((s, d) => s + d, 0) / kms.length : null,
        amigos: r.notas.map((n, i) => ({ id: lista[i].id, nome: nomes[i], nota: n.total, km: n.d, max: amigos[i].distMaxKm })),
      };
    });
    io.to(codigo).emit("busca_iniciada", { opcoes });
  });

    socket.on("disconnect", () => {
    console.log("❌ Usuário desconectado:", socket.id);
    ultimoTomate.delete(socket.id);

    for (const codigo in salas) {
      salas[codigo] = salas[codigo].filter (p => p.id !== socket.id);
      if (salas [codigo].length > 0){
        io.to(codigo).emit("atualizar_participantes", publico(salas[codigo]));
      }
    }
  });

};

