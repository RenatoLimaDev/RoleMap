import bar from "./assets/icones/bar.png";
import balada from "./assets/icones/balada.png";
import drinks from "./assets/icones/drinks.png";
import pizza from "./assets/icones/pizza.png";
import sushi from "./assets/icones/sushi.png";
import burger from "./assets/icones/burger.png";
import cafe from "./assets/icones/cafe.png";
import cinema from "./assets/icones/cinema.png";
import distancia from "./assets/icones/distancia.png";
import preco from "./assets/icones/preco.png";
import nota from "./assets/icones/nota.png";
import carro from "./assets/icones/carro.png";
import agenda from "./assets/icones/agenda.png";
import sorteio from "./assets/icones/sorteio.png";
import partiu from "./assets/icones/partiu.png";
import naogostei from "./assets/icones/naogostei.png";
import trofeu from "./assets/icones/trofeu.png";
import coroa from "./assets/icones/coroa.png";
import foguete from "./assets/icones/foguete.png";
import chama from "./assets/icones/chama.png";
import chat from "./assets/icones/chat.png";
import enviar from "./assets/icones/enviar.png";
import check from "./assets/icones/check.png";

const imagens = { Bar: bar, Balada: balada, Drinks: drinks, Pizza: pizza, Sushi: sushi, Burger: burger, Café: cafe, Cinema: cinema, Distância: distancia, Preço: preco, Nota: nota, Carro: carro, Agenda: agenda, Sorteio: sorteio,
  Partiu: partiu, NaoGostei: naogostei, Trofeu: trofeu, Coroa: coroa, Foguete: foguete, Chama: chama, Chat: chat, Enviar: enviar, Check: check };

export default function Icone({ nome, className = "w-10 h-10" }) {
  return <img src={imagens[nome]} alt="" className={`object-contain ${className}`} />;
}
