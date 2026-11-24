import Icone from "../icons";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../context/UseContext";
import socket from "../services/sockets";
import cores from "../cores";

const VAGAS = 6; // shortcut: só visual, o servidor não limita jogadores

export default function Sala() {
  const { codigoSala, nomeRole, apelido, prefs, setResultado } = useUser();
  const host = useLocation().state?.host;
  const navigate = useNavigate();
  const [participantes, setParticipantes] = useState([]);
  const [copiado, setCopiado] = useState(false);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    if (!codigoSala) return;
    const comecar = (r) => {
      setResultado(r);
      setBuscando(true);
    };
    socket.on("atualizar_participantes", setParticipantes);
    socket.on("busca_iniciada", comecar);
    // o servidor ignora entradas repetidas do mesmo socket
    socket.emit("entrar_na_sala", { codigo: codigoSala, apelido, prefs });
    return () => {
      socket.off("atualizar_participantes", setParticipantes);
      socket.off("busca_iniciada", comecar);
    };
  }, [codigoSala, apelido, prefs, setResultado]);

  useEffect(() => {
    if (!buscando) return;
    const t = setTimeout(() => navigate("/resultado"), 3000);
    return () => clearTimeout(t);
  }, [buscando, navigate]);

  if (!codigoSala) return <Navigate to="/" replace />;

  const copiar = async () => {
    await navigator.clipboard.writeText(codigoSala);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  };

  const total = participantes.length;
  const pronta = total >= 2;
  const vagas = Math.max(VAGAS, total);

  return (
    <main className="min-h-screen flex justify-center p-4">
      <div className="w-full max-w-md lg:max-w-4xl min-h-[calc(100vh-2rem)] flex flex-col gap-5 py-4 text-center">
        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-amarelo font-bold">Lobby do rolê</p>
          <h1 className="text-5xl tracking-tight">{nomeRole || "Sala do rolê"}</h1>
        </header>

        <div className="grid gap-5 lg:grid-cols-2 flex-1">
          <section className="card items-center justify-center gap-3">
            <p className="text-sm text-fundo/60">Código da sala</p>
            <button
              onClick={copiar}
              className="rounded-2xl border-2 border-dashed border-lilas/50 px-6 py-4 text-5xl lg:text-6xl font-extrabold tracking-[0.2em] text-lilas cursor-pointer transition hover:border-lilas hover:scale-105 active:scale-95"
            >
              {codigoSala}
            </button>
            <p className="text-xs text-fundo/50">{copiado ? <span className="inline-flex items-center gap-1 text-lilas"><Icone nome="Check" className="w-4 h-4" /> Copiado!</span> : "Toque para copiar e chame a galera"}</p>

            <div className="w-full mt-2">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="inline-flex items-center gap-1 text-fundo/60">{pronta ? <><Icone nome="Chama" className="w-5 h-5" /> Sala pronta!</> : "Chame mais amigos…"}</span>
                <span className="text-lilas">{total}/{VAGAS}</span>
              </div>
              <div className="h-3 rounded-full bg-fundo/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-lilas transition-all duration-500"
                  style={{ width: `${Math.min(100, (total / VAGAS) * 100)}%` }}
                />
              </div>
            </div>
          </section>

          <section className="card">
            <p className="text-sm text-fundo/60">Jogadores</p>
            <ul className="grid grid-cols-3 gap-4 flex-1 content-evenly">
              {Array.from({ length: vagas }, (_, i) => {
                const p = participantes[i];
                if (!p) {
                  return (
                    <li key={i} className="flex flex-col items-center gap-1 opacity-50">
                      <span className="grid place-items-center w-20 h-20 rounded-full border-2 border-dashed border-fundo/30 text-fundo/50 text-2xl">?</span>
                      <span className="text-xs text-fundo/50">Vaga livre</span>
                    </li>
                  );
                }
                const nome = p.apelido || "Convidado";
                return (
                  <li key={p.id} className="relative flex flex-col items-center gap-1 animate-pop">
                    {i === 0 && <Icone nome="Coroa" className="absolute -top-7 w-10 h-10" />}
                    <span className={`grid place-items-center w-20 h-20 rounded-full ${cores[i % cores.length]} text-fundo text-3xl font-extrabold ${p.id === socket.id ? "ring-4 ring-fundo" : ""}`}>
                      {nome[0].toUpperCase()}
                    </span>
                    <span className="text-sm font-semibold max-w-full truncate">{nome}</span>
                    {p.id === socket.id && <span className="text-[10px] font-bold text-lilas -mt-1">VOCÊ</span>}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {host ? (
          <button
            className={`btn-amarelo text-lg tracking-wide ${buscando ? "" : "animate-brilho"}`}
            disabled={buscando}
            onClick={() => socket.emit("iniciar_busca", { codigo: codigoSala })}
          >
            {buscando ? "Buscando o rolê perfeito…" : <span className="inline-flex items-center justify-center gap-2"><Icone nome="Foguete" className="w-7 h-7 -my-1" /> INICIAR BUSCA</span>}
          </button>
        ) : (
          <p className="text-papel/60 text-sm animate-pulse">
            {buscando ? "Buscando o rolê perfeito…" : "Aguardando o anfitrião iniciar…"}
          </p>
        )}
      </div>
    </main>
  );
}
