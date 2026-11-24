import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useUser } from "../context/UseContext";
import socket from "../services/sockets";
import Icone from "../icons";
import cores from "../cores";
import { Impacto, Mancha, Rosto, Tomate } from "../arte";
import foto from "../assets/restaurante.jpg";

// posição (em % da mesa) do assento i
const assento = (i, total) => {
  const ang = -Math.PI / 2 + (i * 2 * Math.PI) / total;
  return [50 + 40 * Math.cos(ang), 50 + 40 * Math.sin(ang)];
};
const pct = (n) => `${Math.round(n * 100)}%`;
const p2 = (n) => String(n).padStart(2, "0");
const amanha20h = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T20:00`;
};
// formato do Google Calendar: horário local sem fuso
const fmtAgenda = (d) => `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}T${p2(d.getHours())}${p2(d.getMinutes())}00`;

export default function Resultado() {
  const { codigoSala, resultado, nomeRole } = useUser();
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState("");
  const fim = useRef(null);
  const ultimo = useRef(0);
  const [voando, setVoando] = useState([]); // tomates no ar
  const [atingidos, setAtingidos] = useState({}); // mancha temporária
  const [contagem, setContagem] = useState({}); // tomates levados por pessoa
  const [lancando, setLancando] = useState({}); // quem atirou (reinicia o pulinho)
  const [final, setFinal] = useState(false);
  const [quando, setQuando] = useState(amanha20h);

  useEffect(() => {
    const receber = (m) => setMensagens((l) => [...l, m]);
    socket.on("nova_mensagem", receber);
    return () => socket.off("nova_mensagem", receber);
  }, []);

  useEffect(() => {
    const amigos = resultado?.opcoes[0].amigos ?? [];
    const nomeDe = (id) => (id === socket.id ? "Você" : amigos.find((a) => a.id === id)?.nome ?? "Alguém");
    const receber = ({ de, alvo }) => {
      const id = Math.random();
      setVoando((l) => [...l, { id, de, alvo }]);
      setLancando((s) => ({ ...s, [de]: (s[de] ?? 0) + 1 }));
      setMensagens((l) => [...l, { sistema: true, texto: `${nomeDe(de)} atirou um tomate em ${nomeDe(alvo)}!` }]);
      setTimeout(() => {
        setVoando((l) => l.filter((t) => t.id !== id));
        setContagem((c) => ({ ...c, [alvo]: (c[alvo] ?? 0) + 1 }));
        setAtingidos((s) => ({ ...s, [alvo]: (s[alvo] ?? 0) + 1 }));
        setTimeout(() => setAtingidos((s) => ({ ...s, [alvo]: Math.max(0, (s[alvo] ?? 1) - 1) })), 3500);
      }, 800);
    };
    socket.on("tomate", receber);
    return () => socket.off("tomate", receber);
  }, [resultado]);

  useEffect(() => {
    const l = fim.current?.parentElement; // rola só a lista (scrollIntoView arrastava a página)
    l?.scrollTo({ top: l.scrollHeight, behavior: "smooth" });
  }, [mensagens]);

  const opcoes = resultado?.opcoes ?? [];
  const total = opcoes[0]?.amigos.length ?? 0;
  const ultima = opcoes.length - 1;

  // refaz a rodada a partir do chat (todos veem as mesmas mensagens, na mesma ordem):
  // o último voto de cada pessoa vale, e cada rejeição por maioria passa para a próxima opção
  // fase[i] = opção em votação quando a mensagem i chegou; cortes[i] = opção que começou depois dela
  const { rodada, voto, fase, cortes } = useMemo(() => {
    let r = 0;
    let v = {};
    const fase = [];
    const cortes = {};
    mensagens.forEach((m, i) => {
      fase[i] = r;
      if (!m.voto || m.rodada !== r) return;
      v[m.de] = m.voto;
      const contra = Object.values(v).filter((x) => x === "nao").length;
      if (contra * 2 >= total && r < ultima) {
        r += 1;
        v = {};
        cortes[i] = r;
      }
    });
    return { rodada: r, voto: v, fase, cortes };
  }, [mensagens, total, ultima]);

  const sim = Object.values(voto).filter((v) => v === "sim").length;
  const nao = Object.values(voto).filter((v) => v === "nao").length;
  const aprovado = sim * 2 > total;
  const rejeitado = nao * 2 >= total;

  // fecha o rolê quando todos votaram e a maioria é a favor (dá um tempo para ver o último voto chegar)
  const fechado = aprovado && sim + nao === total;
  useEffect(() => {
    if (!fechado) return;
    const t = setTimeout(() => setFinal(true), 1500);
    return () => clearTimeout(t);
  }, [fechado]);

  if (!codigoSala || !resultado) return <Navigate to="/" replace />;

  const melhor = opcoes[rodada];
  const anterior = rodada > 0 ? opcoes[rodada - 1] : null;
  const proximas = opcoes.slice(rodada + 1);
  const dist = melhor.distMedia == null ? null : `${melhor.distMedia.toFixed(1)} km`;
  const nome = encodeURIComponent(melhor.nome);
  const inicio = new Date(quando);
  const dataValida = !Number.isNaN(inicio.getTime());
  const linkUber = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff%5Bnickname%5D=${nome}&dropoff%5Bformatted_address%5D=${nome}`;
  const linkAgenda = dataValida
    ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Rolê: ${nomeRole || melhor.nome}`)}&location=${nome}&details=${encodeURIComponent(`Match do grupo: ${pct(melhor.grupo)}. Marcado pelo RolêMap.`)}&dates=${fmtAgenda(inicio)}/${fmtAgenda(new Date(inicio.getTime() + 3 * 3600e3))}`
    : "#";

  const enviar = (msg, voto) => socket.emit("enviar_mensagem", { codigo: codigoSala, texto: msg, voto, rodada });

  const atirar = (alvo) => {
    if (alvo === socket.id || Date.now() - ultimo.current < 600) return;
    ultimo.current = Date.now();
    socket.emit("tomate", { codigo: codigoSala, alvo });
  };

  const falar = (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
    enviar(texto);
    setTexto("");
  };


  return (
    <main className="min-h-screen flex justify-center p-4">
      {/* cortina escura da revelação: some quando o card pousa na mesa */}
      <div key={`cortina${rodada}`} className="fixed inset-0 z-10 bg-fundo/85 backdrop-blur-sm pointer-events-none animate-esmaecer" />

      {final && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-fundo/90 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border-[3px] border-fundo bg-papel text-fundo shadow-[3px_3px_0_0_var(--color-fundo)] animate-pop text-center">
            <div className="relative h-44">
              {/* shortcut: foto única de exemplo, trocar quando o lugar vier com imagem */}
              <img src={foto} alt={melhor.nome} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-papel to-transparent" />
              <span className="absolute left-1/2 top-4 -translate-x-1/2 inline-flex items-center gap-2 rounded-full border-[3px] border-fundo bg-amarelo px-4 py-1.5 text-sm font-extrabold text-fundo shadow-[2px_2px_0_0_var(--color-fundo)]">
                <Icone nome="Trofeu" className="h-6 w-6 -my-1" /> Rolê fechado!
              </span>
            </div>
            <div className="flex flex-col gap-4 p-5 -mt-8 relative">
              <div>
                <h2 className="text-2xl font-extrabold">{melhor.nome}</h2>
                <p className="mt-1 flex items-center justify-center gap-3 text-sm font-semibold text-lilas">
                  <span className="inline-flex items-center gap-1"><Icone nome={melhor.categoria} className="h-4 w-4" />{melhor.categoria}</span>
                  <span className="inline-flex items-center gap-1"><Icone nome="Nota" className="h-5 w-5" />{melhor.nota}</span>
                  <span className="inline-flex">{Array.from({ length: melhor.preco + 1 }, (_, k) => <Icone key={k} nome="Preço" className="h-5 w-5 -ml-1 first:ml-0" />)}</span>
                  {dist && <span className="inline-flex items-center gap-1"><Icone nome="Distância" className="h-5 w-5" />{dist} em média</span>}
                </p>
                <p className="mt-1 text-xs text-fundo/60">{sim} de {total} toparam · {pct(melhor.grupo)} de match{melhor.patrocinado && " · patrocinado"}</p>
              </div>

              <label className="flex flex-col gap-1 text-left text-xs font-semibold text-fundo/70">
                Quando vai ser?
                <input type="datetime-local" className="campo" value={quando} onChange={(e) => setQuando(e.target.value)} />
              </label>

              <div className="flex flex-col gap-3">
                <a href={linkUber} target="_blank" rel="noopener noreferrer" className="btn-amarelo shadow-[3px_3px_0_0_var(--color-fundo)]! inline-flex items-center justify-center gap-2">
                  <Icone nome="Carro" className="h-7 w-7 -my-1" /> Chamar Uber
                </a>
                <a
                  href={linkAgenda}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-disabled={!dataValida}
                  className={`btn-lilas shadow-[3px_3px_0_0_var(--color-fundo)]! inline-flex items-center justify-center gap-2 ${dataValida ? "" : "pointer-events-none opacity-50"}`}
                >
                  <Icone nome="Agenda" className="h-7 w-7 -my-1" /> Marcar na agenda
                </a>
              </div>
              <button onClick={() => setFinal(false)} className="text-sm font-semibold text-fundo/60 hover:text-fundo cursor-pointer">Voltar à mesa</button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md lg:max-w-5xl min-h-[calc(100vh-2rem)] flex flex-col gap-4 py-4 text-center animate-none">
        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-amarelo font-bold">Mesa da decisão · opção {rodada + 1} de {opcoes.length}</p>
          <h1 className="text-5xl tracking-tight">{["Achamos o rolê!", "Segunda opção!", "Última opção!"][rodada] ?? "Achamos o rolê!"}</h1>
          {anterior && <p className="mt-1 text-sm text-rose-300">A galera não curtiu {anterior.nome}. Que tal esse?</p>}
        </header>

        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6 flex-1">
          <div className="flex flex-col items-center gap-4">
            {/* mesa */}
            <div className="relative w-full max-w-[min(34rem,calc(100vh-19rem))] aspect-square">
              <div className="toalha absolute inset-[14%] rounded-full border-[6px] border-fundo shadow-[6px_6px_0_0_var(--color-fundo)]" />

              {melhor.amigos.map((a, i) => {
                const [x, y] = assento(i, total);
                const v = voto[a.id];
                const eu = a.id === socket.id;
                const raiva = v === "nao";
                const quantos = contagem[a.id] ?? 0;
                const atingido = (atingidos[a.id] ?? 0) > 0;
                return (
                  <div
                    key={a.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-pop"
                    style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${2.5 + i * 0.12}s` }}
                  >
                    <div key={`l${lancando[a.id] ?? 0}`} className={lancando[a.id] ? "animate-arremesso" : ""}>
                    <div key={`b${contagem[a.id] ?? 0}`} className={`relative ${contagem[a.id] ? "animate-bater" : ""}`}>
                      <button
                        onClick={() => atirar(a.id)}
                        disabled={eu}
                        aria-label={eu ? "Você" : `Atirar tomate em ${a.nome}`}
                        className={`grid place-items-center w-14 h-14 rounded-full border-[3px] border-fundo text-xl font-extrabold shadow-[3px_3px_0_0_var(--color-fundo)] transition ${
                          raiva ? "bg-tomate text-papel" : `${cores[i % cores.length]} text-fundo`
                        } ${eu ? "ring-4 ring-papel/70 cursor-default" : "cursor-crosshair hover:scale-110 active:scale-90"} ${raiva ? "animate-tremer" : ""}`}
                      >
                        <Rosto tipo={raiva ? "raiva" : v === "sim" ? "feliz" : null} inicial={a.nome[0].toUpperCase()} />
                      </button>
                      {atingido && <Mancha />}
                      {atingido && <Impacto key={quantos} />}
                      {quantos > 0 && (
                        <span key={quantos} className="absolute -bottom-1 -left-3 inline-flex items-center gap-0.5 rounded-full border-2 border-fundo bg-tomate px-1.5 text-[10px] font-extrabold text-papel animate-pop">
                          <Tomate className="w-3 h-3" />{quantos}
                        </span>
                      )}
                      {v && (
                        <span key={v} className={`absolute -top-3 -right-3 animate-pop `}>
                          <Icone nome={v === "sim" ? "Partiu" : "NaoGostei"} className="w-8 h-8" />
                        </span>
                      )}
                    </div>
                    </div>
                    <span className="mt-1 max-w-20 truncate rounded bg-fundo px-1.5 text-xs font-bold text-papel">{eu ? "Você" : a.nome}</span>
                    <span
                      title={a.km != null && a.km > a.max ? "Passa do que essa pessoa topa se deslocar" : undefined}
                      className={`mt-0.5 whitespace-nowrap rounded bg-fundo px-1.5 font-mono text-[10px] font-medium ${a.nota < 0.6 || (a.km != null && a.km > a.max) ? "text-tomate" : "text-amarelo"}`}
                    >
                      {pct(a.nota)}{a.km != null && ` · ${a.km.toFixed(1)}/${a.max}km`}
                    </span>
                  </div>
                );
              })}

              {/* tomates no ar: do assento de quem atirou até o alvo */}
              {voando.map((t) => {
                const [x0, y0] = assento(melhor.amigos.findIndex((a) => a.id === t.de), total);
                const [x1, y1] = assento(melhor.amigos.findIndex((a) => a.id === t.alvo), total);
                return (
                  <span
                    key={t.id}
                    className="absolute z-30 -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-voar-x"
                    style={{ "--x0": `${x0}%`, "--y0": `${y0}%`, "--x1": `${x1}%`, "--y1": `${y1}%` }}
                  >
                    <span className="block animate-voar-y">
                      <Tomate className="w-8 h-8 animate-[spin_0.35s_linear_infinite]" />
                    </span>
                  </span>
                );
              })}

              {/* card do local: chega enorme e encolhe até a mesa */}
              <article key={`card${rodada}`} className="pointer-events-none absolute left-1/2 top-1/2 z-20 w-[38%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border-[3px] border-fundo bg-papel text-fundo shadow-[5px_5px_0_0_var(--color-fundo)] animate-descer">
                {/* shortcut: foto única de exemplo, trocar quando o lugar vier com imagem */}
                <div className="relative h-20 sm:h-24">
                  <img src={foto} alt={melhor.nome} className="absolute inset-0 w-full h-full object-cover" />
                  <span className="absolute top-1.5 right-1.5 rounded border-2 border-fundo bg-amarelo px-1.5 py-0.5 font-mono text-[10px] font-medium text-fundo">{pct(melhor.grupo)}</span>
                  {melhor.patrocinado && <span className="absolute top-1.5 left-1.5 rounded border-2 border-fundo bg-papel px-1 py-0.5 text-[9px] font-extrabold uppercase text-fundo">Patrocinado</span>}
                </div>
                <div className="p-2 flex flex-col items-center gap-0.5">
                  <h2 className="text-sm sm:text-base leading-tight">{melhor.nome}</h2>
                  <p className="flex items-center gap-1.5 font-mono text-[10px] font-medium text-fundo">
                    <Icone nome={melhor.categoria} className="w-3 h-3" />
                    <span className="inline-flex items-center gap-0.5"><Icone nome="Nota" className="w-3.5 h-3.5" />{melhor.nota}</span>
                    <span className="inline-flex">{Array.from({ length: melhor.preco + 1 }, (_, k) => <Icone key={k} nome="Preço" className="h-3.5 w-3.5 -ml-1 first:ml-0" />)}</span>
                    {dist && <span className="inline-flex items-center gap-0.5"><Icone nome="Distância" className="w-3.5 h-3.5" />{dist}</span>}
                  </p>
                </div>
              </article>
            </div>

            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-papel/85"><Tomate className="w-4 h-4" /> Não gostou de alguém? Toque no avatar e atire um tomate</p>

            {/* placar da decisão */}
            <div className="w-full max-w-md flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span className="inline-flex items-center gap-1.5 text-amarelo"><Icone nome="Partiu" className="w-6 h-6" />{sim} toparam</span>
                <span className={aprovado ? "text-amarelo font-extrabold" : rejeitado ? "text-rose-400 font-extrabold" : "text-papel/50"}>
                  {aprovado ? "Rolê aprovado!" : rejeitado ? "Nenhuma opção agradou" : `${total - sim - nao} sem votar`}
                </span>
                <span className="inline-flex items-center gap-1.5 text-rose-400"><Icone nome="NaoGostei" className="w-6 h-6" />{nao}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button className="btn-vazado inline-flex items-center justify-center gap-2" onClick={() => enviar("Não gostei!", "nao")}>
                  <Icone nome="NaoGostei" className="w-7 h-7 -my-1" /> Não gostei
                </button>
                <button className="btn-amarelo inline-flex items-center justify-center gap-2" onClick={() => enviar("Partiu!", "sim")}>
                  <Icone nome="Partiu" className="w-7 h-7 -my-1" /> Partiu!
                </button>
              </div>
            </div>
          </div>

          <section className="card flex-1 min-h-0">
            <p className="text-sm text-fundo/60">Convença a galera</p>
            <div className="relative h-40 lg:h-auto lg:flex-1 lg:min-h-40">
            <ul className="absolute inset-0 overflow-y-auto overflow-x-hidden flex flex-col gap-2 text-left">
              {mensagens.length === 0 && (
                <li className="m-auto flex items-center gap-2 text-sm text-fundo/50"><Icone nome="Chat" className="w-6 h-6" /> Digam o que acharam</li>
              )}
              {mensagens.map((m, i) => {
                const minha = m.de === socket.id;
                const antiga = fase[i] < rodada; // mensagem da opção anterior
                return (
                  <Fragment key={i}>
                    {m.sistema ? (
                      <li className="shrink-0 self-center text-xs italic text-fundo/50">{m.texto}</li>
                    ) : (
                      <li className={`max-w-[80%] shrink-0 [overflow-wrap:anywhere] rounded-2xl px-3 py-2 text-sm ${minha ? "self-end bg-lilas text-papel" : "self-start bg-fundo/10"} ${antiga ? "opacity-50" : ""}`}>
                        {!minha && <p className="text-xs font-semibold text-lilas">{m.apelido || "Convidado"}</p>}
                        <span className="inline-flex items-center gap-1.5">
                          {m.voto === "sim" && <Icone nome="Partiu" className="w-5 h-5" />}
                          {m.voto === "nao" && <Icone nome="NaoGostei" className="w-5 h-5" />}
                          {m.texto}
                        </span>
                      </li>
                    )}
                    {cortes[i] !== undefined && (
                      <li className="my-1 flex shrink-0 items-center gap-2 text-xs font-bold text-lilas">
                        <span className="h-px flex-1 bg-lilas/30" />
                        Opção {cortes[i] + 1}: {opcoes[cortes[i]].nome}
                        <span className="h-px flex-1 bg-lilas/30" />
                      </li>
                    )}
                  </Fragment>
                );
              })}
              <li ref={fim} />
            </ul>
            </div>
            <form onSubmit={falar} className="flex gap-2">
              <input className="campo" placeholder="Diga algo…" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={300} />
              <button className="btn-lilas w-auto! px-5" aria-label="Enviar"><Icone nome="Enviar" className="w-7 h-7 -my-1" /></button>
            </form>
            {proximas.length > 0 && (
              <p className="text-xs text-fundo/50">Se rejeitarem, vem: {proximas.map((o) => `${o.nome}${o.patrocinado ? " [patrocinado]" : ""} (${pct(o.grupo)})`).join(" · ")}</p>
            )}
          </section>
        </div>

        <Link to="/" className="text-sm font-medium text-papel/90 underline underline-offset-4 hover:text-papel">Fazer nova busca</Link>
      </div>
    </main>
  );
}
