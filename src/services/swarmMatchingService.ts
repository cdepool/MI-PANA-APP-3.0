import { User } from '../types';
import { getZoneByLocation, calculateDistance } from './zoneService';
import { getPheromoneIntensity, depositPheromone } from './pheromoneService';

/**
 * Swarm Matching Service - Algoritmo de matching basado en inteligencia de enjambre
 * Implementa Teoría General de Sistemas con comportamiento emergente
 */

interface MatchCriteria {
    distance: number;        // km
    eta: number;            // minutos
    rating: number;         // 1-5
    acceptance_rate: number; // 0-1
    pheromone: number;      // 0-100
    surge_multiplier: number; // 1.0-2.0
    driver_earnings_potential: number; // USD
}

interface ScoredDriver {
    driver: User;
    score: number;
    criteria: MatchCriteria;
    zone_id: string | null;
}

// Pesos dinámicos del algoritmo (ajustables con aprendizaje)
let SWARM_WEIGHTS = {
    w_distance: 0.30,
    w_eta: 0.25,
    w_rating: 0.15,
    w_acceptance: 0.10,
    w_pheromone: 0.10,
    w_surge: 0.05,
    w_earnings: 0.05
};

/**
 * Encuentra el mejor conductor usando swarm intelligence
 */
export async function findBestDriver(
    passenger: User,
    passengerLocation: { lat: number; lng: number },
    availableDrivers: User[]
): Promise<ScoredDriver | null> {
    if (availableDrivers.length === 0) return null;

    // 1. Obtener zona del pasajero
    const passengerZone = getZoneByLocation(
        passengerLocation.lat,
        passengerLocation.lng
    );

    // 2. Obtener intensidad de feromona en la zona
    const pheromoneIntensity = getPheromoneIntensity(
        passengerLocation.lat,
        passengerLocation.lng
    );

    // 3. Evaluar cada conductor
    const scoredDrivers: ScoredDriver[] = [];

    for (const driver of availableDrivers) {
        if (!driver.location) continue;

        const criteria = await calculateCriteria(
            driver,
            passengerLocation,
            pheromoneIntensity
        );

        const score = calculateSwarmScore(criteria);

        scoredDrivers.push({
            driver,
            score,
            criteria,
            zone_id: passengerZone?.id || null
        });
    }

    // 4. Ordenar por score (mayor a menor)
    scoredDrivers.sort((a, b) => b.score - a.score);

    // 5. Aplicar retroalimentación positiva (depositar feromona)
    if (scoredDrivers.length > 0 && passengerZone) {
        depositPheromone({
            zone_id: passengerZone.id,
            action: 'REQUEST',
            intensity_delta: 0
        });
    }

    // 6. Retornar mejor candidato
    return scoredDrivers[0] || null;
}

/**
 * Encuentra los top N conductores
 */
export async function findTopDrivers(
    passenger: User,
    passengerLocation: { lat: number; lng: number },
    availableDrivers: User[],
    limit: number = 3
): Promise<ScoredDriver[]> {
    if (availableDrivers.length === 0) return [];

    const passengerZone = getZoneByLocation(
        passengerLocation.lat,
        passengerLocation.lng
    );

    const pheromoneIntensity = getPheromoneIntensity(
        passengerLocation.lat,
        passengerLocation.lng
    );

    const scoredDrivers: ScoredDriver[] = [];

    for (const driver of availableDrivers) {
        if (!driver.location) continue;

        const criteria = await calculateCriteria(
            driver,
            passengerLocation,
            pheromoneIntensity
        );

        const score = calculateSwarmScore(criteria);

        scoredDrivers.push({
            driver,
            score,
            criteria,
            zone_id: passengerZone?.id || null
        });
    }

    return scoredDrivers
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

/**
 * Calcula criterios de matching para un conductor
 */
async function calculateCriteria(
    driver: User,
    passengerLocation: { lat: number; lng: number },
    pheromoneIntensity: number
): Promise<MatchCriteria> {
    const driverLocation = driver.location!;

    // Distancia euclidiana
    const distance = calculateDistance(
        passengerLocation.lat,
        passengerLocation.lng,
        driverLocation.lat,
        driverLocation.lng
    );

    // ETA estimado (asumiendo 30 km/h promedio en ciudad)
    const eta = (distance / 30) * 60; // minutos

    // Rating del conductor
    const rating = driver.rating || 4.0;

    // Tasa de aceptación (mock - en producción viene de BD)
    const acceptance_rate = 0.85;

    // Multiplicador de surge (basado en demanda de zona)
    const surge_multiplier = calculateSurgeMultiplier(pheromoneIntensity);

    // Potencial de ganancias (estimado)
    const driver_earnings_potential = estimateEarnings(distance, surge_multiplier);

    return {
        distance,
        eta,
        rating,
        acceptance_rate,
        pheromone: pheromoneIntensity,
        surge_multiplier,
        driver_earnings_potential
    };
}

/**
 * Calcula score multi-criterio usando pesos del enjambre
 */
function calculateSwarmScore(criteria: MatchCriteria): number {
    // Normalizar criterios (0-1)
    const norm_distance = 1 / (1 + criteria.distance); // Menor distancia = mejor
    const norm_eta = 1 / (1 + criteria.eta / 10); // Menor ETA = mejor
    const norm_rating = criteria.rating / 5; // 0-1
    const norm_acceptance = criteria.acceptance_rate; // Ya 0-1
    const norm_pheromone = criteria.pheromone / 100; // 0-1
    const norm_surge = (criteria.surge_multiplier - 1) / 1; // 0-1
    const norm_earnings = Math.min(criteria.driver_earnings_potential / 20, 1); // 0-1

    // Aplicar pesos
    const score =
        SWARM_WEIGHTS.w_distance * norm_distance +
        SWARM_WEIGHTS.w_eta * norm_eta +
        SWARM_WEIGHTS.w_rating * norm_rating +
        SWARM_WEIGHTS.w_acceptance * norm_acceptance +
        SWARM_WEIGHTS.w_pheromone * norm_pheromone +
        SWARM_WEIGHTS.w_surge * norm_surge +
        SWARM_WEIGHTS.w_earnings * norm_earnings;

    return score * 100; // Escala 0-100
}

/**
 * Calcula multiplicador de surge basado en feromona
 */
function calculateSurgeMultiplier(pheromoneIntensity: number): number {
    if (pheromoneIntensity < 30) return 1.0;
    if (pheromoneIntensity < 60) return 1.2;
    if (pheromoneIntensity < 80) return 1.5;
    return 1.8;
}

/**
 * Estima ganancias potenciales para el conductor
 */
function estimateEarnings(distance: number, surgeMultiplier: number): number {
    const BASE_RATE = 2.5; // USD base
    const PER_KM = 0.8; // USD por km

    const baseEarnings = BASE_RATE + (distance * PER_KM);
    return baseEarnings * surgeMultiplier;
}

/**
 * Registra resultado de matching (para aprendizaje)
 */
export function recordMatchResult(
    scoredDriver: ScoredDriver,
    result: 'ACCEPTED' | 'REJECTED' | 'TIMEOUT' | 'COMPLETED',
    completionTime?: number
): void {
    if (!scoredDriver.zone_id) return;

    // Depositar feromona según resultado
    if (result === 'ACCEPTED' || result === 'COMPLETED') {
        depositPheromone({
            zone_id: scoredDriver.zone_id,
            action: 'MATCH_SUCCESS',
            intensity_delta: 0
        });
    } else if (result === 'REJECTED' || result === 'TIMEOUT') {
        depositPheromone({
            zone_id: scoredDriver.zone_id,
            action: 'MATCH_FAILED',
            intensity_delta: 0
        });
    }

    // TODO: Guardar en BD para análisis y ajuste de pesos
    console.log('Match result recorded:', {
        driver_id: scoredDriver.driver.id,
        zone_id: scoredDriver.zone_id,
        result,
        score: scoredDriver.score,
        completionTime
    });
}

/**
 * Ajusta pesos dinámicamente basado en resultados históricos
 * (Aprendizaje simple - en producción usar ML)
 */
export function adjustWeights(historicalMatches: any[]): void {
    // TODO: Implementar ajuste de pesos basado en:
    // - Tasa de aceptación por criterio
    // - Tiempo promedio de matching
    // - Satisfacción del usuario

    console.log('Adjusting swarm weights based on', historicalMatches.length, 'matches');
}

/**
 * Obtiene pesos actuales del algoritmo
 */
export function getSwarmWeights() {
    return { ...SWARM_WEIGHTS };
}

/**
 * Actualiza pesos manualmente (para testing)
 */
export function setSwarmWeights(weights: Partial<typeof SWARM_WEIGHTS>): void {
    SWARM_WEIGHTS = { ...SWARM_WEIGHTS, ...weights };
}
