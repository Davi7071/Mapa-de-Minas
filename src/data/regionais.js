// Raio usado quando o usuário clica numa cidade avulsa, que não tem raio
// próprio. Cada regional define o seu em `raioKm`.
export const RAIO_PADRAO_KM = 50;

export const REGIONAIS = [
  {
    nome: "Juiz de Fora",
    cidadeBase: "Juiz de Fora",
    coordenadas: { lat: -21.7605, lng: -43.3434 },
    raioKm: 70
  },
  {
    nome: "Montes Claros",
    cidadeBase: "Montes Claros",
    coordenadas: { lat: -16.7282, lng: -43.8578 },
    raioKm: 70
  },
  {
    nome: "Poços de Caldas",
    cidadeBase: "Poços de Caldas",
    coordenadas: { lat: -21.7857, lng: -46.5646 },
    raioKm: 70
  },
  {
    nome: "Uberaba",
    cidadeBase: "Uberaba",
    coordenadas: { lat: -19.7472, lng: -47.9381 },
    raioKm: 70
  },
  {
    nome: "Uberlândia",
    cidadeBase: "Uberlândia",
    coordenadas: { lat: -18.9141, lng: -48.2749 },
    raioKm: 70
  },
  {
    nome: "Divinópolis",
    cidadeBase: "Divinópolis",
    coordenadas: { lat: -20.1458, lng: -44.8919 },
    raioKm: 70
  },
  {
    nome: "Governador Valadares",
    cidadeBase: "Governador Valadares",
    coordenadas: { lat: -18.8545, lng: -41.9555 },
    raioKm: 70
  }
];
