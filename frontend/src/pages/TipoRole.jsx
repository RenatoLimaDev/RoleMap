import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useUser } from "../context/UseContext";
import { api } from "../services/api";
import Icone from "../icons";

const categorias = ["Bar", "Balada", "Drinks", "Pizza", "Sushi", "Burger", "Café", "Cinema"];

const grupos = [
  { chave: "distancia", titulo: "Distância", opcoes: [[2, "2 km"], [5, "5 km"], [10, "10 km"], [20, "20 km"], [50, "50 km+"]] },
  { chave: "preco", titulo: "Preço", opcoes: [[0, "$"], [1, "$$"], [2, "$$$"], [3, "$$$$"]] },
  { chave: "nota", titulo: "Nota", opcoes: [0, 1, 2, 3, 4, 5].map((n) => [n]) },
];

// cinco blocos que vão acendendo da esquerda até a nota escolhida; tocar na última de novo zera
function Estrelas({ valor, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n === valor ? 0 : n)}
            aria-label={`${n} estrelas`}
            className={`grid cursor-pointer place-items-center rounded-2xl border py-2 transition ${
              n <= valor ? "border-fundo bg-lilas/20" : "border-fundo/15 bg-fundo/5 hover:bg-fundo/10"
            } ${n === valor ? "scale-105 shadow-[2px_2px_0_0_var(--color-fundo)]" : ""}`}
          >
            <Icone nome="Nota" className={`h-6 w-6 transition ${n <= valor ? "" : "opacity-25 grayscale"}`} />
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-fundo/60">
        {valor ? <><span className="font-bold text-lilas">{valor} {valor === 1 ? "estrela" : "estrelas"}</span> ou mais</> : "Qualquer nota"}
      </p>
    </div>
  );
}

const sortear = (lista) => lista[Math.floor(Math.random() * lista.length)];

// trilha com marcos: o preenchimento vai até o valor escolhido
function Distancia({ valor, opcoes, onChange }) {
  const i = Math.max(0, opcoes.findIndex(([v]) => v === valor));
  const ult = opcoes.length - 1;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-center leading-tight">
        <span className="text-3xl font-extrabold text-lilas">{opcoes[i][1]}</span>
        <span className="block text-xs text-fundo/60">é até onde eu topo ir</span>
      </p>
      <div className="relative mx-6 h-[3.25rem]">
        <div className="absolute inset-x-0 top-3.5 h-2 rounded-full bg-fundo/10" />
        <div className="absolute left-0 top-3.5 h-2 rounded-full bg-lilas transition-all duration-300" style={{ width: `${(i / ult) * 100}%` }} />
        {opcoes.map(([v, rotulo], k) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            aria-label={rotulo}
            className="absolute top-0 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-1"
            style={{ left: `${(k / ult) * 100}%` }}
          >
            <span
              className={`grid h-9 w-9 place-items-center rounded-full border-2 transition ${
                k <= i ? "border-fundo bg-lilas text-papel" : "border-fundo/20 bg-papel text-fundo/30"
              } ${k === i ? "scale-110 shadow-[2px_2px_0_0_var(--color-fundo)]" : "hover:border-fundo/40"}`}
            >
              {k === i ? <Icone nome="Distância" className="h-6 w-6" /> : <span className="h-2 w-2 rounded-full bg-current" />}
            </span>
            <span className={`whitespace-nowrap text-[11px] font-semibold ${k === i ? "text-lilas" : "text-fundo/50"}`}>{rotulo}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// moedas que vão se acendendo: quanto mais caro, mais moedas
const niveisPreco = ["Em conta", "Médio", "Caro", "Luxo"];
function Preco({ valor, onChange }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {niveisPreco.map((nome, n) => (
        <button
          key={nome}
          onClick={() => onChange(n)}
          className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border py-2.5 transition ${
            n === valor ? "scale-105 border-fundo bg-lilas/20 shadow-[2px_2px_0_0_var(--color-fundo)]" : "border-fundo/15 bg-fundo/5 hover:bg-fundo/10"
          }`}
        >
          <span className="flex">
            {[0, 1, 2, 3].map((k) => (
              <Icone key={k} nome="Preço" className={`-ml-1.5 h-5 w-5 first:ml-0 ${k <= n ? "" : "opacity-25 grayscale"}`} />
            ))}
          </span>
          <span className={`text-xs font-semibold ${n === valor ? "text-fundo" : "text-fundo/60"}`}>{nome}</span>
        </button>
      ))}
    </div>
  );
}

function Chip({ ativo, onClick, children, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold cursor-pointer transition border ${
        ativo
          ? "bg-amarelo text-fundo border-fundo shadow-[2px_2px_0_0_var(--color-fundo)]"
          : "bg-fundo/5 border-fundo/15 text-fundo/70 hover:bg-fundo/10"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export default function TipoRole({ convidado = false }) {
  const { nomeRole, setNomeRole, codigoSala, setCodigoSala, setPrefs } = useUser();
  const [cats, setCats] = useState([]);
  const [valores, setValores] = useState({ distancia: 10, preco: 1, nota: 4 });
  const [erro, setErro] = useState("");
  const [pos, setPos] = useState(null);
  const [localStatus, setLocalStatus] = useState("buscando"); // buscando | ok | negada
  const navigate = useNavigate();

  const alternar = (nome) =>
    setCats((c) => (c.includes(nome) ? c.filter((x) => x !== nome) : [...c, nome]));

  const pedirLocal = () => {
    setLocalStatus("buscando");
    if (!navigator.geolocation) return setLocalStatus("negada");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lon: p.coords.longitude });
        setLocalStatus("ok");
      },
      () => setLocalStatus("negada"),
      { timeout: 10000, maximumAge: 600000 },
    );
  };

  useEffect(pedirLocal, []);

  // formato que o servidor espera (ver normalizarPrefs no backend)
  const guardarPrefs = () =>
    setPrefs({ categorias: cats, distMaxKm: valores.distancia, precoMax: valores.preco, notaMin: valores.nota, pos });

  const surpreender = () => {
    setCats([sortear(categorias)]);
    setValores(Object.fromEntries(grupos.map((g) => [g.chave, sortear(g.opcoes)[0]])));
    if (!convidado) setNomeRole(sortear(["Noitada aleatória", "Rolê maluco", "Rolê misterioso", "Bora ver no que dá"]));
  };

  const criar = async () => {
    guardarPrefs();
    try {
      const { data } = await api.post("/criar-sala", { nome: nomeRole.trim() || "Rolê sem nome" });
      setCodigoSala(data.codigo);
      navigate("/sala", { state: { host: true } });
    } catch {
      setErro("Não consegui criar a sala. O servidor está no ar?");
    }
  };

  const entrar = () => {
    guardarPrefs();
    navigate("/sala");
  };

  if (convidado && !codigoSala) return <Navigate to="/" replace />;

  return (
    <main className="min-h-screen flex justify-center p-4">
      <div className="w-full max-w-lg min-h-[calc(100vh-2rem)] flex flex-col gap-3.5 py-2">
        <h1 className="text-5xl tracking-tight text-center">{convidado ? "O que você curte?" : "Que tipo de rolê?"}</h1>

        {convidado ? (
          <p className="text-center text-papel/60 -mt-3">O rolê sai do match de todo mundo. Sala {codigoSala}</p>
        ) : (
          <input className="campo text-lg" autoFocus placeholder="Nome do rolê (ex: Noitada com os cria)" value={nomeRole} onChange={(e) => setNomeRole(e.target.value)} />
        )}

        <p className={`flex items-center justify-center gap-2 text-xs font-semibold -mt-2 ${localStatus === "ok" ? "text-amarelo" : "text-papel/80"}`}>
          <Icone nome="Distância" className="w-4 h-4" />
          {localStatus === "ok" && "Sua localização entra no cálculo de distância"}
          {localStatus === "buscando" && "Pegando sua localização…"}
          {localStatus === "negada" && (
            <>
              Sem localização: a distância não conta para você.{" "}
              <button onClick={pedirLocal} className="underline text-amarelo cursor-pointer">Tentar de novo</button>
            </>
          )}
        </p>

        <div className="grid grid-cols-4 grid-rows-2 gap-3 flex-1">
          {categorias.map((nome) => (
            <button
              key={nome}
              onClick={() => alternar(nome)}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2 cursor-pointer transition border-[3px] border-fundo ${
                cats.includes(nome)
                  ? "bg-amarelo text-fundo shadow-[2px_2px_0_0_var(--color-fundo)] -translate-y-0.5"
                  : "bg-papel text-fundo shadow-[2px_2px_0_0_var(--color-fundo)] hover:-translate-y-0.5"
              }`}
            >
              <Icone nome={nome} className="w-10 h-10" />
              <span className="text-xs font-semibold">{nome}</span>
            </button>
          ))}
        </div>

        <section className="card flex-1 justify-evenly gap-3 p-5">
          {grupos.map((g) => (
            <div key={g.chave} className="flex flex-col gap-2">
              <p className="flex items-center gap-2 text-sm font-bold text-fundo/70"><Icone nome={g.titulo} className="w-5 h-5" />{g.titulo}</p>
              {g.chave === "nota" ? (
                <Estrelas valor={valores.nota} onChange={(n) => setValores({ ...valores, nota: n })} />
              ) : g.chave === "distancia" ? (
                <Distancia valor={valores.distancia} opcoes={g.opcoes} onChange={(v) => setValores({ ...valores, distancia: v })} />
              ) : g.chave === "preco" ? (
                <Preco valor={valores.preco} onChange={(v) => setValores({ ...valores, preco: v })} />
              ) : (
              <div className="flex flex-wrap gap-2">
                {g.opcoes.map(([valor, rotulo]) => (
                  <Chip key={valor} ativo={valores[g.chave] === valor} onClick={() => setValores({ ...valores, [g.chave]: valor })}>
                    {rotulo}
                  </Chip>
                ))}
              </div>
              )}
            </div>
          ))}
        </section>

        {erro && <p className="text-amarelo text-sm font-semibold text-center">{erro}</p>}
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-vazado" onClick={surpreender}><span className="inline-flex items-center justify-center gap-2"><Icone nome="Sorteio" className="w-5 h-5" />Surpreenda-me</span></button>
          <button className="btn-amarelo" onClick={convidado ? entrar : criar}>{convidado ? "Entrar na sala" : "Criar sala"}</button>
        </div>
      </div>
    </main>
  );
}
