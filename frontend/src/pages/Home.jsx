import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UseContext";
import logo from "../assets/LOGO.svg";

export default function Home() {
  const { apelido, setApelido, setCodigoSala } = useUser();
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  const seguir = (fn) => {
    if (!apelido.trim()) return setErro("Diga como te chamar");
    fn();
  };

  const entrar = () =>
    seguir(() => {
      if (!codigo.trim()) return setErro("Digite o código da sala");
      setCodigoSala(codigo.trim().toUpperCase());
      navigate("/preferencias");
    });

  return (
    <main className="min-h-screen flex justify-center p-4">
      <div className="relative z-10 w-full max-w-md min-h-[calc(100vh-2rem)] flex flex-col justify-center gap-5 text-center">
        <header className="flex flex-col items-center gap-2">
                    <div className="flex items-center justify-center gap-3">
            <img src={logo} alt="" className="h-24" />
            <h1 className="text-8xl tracking-tight">Rolê<span className="text-amarelo">Map</span></h1>
          </div>
          <p className="text-papel/85 text-lg leading-snug">Encontre o melhor lugar para sair com os amigos</p>
        </header>

        <section className="card gap-5 p-8">
          <input
            className="campo"
            placeholder="Seu apelido"
            value={apelido}
            onChange={(e) => { setApelido(e.target.value); setErro(""); }}
          />
          <button className="btn-amarelo" onClick={() => seguir(() => navigate("/criar"))}>
            Criar rolê
          </button>

          <p className="text-xs uppercase tracking-widest text-fundo/50">ou entre num rolê existente</p>

          <input
            className="campo text-center tracking-widest uppercase"
            placeholder="CÓDIGO"
            value={codigo}
            onChange={(e) => { setCodigo(e.target.value); setErro(""); }}
          />
          <button className="btn-lilas" onClick={entrar}>Entrar com código</button>
          {erro && <p className="text-tomate text-sm font-semibold">{erro}</p>}
        </section>
      </div>
    </main>
  );
}
