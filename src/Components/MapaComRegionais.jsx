import React, { useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, Rectangle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { REGIONAIS } from '../data/regionais';
import MUNICIPIOS from '../data/municipios-mg.json';
import './MapaComRegionais.css';

// Distância em metros entre dois pontos (fórmula de Haversine).
const calcularDistancia = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000;
};

// O MapContainer não aceita `eventHandlers`: os eventos do mapa só chegam via
// hook, a partir de um componente renderizado dentro dele.
const MapEvents = ({ onClick, onMouseMove }) => {
  useMapEvents({ click: onClick, mousemove: onMouseMove });
  return null;
};

// Componente do painel de informações
const InfoPanel = ({ cidades, regionais, cidadeSelecionada, areaSelecionada, modoDesenho }) => (
  <div className="info-panel">
    <h3>Mapa de Minas Gerais</h3>
    <p><strong>Cidades carregadas:</strong> {cidades.length}</p>
    <p><strong>Regionais:</strong> {regionais.length}</p>

    {cidadeSelecionada && (
      <div className="selected-info">
        <p className="city-name">{cidadeSelecionada.nome}</p>
        <p>População: {cidadeSelecionada.populacao.toLocaleString('pt-BR')}</p>
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
          {modoDesenho ? 'Clique em dois pontos para definir a área' : 'Clique em cidade ou desenhe uma área'}
        </div>
      </div>

      {cidadeSelecionada && (
        <div className="selected-city-info">
          <p><strong>Cidade selecionada:</strong> {cidadeSelecionada.nome}</p>
          <p>População: {cidadeSelecionada.populacao.toLocaleString('pt-BR')}</p>
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
            {cidadesParaExibir.map((cidade) => (
              <div key={cidade.codigo} className="city-item">
                <div className="city-info">
                  <span className="city-name">{cidade.nome}</span>
                  {cidade.microrregiao && (
                    <div className="microregion">{cidade.microrregiao}</div>
                  )}
                </div>
                <span className="population">
                  {cidade.populacao.toLocaleString('pt-BR')}
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
  const [areaSelecionada, setAreaSelecionada] = useState(null);
  const [modoDesenho, setModoDesenho] = useState(false);
  const [pontoInicial, setPontoInicial] = useState(null);
  const [pontoAtual, setPontoAtual] = useState(null);

  const cidades = MUNICIPIOS;
  const raioKm = 50;

  // Criar ícones personalizados para as regionais
  const regionalIcon = useMemo(() => {
    return L.divIcon({
      className: 'regional-marker',
      html: '<div style="background-color: #ffc107; border: 2px solid #ff8f00; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; color: #000; font-weight: bold; font-size: 12px;">R</div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  }, []);

  // Calcular cidades próximas usando useMemo para performance
  const cidadesProximas = useMemo(() => {
    if (!cidadeSelecionada) return [];

    return cidades.filter((c) => {
      const distancia = calcularDistancia(
        cidadeSelecionada.lat,
        cidadeSelecionada.lng,
        c.lat,
        c.lng
      );

      return distancia <= raioKm * 1000 && c.codigo !== cidadeSelecionada.codigo;
    });
  }, [cidadeSelecionada, cidades, raioKm]);

  // Calcular cidades na área usando useMemo
  const cidadesNaArea = useMemo(() => {
    if (!areaSelecionada) return [];

    const bounds = L.latLngBounds(areaSelecionada.bounds);
    return cidades.filter((cidade) => bounds.contains(L.latLng(cidade.lat, cidade.lng)));
  }, [areaSelecionada, cidades]);

  // Handlers usando useCallback para evitar re-renders desnecessários
  const handleCidadeClick = useCallback((cidade) => {
    setCidadeSelecionada(cidade);
    setAreaSelecionada(null);
    setModoDesenho(false);
  }, []);

  const handleRegionalClick = useCallback((regional) => {
    // Encontrar a cidade base da regional
    const cidadeBase = cidades.find(cidade => cidade.nome === regional.cidadeBase);
    if (cidadeBase) {
      setCidadeSelecionada(cidadeBase);
    } else {
      // Fallback: usar as coordenadas da regional como cidade
      setCidadeSelecionada({
        codigo: `regional-${regional.nome}`,
        nome: regional.nome,
        lat: regional.coordenadas.lat,
        lng: regional.coordenadas.lng,
        populacao: 0,
        microrregiao: ''
      });
    }
    setAreaSelecionada(null);
    setModoDesenho(false);
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
    setModoDesenho((ativo) => !ativo);
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

  return (
    <div className="mapa-container">
      <InfoPanel
        cidades={cidades}
        regionais={REGIONAIS}
        cidadeSelecionada={cidadeSelecionada}
        areaSelecionada={areaSelecionada}
        modoDesenho={modoDesenho}
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
        >
          <MapEvents onClick={handleMapClick} onMouseMove={handleMapMouseMove} />

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
              key={cidade.codigo}
              position={[cidade.lat, cidade.lng]}
              eventHandlers={{
                click: () => handleCidadeClick(cidade)
              }}
            >
              <Popup>
                <div className="popup-content">
                  <strong>{cidade.nome}</strong>
                  <br />
                  População: {cidade.populacao.toLocaleString('pt-BR')}
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
