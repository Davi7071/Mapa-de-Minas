// Cálculos geográficos do mapa. Ficam fora do componente para poderem ser
// testados sem montar React nem o Leaflet.

/**
 * Distância em metros entre dois pontos, pela fórmula de Haversine.
 */
export const calcularDistancia = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000;
};

/**
 * Cidades dentro de um raio, em km, ao redor de uma cidade central.
 * A própria cidade central fica de fora do resultado.
 */
export const cidadesDentroDoRaio = (cidades, centro, raioKm) => {
  if (!centro) return [];

  return cidades.filter((cidade) => {
    if (cidade.codigo === centro.codigo) return false;
    return calcularDistancia(centro.lat, centro.lng, cidade.lat, cidade.lng) <= raioKm * 1000;
  });
};

/**
 * Cidades dentro de um retângulo, no formato do Leaflet:
 * [[latSul, lngOeste], [latNorte, lngLeste]].
 */
export const cidadesDentroDaArea = (cidades, bounds) => {
  if (!bounds) return [];

  const [[latMin, lngMin], [latMax, lngMax]] = bounds;
  return cidades.filter(
    (cidade) =>
      cidade.lat >= latMin &&
      cidade.lat <= latMax &&
      cidade.lng >= lngMin &&
      cidade.lng <= lngMax
  );
};
