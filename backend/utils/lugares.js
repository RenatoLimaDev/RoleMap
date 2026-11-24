// shortcut: catálogo de exemplo; trocar por busca real (Google Places) quando houver chave.
// lesteKm/norteKm = deslocamento em relação ao centro do grupo.
export default [
  { nome: "Pizzaria do Centro", categoria: "Pizza", preco: 1, nota: 4.4, lesteKm: 1, norteKm: 1 },
  { nome: "Pizza Bar Trio", categoria: "Pizza", preco: 2, nota: 4.2, lesteKm: -1, norteKm: 0 },
  { nome: "Sushi Premium", categoria: "Sushi", preco: 3, nota: 4.8, lesteKm: -3, norteKm: -4 },
  { nome: "Sakura Roll", categoria: "Sushi", preco: 2, nota: 4.3, lesteKm: 2, norteKm: -3 },
  { nome: "Boteco da Esquina", categoria: "Bar", preco: 1, nota: 4.1, lesteKm: 3, norteKm: 2 },
  { nome: "Cervejaria Alquimia", categoria: "Bar", preco: 2, nota: 4.6, lesteKm: -5, norteKm: 3 },
  { nome: "Burger Lab", categoria: "Burger", preco: 2, nota: 4.3, lesteKm: 0, norteKm: -5 },
  { nome: "Balada Neon", categoria: "Balada", preco: 3, nota: 4.0, lesteKm: 6, norteKm: 4 },
  { nome: "Club Eclipse", categoria: "Balada", preco: 2, nota: 4.4, lesteKm: -8, norteKm: -6 },
  { nome: "Café Aurora", categoria: "Café", preco: 0, nota: 4.6, lesteKm: -2, norteKm: -2 },
  { nome: "Coquetelaria Martini", categoria: "Drinks", preco: 3, nota: 4.7, lesteKm: 4, norteKm: -1 },
  // patrocinados: pagaram para ser sugeridos, mas só entram se combinarem com a região do grupo (ver montarOpcoes)
  { nome: "Forno & Brasa", categoria: "Pizza", preco: 2, nota: 4.3, lesteKm: 2, norteKm: -1, patrocinado: true },
  { nome: "Sushi Kōen", categoria: "Sushi", preco: 2, nota: 4.5, lesteKm: -2, norteKm: 2, patrocinado: true },
  { nome: "Cine Arte", categoria: "Cinema", preco: 1, nota: 4.5, lesteKm: -4, norteKm: 5 },
];
