import { describe, it, expect } from 'vitest';
import { calcularDistancia, cidadesDentroDoRaio, cidadesDentroDaArea } from './geo';
import MUNICIPIOS from '../data/municipios-mg.json';

const cidade = (codigo, nome, lat, lng) => ({ codigo, nome, lat, lng, populacao: 0 });

// Coordenadas reais, para os números baterem com a realidade.
const BELO_HORIZONTE = cidade(3106200, 'Belo Horizonte', -19.9102, -43.9266);
const CONTAGEM = cidade(3118601, 'Contagem', -19.9321, -44.0539);
const MONTES_CLAROS = cidade(3143302, 'Montes Claros', -16.7282, -43.8578);

describe('calcularDistancia', () => {
  it('retorna a distância em metros', () => {
    const metros = calcularDistancia(
      BELO_HORIZONTE.lat, BELO_HORIZONTE.lng,
      CONTAGEM.lat, CONTAGEM.lng
    );
    // BH -> Contagem em linha reta: ~13,5 km
    expect(metros / 1000).toBeGreaterThan(13);
    expect(metros / 1000).toBeLessThan(14);
  });

  it('é zero entre um ponto e ele mesmo', () => {
    expect(calcularDistancia(-19.9102, -43.9266, -19.9102, -43.9266)).toBe(0);
  });

  it('é simétrica', () => {
    const ida = calcularDistancia(-19.9102, -43.9266, -16.7282, -43.8578);
    const volta = calcularDistancia(-16.7282, -43.8578, -19.9102, -43.9266);
    expect(ida).toBeCloseTo(volta, 6);
  });

  it('acompanha a distância real entre cidades distantes', () => {
    const km = calcularDistancia(
      BELO_HORIZONTE.lat, BELO_HORIZONTE.lng,
      MONTES_CLAROS.lat, MONTES_CLAROS.lng
    ) / 1000;
    // BH -> Montes Claros em linha reta: ~354 km
    expect(km).toBeGreaterThan(340);
    expect(km).toBeLessThan(370);
  });
});

describe('cidadesDentroDoRaio', () => {
  const cidades = [BELO_HORIZONTE, CONTAGEM, MONTES_CLAROS];

  it('inclui quem está dentro e exclui quem está fora', () => {
    const proximas = cidadesDentroDoRaio(cidades, BELO_HORIZONTE, 50);
    expect(proximas.map((c) => c.nome)).toEqual(['Contagem']);
  });

  it('nunca inclui a própria cidade central', () => {
    const proximas = cidadesDentroDoRaio(cidades, BELO_HORIZONTE, 1000);
    expect(proximas.map((c) => c.nome)).not.toContain('Belo Horizonte');
  });

  it('exclui a cidade central pelo código, não pelo nome', () => {
    // Existem municípios homônimos entre estados; o código é o que identifica.
    const homonima = cidade(9999999, 'Belo Horizonte', -19.9102, -43.9266);
    const proximas = cidadesDentroDoRaio([BELO_HORIZONTE, homonima], BELO_HORIZONTE, 10);
    expect(proximas).toHaveLength(1);
    expect(proximas[0].codigo).toBe(9999999);
  });

  it('devolve lista vazia sem cidade selecionada', () => {
    expect(cidadesDentroDoRaio(cidades, null, 50)).toEqual([]);
  });

  it('respeita o raio maior das regionais', () => {
    // O raio das regionais (70 km) alcança mais cidades que o padrão (50 km).
    const em50 = cidadesDentroDoRaio(MUNICIPIOS, MONTES_CLAROS, 50);
    const em70 = cidadesDentroDoRaio(MUNICIPIOS, MONTES_CLAROS, 70);
    expect(em70.length).toBeGreaterThan(em50.length);
  });
});

describe('cidadesDentroDaArea', () => {
  const cidades = [BELO_HORIZONTE, CONTAGEM, MONTES_CLAROS];

  it('filtra pelo retângulo informado', () => {
    // Retângulo em volta da região metropolitana de BH.
    const bounds = [[-20.1, -44.2], [-19.8, -43.8]];
    expect(cidadesDentroDaArea(cidades, bounds).map((c) => c.nome))
      .toEqual(['Belo Horizonte', 'Contagem']);
  });

  it('inclui cidades exatamente na borda', () => {
    const bounds = [
      [BELO_HORIZONTE.lat, BELO_HORIZONTE.lng],
      [BELO_HORIZONTE.lat, BELO_HORIZONTE.lng],
    ];
    expect(cidadesDentroDaArea(cidades, bounds)).toHaveLength(1);
  });

  it('devolve lista vazia sem área selecionada', () => {
    expect(cidadesDentroDaArea(cidades, undefined)).toEqual([]);
  });
});

describe('dados dos municípios', () => {
  it('traz os 853 municípios de Minas Gerais', () => {
    expect(MUNICIPIOS).toHaveLength(853);
  });

  it('tem coordenada, população e código em todos', () => {
    for (const municipio of MUNICIPIOS) {
      expect(Number.isFinite(municipio.lat)).toBe(true);
      expect(Number.isFinite(municipio.lng)).toBe(true);
      expect(Number.isFinite(municipio.populacao)).toBe(true);
      expect(String(municipio.codigo)).toMatch(/^31\d{5}$/);
    }
  });

  it('mantém as coordenadas dentro dos limites de Minas Gerais', () => {
    for (const municipio of MUNICIPIOS) {
      expect(municipio.lat).toBeGreaterThan(-23);
      expect(municipio.lat).toBeLessThan(-14);
      expect(municipio.lng).toBeGreaterThan(-51);
      expect(municipio.lng).toBeLessThan(-39);
    }
  });

  it('não repete códigos', () => {
    const codigos = new Set(MUNICIPIOS.map((m) => m.codigo));
    expect(codigos.size).toBe(MUNICIPIOS.length);
  });
});
