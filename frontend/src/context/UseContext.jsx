import { createContext, useContext, useState } from "react";

const Ctx = createContext();

export function UserProvider({ children }) {
  const [apelido, setApelido] = useState("");
  const [codigoSala, setCodigoSala] = useState("");
  const [nomeRole, setNomeRole] = useState("");
  const [prefs, setPrefs] = useState(null);
  const [resultado, setResultado] = useState(null);

  return (
    <Ctx.Provider value={{ apelido, setApelido, codigoSala, setCodigoSala, nomeRole, setNomeRole, prefs, setPrefs, resultado, setResultado }}>
      {children}
    </Ctx.Provider>
  );
}

export const useUser = () => useContext(Ctx);
