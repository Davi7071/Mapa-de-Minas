// Gera src/data/municipios-mg.json cruzando três fontes públicas.
//
// Rode com `npm run dados`. O resultado é versionado no repositório, então a
// aplicação não faz nenhuma requisição de rede para carregar as cidades.
// Só é preciso rodar de novo quando sair um novo Censo/estimativa do IBGE ou
// quando a malha municipal mudar (criação/fusão de municípios).

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const UF_MG = 31;
const ANO_POPULACAO = 2022; // Censo 2022

// Municípios de MG: nome, código e hierarquia regional. Não traz coordenadas.
const URL_MUNICIPIOS = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${UF_MG}/municipios`;

// Agregado 4709 = "População residente..." (Censo 2022), variável 93.
// Uma requisição devolve todos os municípios do país.
// Atenção ao trocar de ano: anos não censitários usam o agregado 6579
// (estimativas, variável 9324), e o 6579 não tem dados em anos de Censo.
const URL_POPULACAO = `https://servicodados.ibge.gov.br/api/v3/agregados/4709/periodos/${ANO_POPULACAO}/variaveis/93?localidades=N6[all]`;

// Coordenadas da SEDE municipal, indexadas pelo código do IBGE.
// Usamos a sede, e não o centroide do polígono da malha do IBGE: o centroide
// chega a ficar 15 km fora da sede, o que muda quais cidades caem dentro de um
// raio de 50-70 km.
const URL_COORDENADAS =
  'https://raw.githubusercontent.com/kelvins/municipios-brasileiros/main/csv/municipios.csv';

async function buscarJson(url, descricao) {
  const resposta = await fetch(url);
  if (!resposta.ok) {
    throw new Error(`${descricao}: HTTP ${resposta.status} ${resposta.statusText}`);
  }
  return resposta.json();
}

async function buscarTexto(url, descricao) {
  const resposta = await fetch(url);
  if (!resposta.ok) {
    throw new Error(`${descricao}: HTTP ${resposta.status} ${resposta.statusText}`);
  }
  return resposta.text();
}

// O CSV não tem campos com vírgula nem aspas; um split simples basta, mas
// conferimos o cabeçalho para não quebrar em silêncio se o formato mudar.
function lerCoordenadas(csv) {
  const linhas = csv.trim().split('\n');
  const colunas = linhas[0].trim().split(',');
  const iCodigo = colunas.indexOf('codigo_ibge');
  const iLat = colunas.indexOf('latitude');
  const iLng = colunas.indexOf('longitude');

  if (iCodigo < 0 || iLat < 0 || iLng < 0) {
    throw new Error(`CSV de coordenadas com colunas inesperadas: ${colunas.join(', ')}`);
  }

  const porCodigo = new Map();
  for (const linha of linhas.slice(1)) {
    const campos = linha.split(',');
    porCodigo.set(campos[iCodigo], {
      lat: Number(campos[iLat]),
      lng: Number(campos[iLng]),
    });
  }
  return porCodigo;
}

function lerPopulacoes(agregado) {
  const series = agregado?.[0]?.resultados?.[0]?.series;
  if (!Array.isArray(series)) {
    throw new Error('Resposta de população do IBGE em formato inesperado');
  }
  return new Map(
    series.map((s) => [s.localidade.id, Number(s.serie[String(ANO_POPULACAO)])])
  );
}

async function main() {
  console.log('Buscando dados do IBGE...');

  const [municipios, agregadoPopulacao, csvCoordenadas] = await Promise.all([
    buscarJson(URL_MUNICIPIOS, 'Municípios do IBGE'),
    buscarJson(URL_POPULACAO, 'População do IBGE'),
    buscarTexto(URL_COORDENADAS, 'Coordenadas das sedes'),
  ]);

  const coordenadas = lerCoordenadas(csvCoordenadas);
  const populacoes = lerPopulacoes(agregadoPopulacao);

  const semCoordenada = [];
  const semPopulacao = [];

  const cidades = municipios.map((municipio) => {
    const codigo = String(municipio.id);
    const coordenada = coordenadas.get(codigo);
    const populacao = populacoes.get(codigo);

    if (!coordenada) semCoordenada.push(municipio.nome);
    if (!Number.isFinite(populacao)) semPopulacao.push(municipio.nome);

    return {
      codigo: municipio.id,
      nome: municipio.nome,
      lat: coordenada?.lat,
      lng: coordenada?.lng,
      populacao,
      microrregiao: municipio.microrregiao?.nome ?? '',
      mesorregiao: municipio.microrregiao?.mesorregiao?.nome ?? '',
    };
  });

  // Dado incompleto não entra no repositório: é melhor falhar aqui, uma vez,
  // do que descobrir buracos na aplicação depois.
  if (semCoordenada.length > 0 || semPopulacao.length > 0) {
    if (semCoordenada.length > 0) {
      console.error(`Sem coordenada (${semCoordenada.length}):`, semCoordenada.join(', '));
    }
    if (semPopulacao.length > 0) {
      console.error(`Sem população (${semPopulacao.length}):`, semPopulacao.join(', '));
    }
    throw new Error('Dados incompletos — arquivo não foi gerado');
  }

  cidades.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  const destino = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'municipios-mg.json');
  await writeFile(destino, `${JSON.stringify(cidades, null, 0)}\n`, 'utf8');

  const habitantes = cidades.reduce((total, c) => total + c.populacao, 0);
  console.log(`${cidades.length} municípios gravados em src/data/municipios-mg.json`);
  console.log(`População total (Censo ${ANO_POPULACAO}): ${habitantes.toLocaleString('pt-BR')}`);
}

main().catch((erro) => {
  console.error(`Falha ao gerar os dados: ${erro.message}`);
  process.exit(1);
});
