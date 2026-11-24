import { BrowserRouter, Route, Routes } from "react-router-dom";
import FundoPoly from "./FundoPoly";
import Home from "./pages/Home";
import TipoRole from "./pages/TipoRole";
import Sala from "./pages/Sala";
import Resultado from "./pages/Resultado";

export default function App() {
  return (
    <BrowserRouter>
      <FundoPoly />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/criar" element={<TipoRole />} />
        <Route path="/preferencias" element={<TipoRole convidado />} />
        <Route path="/sala" element={<Sala />} />
        <Route path="/resultado" element={<Resultado />} />
      </Routes>
    </BrowserRouter>
  );
}
