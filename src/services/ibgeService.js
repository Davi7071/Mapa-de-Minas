// Função para converter coordenadas da API do IBGE para formato Leaflet
const converterCoordenadas = (latitude, longitude) => {
  // A API do IBGE pode retornar coordenadas em formato string
  // Vamos garantir que sejam números e no formato correto
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  
  // Verificar se as coordenadas são válidas
  if (isNaN(lat) || isNaN(lng)) {
    console.warn('Coordenadas inválidas:', { latitude, longitude });
    return null;
  }
  
  // Verificar se estão dentro dos limites de Minas Gerais
  if (lat < -23 || lat > -14 || lng < -51 || lng > -39) {
    console.warn('Coordenadas fora dos limites de Minas Gerais:', { lat, lng });
    return null;
  }
  
  return { lat, lng };
};

// Serviço para buscar dados das cidades de Minas Gerais
// Esta função não está sendo usada atualmente, mas pode ser útil para buscar dados completos
export const buscarCidadesMG = async () => {
  try {
    // Primeiro, buscar todos os municípios de Minas Gerais
    const responseMunicipios = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados/31/municipios');
    
    if (!responseMunicipios.ok) {
      throw new Error('Erro ao buscar municípios do IBGE');
    }
    
    const municipios = await responseMunicipios.json();
    
    // Filtrar apenas municípios com coordenadas
    const municipiosComCoordenadas = municipios.filter(municipio => 
      municipio.latitude && municipio.longitude
    );
    
    // Buscar dados de população para cada município
    const cidadesComDados = await Promise.all(
      municipiosComCoordenadas.map(async (municipio) => {
        try {
          // Buscar população estimada (último ano disponível)
          const responsePopulacao = await fetch(
            `https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/2022/variaveis/9324?localidades=N6[${municipio.id}]`
          );
          
          let populacao = 0;
          
          if (responsePopulacao.ok) {
            const dadosPopulacao = await responsePopulacao.json();
            if (dadosPopulacao[0] && dadosPopulacao[0].resultados[0] && dadosPopulacao[0].resultados[0].series[0]) {
              populacao = dadosPopulacao[0].resultados[0].series[0].serie['2022'] || 0;
            }
          }
          
          const coordenadas = converterCoordenadas(municipio.latitude, municipio.longitude);
          if (!coordenadas) {
            console.warn(`Coordenadas inválidas para ${municipio.nome}`);
            return null;
          }
          
          return {
            nome: municipio.nome,
            latitude: coordenadas.lat,
            longitude: coordenadas.lng,
            populacao: parseInt(populacao) || 0,
            codigo: municipio.id,
            microrregiao: municipio.microrregiao?.nome || '',
            mesorregiao: municipio.microrregiao?.mesorregiao?.nome || ''
          };
        } catch (error) {
          console.warn(`Erro ao buscar dados de ${municipio.nome}:`, error);
          return {
            nome: municipio.nome,
            latitude: parseFloat(municipio.latitude),
            longitude: parseFloat(municipio.longitude),
            populacao: 0,
            codigo: municipio.id,
            microrregiao: municipio.microrregiao?.nome || '',
            mesorregiao: municipio.microrregiao?.mesorregiao?.nome || ''
          };
        }
      })
    );
    
    // Filtrar cidades com população > 0 e ordenar por população
    const cidadesValidas = cidadesComDados
      .filter(cidade => cidade.populacao > 0)
      .sort((a, b) => b.populacao - a.populacao);
    
    console.log(`Carregadas ${cidadesValidas.length} cidades de Minas Gerais com dados de população`);
    return cidadesValidas;
    
  } catch (error) {
    console.error('Erro ao buscar dados das cidades:', error);
    throw error;
  }
};

// Versão simplificada que busca apenas coordenadas (mais rápida)
export const buscarCidadesMGSemPopulacao = async () => {
  try {
    console.log('Iniciando busca de cidades de Minas Gerais...');
    console.log('Fazendo requisição para API do IBGE...');
    
    const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados/31/municipios');
    
    console.log('Status da resposta:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar dados do IBGE: ${response.status} ${response.statusText}`);
    }
    
    const municipios = await response.json();
    console.log(`Total de municípios encontrados: ${municipios.length}`);
    
    // Verificar formato dos dados
    if (municipios.length > 0) {
      const primeiroMunicipio = municipios[0];
      console.log('Exemplo de município da API:', {
        nome: primeiroMunicipio.nome,
        latitude: primeiroMunicipio.latitude,
        longitude: primeiroMunicipio.longitude,
        tipoLat: typeof primeiroMunicipio.latitude,
        tipoLng: typeof primeiroMunicipio.longitude
      });
      
      // Verificar se tem coordenadas
      const temCoordenadas = primeiroMunicipio.latitude && primeiroMunicipio.longitude;
      console.log('Primeiro município tem coordenadas?', temCoordenadas);
    }
    
    console.log('Processando', municipios.length, 'municípios...');
    
    const cidades = municipios
      .filter(municipio => {
        const temCoordenadas = municipio.latitude && municipio.longitude;
        if (!temCoordenadas) {
          console.warn(`Município ${municipio.nome} não possui coordenadas`);
          return false;
        }
        
        // Converter e validar coordenadas
        const coordenadas = converterCoordenadas(municipio.latitude, municipio.longitude);
        if (!coordenadas) {
          console.warn(`Município ${municipio.nome} possui coordenadas inválidas`);
          return false;
        }
        
        return true;
      })
      .map(municipio => {
        const coordenadas = converterCoordenadas(municipio.latitude, municipio.longitude);
        return {
          nome: municipio.nome,
          lat: coordenadas.lat,
          lng: coordenadas.lng,
          latitude: coordenadas.lat, // Manter para compatibilidade
          longitude: coordenadas.lng, // Manter para compatibilidade
          populacao: 0, // Será preenchido posteriormente se necessário
          codigo: municipio.id,
          microrregiao: municipio.microrregiao?.nome || '',
          mesorregiao: municipio.microrregiao?.mesorregiao?.nome || ''
        };
      });
    
    console.log('Municípios com coordenadas válidas:', cidades.length);
    
    console.log(`Carregadas ${cidades.length} cidades de Minas Gerais com coordenadas`);
    console.log('Primeiras 5 cidades:', cidades.slice(0, 5).map(c => ({ nome: c.nome, lat: c.latitude, lng: c.longitude })));
    
    // Verificar se as coordenadas estão no formato correto
    if (cidades.length > 0) {
      const primeiraCidade = cidades[0];
      console.log('Exemplo de coordenadas convertidas:', {
        nome: primeiraCidade.nome,
        latitude: primeiraCidade.latitude,
        longitude: primeiraCidade.longitude,
        tipo: typeof primeiraCidade.latitude
      });
    }
    
    return cidades;
    
  } catch (error) {
    console.error('Erro ao buscar cidades:', error);
    throw error;
  }
}; 

// Função simples para buscar todas as cidades de Minas Gerais
export const buscarTodasCidadesMG = async () => {
  try {
    console.log('Buscando todas as cidades de Minas Gerais...');
    
    // Primeiro, buscar todos os municípios do IBGE
    const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados/31/municipios');
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }
    
    const municipios = await response.json();
    console.log(`Total de municípios encontrados: ${municipios.length}`);
    
    // Agora vou buscar as coordenadas de uma API externa para cada município
    const cidadesComCoordenadas = [];
    
    for (let i = 0; i < municipios.length; i++) {
      const municipio = municipios[i];
      console.log(`Buscando coordenadas para ${municipio.nome} (${i + 1}/${municipios.length})`);
      
      try {
        // Usar a API do OpenStreetMap para buscar coordenadas
        const geocodingResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(municipio.nome + ', Minas Gerais, Brasil')}&format=json&limit=1`
        );
        
        if (geocodingResponse.ok) {
          const geocodingData = await geocodingResponse.json();
          
          if (geocodingData.length > 0) {
            const lat = parseFloat(geocodingData[0].lat);
            const lng = parseFloat(geocodingData[0].lon);
            
            // Verificar se as coordenadas estão em Minas Gerais
            if (lat >= -23 && lat <= -14 && lng >= -51 && lng <= -39) {
              cidadesComCoordenadas.push({
                nome: municipio.nome,
                lat: lat,
                lng: lng,
                latitude: lat,
                longitude: lng,
                populacao: 0, // Não temos dados de população da API do IBGE
                codigo: municipio.id,
                microrregiao: municipio.microrregiao?.nome || '',
                mesorregiao: municipio.microrregiao?.mesorregiao?.nome || ''
              });
              console.log(`✓ ${municipio.nome}: ${lat}, ${lng}`);
            } else {
              console.log(`✗ ${municipio.nome}: coordenadas fora de MG`);
            }
          } else {
            console.log(`✗ ${municipio.nome}: não encontrado`);
          }
        }
        
        // Pausa para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`✗ Erro ao buscar ${municipio.nome}:`, error.message);
      }
    }
    
    console.log(`Total de cidades com coordenadas encontradas: ${cidadesComCoordenadas.length}`);
    
    if (cidadesComCoordenadas.length > 0) {
      console.log('Exemplo de cidade:', {
        nome: cidadesComCoordenadas[0].nome,
        lat: cidadesComCoordenadas[0].lat,
        lng: cidadesComCoordenadas[0].lng
      });
    }
    
    return cidadesComCoordenadas;
    
  } catch (error) {
    console.error('Erro ao buscar cidades:', error);
    throw error;
  }
}; 