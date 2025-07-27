import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, Rectangle } from 'react-leaflet';
import L from 'leaflet';
import { REGIONAIS } from '../data/regionais';
import { getDistance } from 'geolib';
import { buscarTodasCidadesMG } from '../services/ibgeService';
import './MapaComRegionais.css';

// Função alternativa para calcular distância usando fórmula de Haversine
const calcularDistancia = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distancia = R * c; // Distância em km
  return distancia * 1000; // Retorna em metros
};

// Componente de loading
const LoadingSpinner = () => (
  <div className="loading-container">
    <div className="loading-content">
      <h3>Carregando mapa...</h3>
      <p>Buscando cidades de Minas Gerais</p>
      <div className="spinner"></div>
    </div>
  </div>
);

// Componente do painel de informações
const InfoPanel = ({ cidades, regionais, cidadeSelecionada, areaSelecionada, modoDesenho, error }) => (
  <div className="info-panel">
    <h3>Mapa de Minas Gerais</h3>
    <p><strong>Cidades carregadas:</strong> {cidades.length}</p>
    <p><strong>Regionais:</strong> {regionais.length}</p>
    {error && <p className="error">⚠️ {error}</p>}
    
    {cidadeSelecionada && (
      <div className="selected-info">
        <p className="city-name">{cidadeSelecionada.nome}</p>
        <p>População: {cidadeSelecionada.populacao > 0 ? cidadeSelecionada.populacao.toLocaleString() : 'Dados não disponíveis'}</p>
      </div>
    )}
    
    {areaSelecionada && (
      <div className="area-info">
        <p className="area-name">{areaSelecionada.nome}</p>
      </div>
    )}
    
    {modoDesenho && (
      <div className="draw-mode-info">
        <p>Modo Desenho Ativo</p>
        <p>Clique para definir a área</p>
      </div>
    )}
  </div>
);

// Componente do painel lateral
const SidePanel = ({ 
  cidadeSelecionada, 
  areaSelecionada, 
  cidadesProximas, 
  cidadesNaArea, 
  raioKm,
  onLimparSelecoes,
  onAtivarModoDesenho,
  modoDesenho 
}) => {
  const cidadesParaExibir = areaSelecionada ? cidadesNaArea : cidadesProximas;
  const titulo = areaSelecionada ? 'Cidades na Área' : 'Cidades Próximas';
  const subtitulo = areaSelecionada ? 'Área Selecionada' : `Raio: ${raioKm}km`;

  return (
    <div className="side-panel">
      <div className="panel-header">
        <h3>{titulo}</h3>
        <div className="subtitle">{subtitulo}</div>
      </div>

      <div className="control-buttons">
        <button onClick={onLimparSelecoes} className="btn btn-secondary">
          Limpar
        </button>
        <button 
          onClick={onAtivarModoDesenho} 
          className={`btn ${modoDesenho ? 'btn-danger' : 'btn-success'}`}
        >
          {modoDesenho ? 'Cancelar Desenho' : 'Desenhar Área'}
        </button>
        <div className="instruction">
          {modoDesenho ? 'Clique duas vezes para definir a área' : 'Clique em cidade ou desenhe uma área'}
        </div>
      </div>
      
      {cidadeSelecionada && (
        <div className="selected-city-info">
          <p><strong>Cidade selecionada:</strong> {cidadeSelecionada.nome}</p>
          <p>População: {cidadeSelecionada.populacao > 0 ? cidadeSelecionada.populacao.toLocaleString() : 'Dados não disponíveis'}</p>
          <p>Cidades próximas encontradas: {cidadesProximas.length}</p>
        </div>
      )}

      {areaSelecionada && (
        <div className="selected-area-info">
          <p><strong>Área selecionada:</strong> {areaSelecionada.nome}</p>
          <p>Cidades encontradas: {cidadesNaArea.length}</p>
        </div>
      )}

      <div className="cities-list">
        <h4>Lista de cidades:</h4>
        {cidadesParaExibir.length > 0 ? (
          <div className="cities-container">
            {cidadesParaExibir.map((cidade, index) => (
              <div key={cidade.nome} className="city-item">
                <div className="city-info">
                  <span className="city-name">{cidade.nome}</span>
                  {cidade.microrregiao && (
                    <div className="microregion">{cidade.microrregiao}</div>
                  )}
                </div>
                <span className="population">
                  {cidade.populacao > 0 ? cidade.populacao.toLocaleString() : 'N/A'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-cities">
            <p>Nenhuma cidade encontrada.</p>
          </div>
        )}
      </div>

      {!cidadeSelecionada && !areaSelecionada && (
        <div className="instructions">
          <p><strong>Como usar:</strong></p>
          <p>1. Clique em uma cidade para ver as próximas</p>
          <p>2. Ou clique em "Desenhar Área" e defina uma região</p>
          <p>3. As cidades aparecerão aqui</p>
        </div>
      )}
    </div>
  );
};

const MapaComRegionais = () => {
  const [cidadeSelecionada, setCidadeSelecionada] = useState(null);
  const [cidades, setCidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [areaSelecionada, setAreaSelecionada] = useState(null);
  const [modoDesenho, setModoDesenho] = useState(false);
  const [pontoInicial, setPontoInicial] = useState(null);
  const [pontoAtual, setPontoAtual] = useState(null);
  
  const raioKm = 50;

  // Log do estado das cidades
  useEffect(() => {
    console.log('Estado das cidades atualizado:', cidades.length, 'cidades');
    if (cidades.length > 0) {
      console.log('Primeiras 5 cidades:', cidades.slice(0, 5).map(c => c.nome));
      console.log('Exemplo de cidade:', cidades[0]);
    } else {
      console.log('Nenhuma cidade carregada ainda');
    }
  }, [cidades]);

  // Fix Leaflet default icon issue
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  // Criar ícones personalizados para as regionais
  const regionalIcon = useMemo(() => {
    return L.divIcon({
      className: 'regional-marker',
      html: '<div style="background-color: #ffc107; border: 2px solid #ff8f00; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; color: #000; font-weight: bold; font-size: 12px;">R</div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  }, []);

  // Carregar cidades com cache
  useEffect(() => {
    const carregarCidades = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Iniciando carregamento de cidades...');
        
        // FORÇAR BUSCA DA API PARA DEBUG - IGNORAR CACHE
        console.log('FORÇANDO BUSCA DA API PARA DEBUG - IGNORANDO CACHE');
        
        // Limpar cache antigo
        localStorage.removeItem('cidadesMG');
        
        console.log('Buscando todas as cidades de Minas Gerais...');
        const cidadesCarregadas = await buscarTodasCidadesMG();
        console.log('Cidades carregadas:', cidadesCarregadas.length);
        
        if (cidadesCarregadas.length > 0) {
          console.log('Exemplo de cidade:', cidadesCarregadas[0]);
        }
        
        setCidades(cidadesCarregadas);
        
      } catch (err) {
        console.error('Erro ao carregar cidades:', err);
        setError('Erro ao carregar dados das cidades. Verifique sua conexão com a internet.');
        
        // Fallback simples com algumas cidades principais
        const cidadesFallback = [
          { nome: "Belo Horizonte", lat: -19.9167, lng: -43.9345, populacao: 2521564 },
          { nome: "Uberlândia", lat: -18.9141, lng: -48.2749, populacao: 699097 },
          { nome: "Juiz de Fora", lat: -21.7605, lng: -43.3434, populacao: 573285 },
          { nome: "Montes Claros", lat: -16.7282, lng: -43.8578, populacao: 413487 },
          { nome: "Governador Valadares", lat: -18.8545, lng: -41.9555, populacao: 278685 }
        ];
        console.log('Usando fallback com', cidadesFallback.length, 'cidades');
        setCidades(cidadesFallback);
      } finally {
        setLoading(false);
      }
    };

    carregarCidades();
  }, []);

  // Calcular cidades próximas usando useMemo para performance
  const cidadesProximas = useMemo(() => {
    if (!cidadeSelecionada) return [];
    
    console.log('Calculando cidades próximas para:', cidadeSelecionada.nome);
    console.log('Cidade selecionada:', cidadeSelecionada);
    console.log('Total de cidades:', cidades.length);
    
    const cidadesFiltradas = cidades.filter((c) => {
      // Usar função alternativa para calcular distância
      const distancia = calcularDistancia(
        cidadeSelecionada.lat,
        cidadeSelecionada.lng,
        c.lat,
        c.lng
      );
      
      console.log(`Distância de ${cidadeSelecionada.nome} para ${c.nome}: ${distancia}m (${distancia/1000}km)`);
      
      const estaNoRaio = distancia <= raioKm * 1000;
      const naoEhAMesma = c.nome !== cidadeSelecionada.nome;
      
      console.log(`${c.nome}: no raio=${estaNoRaio}, não é a mesma=${naoEhAMesma}`);
      
      return estaNoRaio && naoEhAMesma;
    });
    
    console.log('Cidades próximas encontradas:', cidadesFiltradas.length);
    console.log('Cidades próximas:', cidadesFiltradas.map(c => c.nome));
    
    return cidadesFiltradas;
  }, [cidadeSelecionada, cidades, raioKm]);

  // Calcular cidades na área usando useMemo
  const cidadesNaArea = useMemo(() => {
    if (!areaSelecionada) return [];
    
    return cidades.filter((cidade) => {
      const point = L.latLng(cidade.latitude, cidade.longitude);
      const bounds = L.latLngBounds(areaSelecionada.bounds);
      return bounds.contains(point);
    });
  }, [areaSelecionada, cidades]);

  // Handlers usando useCallback para evitar re-renders desnecessários
  const handleCidadeClick = useCallback((cidade) => {
    console.log('Cidade clicada:', cidade.nome);
    setCidadeSelecionada(cidade);
    setAreaSelecionada(null);
    setModoDesenho(false);
  }, []);

  const handleRegionalClick = useCallback((regional) => {
    console.log('Regional clicada:', regional.nome);
    console.log('Cidade base da regional:', regional.cidadeBase);
    console.log('Cidades disponíveis:', cidades.map(c => c.nome));
    
    // Encontrar a cidade base da regional
    const cidadeBase = cidades.find(cidade => cidade.nome === regional.cidadeBase);
    if (cidadeBase) {
      console.log('Cidade base encontrada:', cidadeBase.nome);
      setCidadeSelecionada(cidadeBase);
      setAreaSelecionada(null);
      setModoDesenho(false);
    } else {
      console.log('Cidade base não encontrada para:', regional.cidadeBase);
      // Fallback: usar as coordenadas da regional como cidade
      const cidadeFallback = {
        nome: regional.nome,
        lat: regional.coordenadas.lat,
        lng: regional.coordenadas.lng,
        latitude: regional.coordenadas.lat,
        longitude: regional.coordenadas.lng,
        populacao: 0
      };
      console.log('Usando fallback:', cidadeFallback.nome);
      setCidadeSelecionada(cidadeFallback);
      setAreaSelecionada(null);
      setModoDesenho(false);
    }
  }, [cidades]);

  const handleMapClick = useCallback((e) => {
    if (!modoDesenho) return;
    
    if (!pontoInicial) {
      setPontoInicial(e.latlng);
      setPontoAtual(e.latlng);
    } else {
      // Finalizar o desenho
      const bounds = [
        [Math.min(pontoInicial.lat, e.latlng.lat), Math.min(pontoInicial.lng, e.latlng.lng)],
        [Math.max(pontoInicial.lat, e.latlng.lat), Math.max(pontoInicial.lng, e.latlng.lng)]
      ];
      
      setAreaSelecionada({
        nome: "Área Selecionada",
        bounds: bounds,
        color: "#007bff"
      });
      
      setCidadeSelecionada(null);
      setModoDesenho(false);
      setPontoInicial(null);
      setPontoAtual(null);
    }
  }, [modoDesenho, pontoInicial]);

  const handleMapMouseMove = useCallback((e) => {
    if (modoDesenho && pontoInicial) {
      setPontoAtual(e.latlng);
    }
  }, [modoDesenho, pontoInicial]);

  const ativarModoDesenho = useCallback(() => {
    setModoDesenho(true);
    setCidadeSelecionada(null);
    setAreaSelecionada(null);
    setPontoInicial(null);
    setPontoAtual(null);
  }, []);

  const limparSelecoes = useCallback(() => {
    setCidadeSelecionada(null);
    setAreaSelecionada(null);
    setModoDesenho(false);
    setPontoInicial(null);
    setPontoAtual(null);
  }, []);

  // Calcular bounds do retângulo sendo desenhado
  const getRectangleBounds = useCallback(() => {
    if (!pontoInicial || !pontoAtual) return null;
    
    return [
      [Math.min(pontoInicial.lat, pontoAtual.lat), Math.min(pontoInicial.lng, pontoAtual.lng)],
      [Math.max(pontoInicial.lat, pontoAtual.lat), Math.max(pontoInicial.lng, pontoAtual.lng)]
    ];
  }, [pontoInicial, pontoAtual]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="mapa-container">
      <InfoPanel 
        cidades={cidades}
        regionais={REGIONAIS}
        cidadeSelecionada={cidadeSelecionada}
        areaSelecionada={areaSelecionada}
        modoDesenho={modoDesenho}
        error={error}
      />

      <SidePanel
        cidadeSelecionada={cidadeSelecionada}
        areaSelecionada={areaSelecionada}
        cidadesProximas={cidadesProximas}
        cidadesNaArea={cidadesNaArea}
        raioKm={raioKm}
        onLimparSelecoes={limparSelecoes}
        onAtivarModoDesenho={ativarModoDesenho}
        modoDesenho={modoDesenho}
      />

      <div className="mapa-wrapper">
        <MapContainer
          center={[-18.5, -44]}
          zoom={6.5}
          className="mapa"
          eventHandlers={{
            click: handleMapClick,
            mousemove: handleMapMouseMove
          }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Retângulo sendo desenhado */}
          {modoDesenho && pontoInicial && pontoAtual && (
            <Rectangle
              bounds={getRectangleBounds()}
              pathOptions={{
                color: '#007bff',
                fillColor: '#007bff',
                fillOpacity: 0.2,
                weight: 2,
                dashArray: '5, 5'
              }}
            />
          )}

          {/* Área selecionada */}
          {areaSelecionada && (
            <Rectangle
              bounds={areaSelecionada.bounds}
              pathOptions={{
                color: areaSelecionada.color,
                fillColor: areaSelecionada.color,
                fillOpacity: 0.2,
                weight: 3
              }}
            />
          )}

          {/* Marcadores das cidades */}
          {cidades.map((cidade) => (
            <Marker
              key={cidade.nome}
              position={[cidade.lat, cidade.lng]}
              eventHandlers={{
                click: () => handleCidadeClick(cidade)
              }}
            >
              <Popup>
                <div className="popup-content">
                  <strong>{cidade.nome}</strong>
                  <br />
                  População: {cidade.populacao > 0 ? cidade.populacao.toLocaleString() : 'Dados não disponíveis'}
                  {cidade.microrregiao && (
                    <>
                      <br />
                      <small>{cidade.microrregiao}</small>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Círculo da cidade selecionada */}
          {cidadeSelecionada && (
            <Circle
              center={[cidadeSelecionada.lat, cidadeSelecionada.lng]}
              radius={raioKm * 1000}
              pathOptions={{ 
                color: '#007bff', 
                fillColor: '#007bff',
                fillOpacity: 0.1,
                weight: 2
              }}
            />
          )}

          {/* Regionais */}
          {REGIONAIS.map((reg) => (
            <React.Fragment key={reg.nome}>
              <Marker 
                position={[reg.coordenadas.lat + 0.01, reg.coordenadas.lng + 0.01]}
                icon={regionalIcon}
                eventHandlers={{
                  click: () => handleRegionalClick(reg)
                }}
              >
                <Popup>
                  <div className="popup-content">
                    <strong>{reg.nome}</strong>
                    <br />
                    Regional de Saúde
                    <br />
                    <small>Clique para ver cidades próximas</small>
                  </div>
                </Popup>
              </Marker>
              <Circle
                center={[reg.coordenadas.lat, reg.coordenadas.lng]}
                radius={reg.raioKm * 1000}
                pathOptions={{ 
                  color: '#ffc107', 
                  fillColor: '#ffc107',
                  fillOpacity: 0.1,
                  weight: 1
                }}
              />
            </React.Fragment>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapaComRegionais;
