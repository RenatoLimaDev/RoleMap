# RolêMap

Aplicativo para escolher o rolê em grupo. Cada pessoa diz do que gosta (categoria, distância, preço e nota), o servidor cruza as preferências de todo mundo e sugere o melhor lugar. O grupo vota em tempo real até fechar.

## Como funciona

1. Quem organiza informa o apelido, escolhe o tipo de rolê e cria a sala. Ela ganha um código.
2. Os amigos entram pelo código, escolhem suas preferências e aparecem na sala (até 6 vagas na tela).
3. O anfitrião inicia a busca. O servidor calcula o match do grupo e devolve 3 opções.
4. Todos votam em **Partiu!** ou **Não gostei**, conversam no chat e podem jogar tomates uns nos outros.
5. Se a maioria rejeita, entra a próxima opção. Quando todos votaram e a maioria topa, o rolê fecha, com atalhos para chamar um Uber e marcar na agenda.

## Tecnologias

* Frontend: React 19, Vite, Tailwind CSS 4, React Router, Socket.IO client, Axios
* Backend: Node.js, Express 5, Socket.IO

## Estrutura

```
backend/
├── server.js                 # Express + Socket.IO (porta 3001)
├── controllers/              # criação de sala
├── routes/                   # API REST (POST /api/criar-sala)
├── sockets/                  # eventos em tempo real: sala, chat, votos, tomates, busca
└── utils/
    ├── match.js              # cálculo do match do grupo
    ├── lugares.js            # lista fixa de lugares
    └── gerarCodigo.js        # código da sala

frontend/src/
├── pages/                    # Home, TipoRole, Sala, Resultado
├── context/                  # estado global (apelido, sala, preferências, resultado)
├── services/                 # cliente da API e do socket
├── assets/icones/            # ícones em estilo adesivo
├── icons.jsx                 # mapa nome -> ícone
├── arte.jsx, FundoPoly.jsx   # rostos, tomate e fundo
└── index.css                 # tema (cores, botões, cards)
```

## Rotas do frontend

| Rota            | Página   | Função                                              |
| --------------- | -------- | --------------------------------------------------- |
| `/`             | Home     | Apelido, criar rolê ou entrar com código            |
| `/criar`        | TipoRole | Anfitrião: nome do rolê e preferências              |
| `/preferencias` | TipoRole | Convidado: preferências para a sala do código       |
| `/sala`         | Sala     | Lobby com o código e os jogadores                   |
| `/resultado`    | Resultado| Mesa de decisão: votação, chat e fechamento do rolê |

## Como rodar localmente

Precisa do Node.js (ou Bun). O frontend espera o backend em `http://localhost:3001`.

```bash
git clone https://github.com/RenatoLimaDev/RoleMap.git
cd RoleMap

# backend
cd backend
npm install
npm run dev

# em outro terminal: frontend
cd frontend
npm install
npm run dev
```

## Limitações atuais

* Não há banco de dados nem login: as salas ficam na memória do servidor e somem quando ele reinicia.
* Os lugares vêm de uma lista fixa (`backend/utils/lugares.js`) e a foto do resultado é uma só, de exemplo.
* O servidor não limita o número de jogadores por sala. As 6 vagas são só visuais.
* O endereço do backend está fixo no código do frontend (`src/services`).
