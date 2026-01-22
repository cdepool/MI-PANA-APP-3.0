import { Tariff, ServiceConfig, ServiceId, LiquidationResult } from '../types';
import logger from '../utils/logger';

// --- CONFIGURACIÓN TASA BCV ---
// Endpoint oficial según documentación: https://dolarapi.com/docs/venezuela/operations/get-dolar-oficial
const BCV_API_URL = 'https://ve.dolarapi.com/v1/dolares/oficial';

// Variable global para la tasa (Estado simple)
export let currentBcvRate = 344.51; // Valor real actualizado el 20 de enero 2026
export let lastBcvUpdate = new Date();

// Interface based on Strict Rule: docs/BCV_RULE.md
interface BcvResponse {
    fuente: string;
    nombre: string;
    compra: number;
    venta: number;
    promedio: number;
    fechaActualizacion: string;
}

// Función Crítica: Obtener Tasa Oficial
export const fetchBcvRate = async () => {
    try {
        logger.log('🔄 Consultando Tasa Oficial BCV...');
        const response = await fetch(BCV_API_URL);

        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const data: BcvResponse = await response.json();

        // Strict Rule: Use 'promedio'
        const rate = data.promedio;

        if (typeof rate === 'number' && rate > 0) {
            currentBcvRate = rate;
            lastBcvUpdate = new Date(data.fechaActualizacion || Date.now());
            logger.log(`✅ Tasa BCV Actualizada: Bs ${currentBcvRate} (Fuente: ${data.fuente})`);
        } else {
            logger.warn('⚠️ Formato de tasa inválido recibido del API, manteniendo tasa anterior.');
        }
    } catch (error) {
        logger.error('❌ Error obteniendo tasa BCV (usando valor en memoria):', error);
    }
};

// Ejecutar fetch inicial
fetchBcvRate();

// Actualizar cada 5 minutos para mantener sincronía con BCV
setInterval(fetchBcvRate, 300000);

export const getTariffs = (): Tariff => {
    return {
        currentBcvRate: currentBcvRate,
        lastUpdate: lastBcvUpdate
    };
};

export const SERVICE_CATALOG: ServiceConfig[] = [
    {
        id: 'mototaxi',
        nombre: 'Mototaxi',
        tarifa_base_neta_usd: 1.25,
        recargo_km_adicional_neta_usd: 0.50,
        pfs_base_usd: 1.32,
        pfs_km_adicional_usd: 0.535,
        distancia_base_km: 6,
        icono: '🏍️',
        vehicleType: 'MOTO'
    },
    {
        id: 'el_pana',
        nombre: 'El Pana',
        tarifa_base_neta_usd: 2.65,
        recargo_km_adicional_neta_usd: 0.50,
        pfs_base_usd: 2.80,
        pfs_km_adicional_usd: 0.535,
        distancia_base_km: 6,
        icono: '🚗',
        vehicleType: 'CAR'
    },
    {
        id: 'el_amigo',
        nombre: 'El Amigo',
        tarifa_base_neta_usd: 2.00,
        recargo_km_adicional_neta_usd: 0.50,
        pfs_base_usd: 2.12,
        pfs_km_adicional_usd: 0.535,
        distancia_base_km: 6,
        icono: '🚙',
        vehicleType: 'CAR'
    },
    {
        id: 'full_pana',
        nombre: 'Full Pana',
        tarifa_base_neta_usd: 3.49,
        recargo_km_adicional_neta_usd: 0.50,
        pfs_base_usd: 3.69,
        pfs_km_adicional_usd: 0.535,
        distancia_base_km: 6,
        icono: '🚐',
        vehicleType: 'FREIGHT'
    }
];

// Utilidades de redondeo financiero
export const round2 = (num: number): number => Math.round((num + Number.EPSILON) * 100) / 100;
export const roundMoney = (num: number): number => Number(num.toFixed(4));

export const calculateLiquidation = (serviceId: ServiceId, distanceKm: number): LiquidationResult => {
    const service = SERVICE_CATALOG.find(s => s.id === serviceId);
    if (!service) throw new Error(`Service ${serviceId} not found`);

    const tasaBcv = currentBcvRate;

    let pfs_usd = service.pfs_base_usd;
    if (distanceKm > service.distancia_base_km) {
        pfs_usd += (distanceKm - service.distancia_base_km) * service.pfs_km_adicional_usd;
    }

    pfs_usd = round2(pfs_usd);
    const pfs_ves = round2(pfs_usd * tasaBcv);

    const pago_bruto_conductor_usd = pfs_usd * 0.95;
    const islr_retenido_usd = pago_bruto_conductor_usd * 0.03;
    const deposito_neto_conductor_usd = pago_bruto_conductor_usd - islr_retenido_usd;

    const comision_bruta_usd = pfs_usd * 0.05;
    const ingreso_neto_app_usd = comision_bruta_usd / 1.16;
    const iva_debito_fiscal_usd = comision_bruta_usd - ingreso_neto_app_usd;

    const total_check = deposito_neto_conductor_usd + ingreso_neto_app_usd + iva_debito_fiscal_usd + islr_retenido_usd;
    const isValid = Math.abs(pfs_usd - total_check) <= 0.02;

    return {
        viaje_id: '',
        input: {
            servicio_nombre: service.nombre,
            distancia_km: distanceKm,
            pfs_usd: pfs_usd,
            pfs_ves: pfs_ves
        },
        conductor: {
            pago_bruto_usd: roundMoney(pago_bruto_conductor_usd),
            islr_retenido_usd: roundMoney(islr_retenido_usd),
            deposito_neto_usd: roundMoney(deposito_neto_conductor_usd),
            deposito_neto_ves: round2(deposito_neto_conductor_usd * tasaBcv)
        },
        plataforma: {
            comision_bruta_usd: roundMoney(comision_bruta_usd),
            ingreso_neto_app_usd: roundMoney(ingreso_neto_app_usd),
            ingreso_neto_app_ves: round2(ingreso_neto_app_usd * tasaBcv),
            iva_debito_fiscal_usd: roundMoney(iva_debito_fiscal_usd),
            iva_debito_fiscal_ves: round2(iva_debito_fiscal_usd * tasaBcv)
        },
        seniat: {
            total_retenciones_usd: roundMoney(islr_retenido_usd + iva_debito_fiscal_usd),
            total_retenciones_ves: round2((islr_retenido_usd + iva_debito_fiscal_usd) * tasaBcv)
        },
        meta: {
            tasa_bcv: tasaBcv,
            valid: isValid,
            timestamp: new Date()
        }
    };
};

export const calculatePrice = (distanceKm: number, serviceId: ServiceId = 'el_pana'): { usd: number, ves: number, liquidation: LiquidationResult } => {
    const liquidation = calculateLiquidation(serviceId, distanceKm);
    return {
        usd: liquidation.input.pfs_usd,
        ves: liquidation.input.pfs_ves,
        liquidation
    };
};
