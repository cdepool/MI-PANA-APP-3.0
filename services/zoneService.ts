/**
 * Zone Service - Gestión de zonas geográficas de Acarigua-Araure
 */

export interface Zone {
    id: string;
    name: string;
    city: 'ACARIGUA' | 'ARAURE' | 'BOTH';
    center: {
        lat: number;
        lng: number;
    };
    radius: number; // km
    type: 'COMMERCIAL' | 'TRANSPORT' | 'INDUSTRIAL' | 'RESIDENTIAL' | 'RURAL';
    landmarks: string[];
}

/**
 * Zonas definidas de Acarigua-Araure
 */
export const ACARIGUA_ARAURE_ZONES: Zone[] = [
    {
        id: 'ACG-CENTRO',
        name: 'Centro Comercial Acarigua',
        city: 'ACARIGUA',
        center: { lat: 9.5549, lng: -69.1953 },
        radius: 1.5,
        type: 'COMMERCIAL',
        landmarks: [
            'Centro Comercial Acarigua', 'Centro Comercial Los Samanes',
            'Plaza Bolívar', 'Plaza Miranda', 'Hospital Central',
            'Alcaldía Municipio Páez', 'Bancos', 'Avenida Libertador'
        ]
    },
    {
        id: 'ACG-TERMINAL',
        name: 'Terminal de Pasajeros',
        city: 'ACARIGUA',
        center: { lat: 9.5600, lng: -69.2000 },
        radius: 0.8,
        type: 'TRANSPORT',
        landmarks: [
            'Terminal de Pasajeros Acarigua',
            'Parada taxis interurbanos',
            'Avenida Circunvalación'
        ]
    },
    {
        id: 'ACG-INDUSTRIAL',
        name: 'Zona Industrial',
        city: 'ACARIGUA',
        center: { lat: 9.5400, lng: -69.1800 },
        radius: 2.0,
        type: 'INDUSTRIAL',
        landmarks: [
            'Zona Industrial Los Samanes',
            'Urb. Los Samanes I, II, III',
            'Depósitos', 'Talleres'
        ]
    },
    {
        id: 'ACG-NORTE',
        name: 'Zona Residencial Norte',
        city: 'ACARIGUA',
        center: { lat: 9.5700, lng: -69.1900 },
        radius: 1.2,
        type: 'RESIDENTIAL',
        landmarks: [
            'Urb. La Candelaria', 'Urb. Los Samanes', 'Urb. Los Próceres',
            'Escuelas', 'Iglesias', 'Parques'
        ]
    },
    {
        id: 'ARU-CENTRO',
        name: 'Centro Araure',
        city: 'ARAURE',
        center: { lat: 9.5808, lng: -69.2372 },
        radius: 1.0,
        type: 'COMMERCIAL',
        landmarks: [
            'Centro Comercial Araure',
            'Plaza Bolívar Araure',
            'Hospital Dr. Egidio Montesinos',
            'Alcaldía de Araure'
        ]
    },
    {
        id: 'ARU-AGRICOLA',
        name: 'Zona Agrícola',
        city: 'ARAURE',
        center: { lat: 9.5600, lng: -69.2500 },
        radius: 3.0,
        type: 'RURAL',
        landmarks: [
            'Fincas', 'Haciendas', 'Zona ganadera',
            'Campos de cultivo'
        ]
    },
    {
        id: 'VIA-ACG-ARU',
        name: 'Vía Acarigua-Araure',
        city: 'BOTH',
        center: { lat: 9.5678, lng: -69.2162 },
        radius: 0.5,
        type: 'TRANSPORT',
        landmarks: [
            'Carretera Nacional Acarigua-Araure',
            'Llano Mall',
            'Estadio José Antonio Páez',
            'Estaciones de servicio'
        ]
    }
];

/**
 * Centro por defecto del mapa (punto medio Acarigua-Araure)
 */
export const DEFAULT_MAP_CENTER = {
    lat: 9.5678,
    lng: -69.2162,
    zoom: 13
};

/**
 * Límites del mapa
 */
export const MAP_BOUNDS = {
    north: 9.6200,
    south: 9.5200,
    east: -69.1500,
    west: -69.2700
};

/**
 * Encuentra la zona por ubicación (lat, lng)
 */
export function getZoneByLocation(lat: number, lng: number): Zone | null {
    for (const zone of ACARIGUA_ARAURE_ZONES) {
        if (isInZone(lat, lng, zone)) {
            return zone;
        }
    }
    return null;
}

/**
 * Verifica si una ubicación está dentro de una zona
 */
export function isInZone(lat: number, lng: number, zone: Zone): boolean {
    const distance = calculateDistance(
        lat, lng,
        zone.center.lat, zone.center.lng
    );
    return distance <= zone.radius;
}

/**
 * Obtiene zona por ID
 */
export function getZoneById(zoneId: string): Zone | null {
    return ACARIGUA_ARAURE_ZONES.find(z => z.id === zoneId) || null;
}

/**
 * Obtiene zonas por ciudad
 */
export function getZonesByCity(city: 'ACARIGUA' | 'ARAURE' | 'BOTH'): Zone[] {
    return ACARIGUA_ARAURE_ZONES.filter(z => z.city === city || z.city === 'BOTH');
}

/**
 * Obtiene zonas por tipo
 */
export function getZonesByType(type: Zone['type']): Zone[] {
    return ACARIGUA_ARAURE_ZONES.filter(z => z.type === type);
}

/**
 * Calcula distancia entre dos puntos (km)
 */
export function calculateDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number
): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Encuentra las N zonas más cercanas a una ubicación
 */
export function getNearestZones(
    lat: number,
    lng: number,
    limit: number = 3
): Zone[] {
    const zonesWithDistance = ACARIGUA_ARAURE_ZONES.map(zone => ({
        zone,
        distance: calculateDistance(lat, lng, zone.center.lat, zone.center.lng)
    }));

    return zonesWithDistance
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit)
        .map(item => item.zone);
}
