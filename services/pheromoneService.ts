import { ACARIGUA_ARAURE_ZONES, Zone } from './zoneService';

/**
 * Pheromone Service - Gestión de feromonas digitales
 * Basado en comportamiento de hormigas para optimizar matching
 */

interface Pheromone {
    zone_id: string;
    zone_name: string;
    city: string;
    lat: number;
    lng: number;
    intensity: number; // 0-100
    decay_rate: number; // 0.90-0.99
    last_updated: Date;
}

interface PheromoneUpdate {
    zone_id: string;
    action: 'REQUEST' | 'MATCH_SUCCESS' | 'MATCH_FAILED' | 'CANCEL';
    intensity_delta: number;
}

// Configuración de feromonas
const PHEROMONE_CONFIG = {
    MAX_INTENSITY: 100,
    MIN_INTENSITY: 0,
    DEFAULT_DECAY_RATE: 0.95, // 5% evaporación por intervalo
    DECAY_INTERVAL_MS: 60000, // 1 minuto

    // Incrementos por acción
    INCREMENTS: {
        REQUEST: 5,
        MATCH_SUCCESS: 10,
        MATCH_FAILED: -3,
        CANCEL: -2
    }
};

// Cache en memoria de feromonas
let pheromonesCache: Map<string, Pheromone> = new Map();
let lastDecayTime: Date = new Date();

/**
 * Inicializa feromonas para todas las zonas
 */
export function initializePheromones(): void {
    ACARIGUA_ARAURE_ZONES.forEach(zone => {
        const initialIntensity = getInitialIntensity(zone.id);

        pheromonesCache.set(zone.id, {
            zone_id: zone.id,
            zone_name: zone.name,
            city: zone.city,
            lat: zone.center.lat,
            lng: zone.center.lng,
            intensity: initialIntensity,
            decay_rate: PHEROMONE_CONFIG.DEFAULT_DECAY_RATE,
            last_updated: new Date()
        });
    });
}

/**
 * Obtiene intensidad inicial basada en tipo de zona
 */
function getInitialIntensity(zoneId: string): number {
    const INITIAL_INTENSITIES: Record<string, number> = {
        'ACG-CENTRO': 60,
        'ACG-TERMINAL': 75,
        'ACG-INDUSTRIAL': 40,
        'ACG-NORTE': 50,
        'ARU-CENTRO': 55,
        'ARU-AGRICOLA': 20,
        'VIA-ACG-ARU': 45
    };

    return INITIAL_INTENSITIES[zoneId] || 30;
}

/**
 * Deposita feromona en una zona (incrementa intensidad)
 */
export function depositPheromone(update: PheromoneUpdate): void {
    const pheromone = pheromonesCache.get(update.zone_id);
    if (!pheromone) return;

    const increment = PHEROMONE_CONFIG.INCREMENTS[update.action] || 0;
    const newIntensity = Math.max(
        PHEROMONE_CONFIG.MIN_INTENSITY,
        Math.min(
            PHEROMONE_CONFIG.MAX_INTENSITY,
            pheromone.intensity + increment + update.intensity_delta
        )
    );

    pheromone.intensity = newIntensity;
    pheromone.last_updated = new Date();

    pheromonesCache.set(update.zone_id, pheromone);
}

/**
 * Evapora feromonas (decay natural con el tiempo)
 */
export function evaporatePheromones(): void {
    const now = new Date();
    const timeSinceLastDecay = now.getTime() - lastDecayTime.getTime();

    // Solo evaporar si ha pasado el intervalo
    if (timeSinceLastDecay < PHEROMONE_CONFIG.DECAY_INTERVAL_MS) {
        return;
    }

    pheromonesCache.forEach((pheromone, zoneId) => {
        const decayedIntensity = pheromone.intensity * pheromone.decay_rate;

        pheromone.intensity = Math.max(
            PHEROMONE_CONFIG.MIN_INTENSITY,
            decayedIntensity
        );

        pheromonesCache.set(zoneId, pheromone);
    });

    lastDecayTime = now;
}

/**
 * Obtiene intensidad de feromona en una ubicación específica
 */
export function getPheromoneIntensity(lat: number, lng: number): number {
    // Encontrar zona más cercana
    let closestZone: Pheromone | null = null;
    let minDistance = Infinity;

    pheromonesCache.forEach(pheromone => {
        const distance = calculateDistance(
            lat, lng,
            pheromone.lat, pheromone.lng
        );

        if (distance < minDistance) {
            minDistance = distance;
            closestZone = pheromone;
        }
    });

    return closestZone?.intensity || 0;
}

/**
 * Obtiene feromona de una zona específica
 */
export function getPheromoneByZone(zoneId: string): Pheromone | null {
    return pheromonesCache.get(zoneId) || null;
}

/**
 * Obtiene todas las feromonas (para heatmap)
 */
export function getAllPheromones(): Pheromone[] {
    return Array.from(pheromonesCache.values());
}

/**
 * Obtiene zonas calientes (high pheromone intensity)
 */
export function getHotZones(threshold: number = 60): Pheromone[] {
    return Array.from(pheromonesCache.values())
        .filter(p => p.intensity >= threshold)
        .sort((a, b) => b.intensity - a.intensity);
}

/**
 * Calcula distancia euclidiana entre dos puntos (km)
 */
function calculateDistance(
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
 * Actualiza feromonas en base de datos (Supabase)
 * Llamar periódicamente para persistir
 */
export async function syncPheromonesToDB(): Promise<void> {
    // TODO: Implementar sync con Supabase
    // INSERT INTO pheromones ... ON CONFLICT UPDATE
    console.log('Syncing pheromones to database...');
}

/**
 * Carga feromonas desde base de datos
 */
export async function loadPheromonesFromDB(): Promise<void> {
    // TODO: Implementar carga desde Supabase
    // SELECT * FROM pheromones
    console.log('Loading pheromones from database...');
}

// Auto-evaporación cada minuto
if (typeof window !== 'undefined') {
    setInterval(() => {
        evaporatePheromones();
    }, PHEROMONE_CONFIG.DECAY_INTERVAL_MS);
}

// Inicializar al cargar
initializePheromones();
