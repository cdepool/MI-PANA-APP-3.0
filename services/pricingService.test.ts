import { describe, it, expect, beforeEach } from 'vitest';
import {
    calculateLiquidation,
    calculatePrice,
    round2,
    roundMoney,
    SERVICE_CATALOG,
    currentBcvRate
} from './pricingService';
import type { ServiceId } from '../types';

describe('pricingService', () => {
    describe('Utility Functions', () => {
        it('round2 should round to 2 decimal places', () => {
            expect(round2(1.234)).toBe(1.23);
            expect(round2(1.235)).toBe(1.24);
            expect(round2(1.999)).toBe(2.00);
            expect(round2(0.005)).toBe(0.01);
        });

        it('roundMoney should round to 4 decimal places', () => {
            expect(roundMoney(1.23456)).toBe(1.2346);
            expect(roundMoney(1.23454)).toBe(1.2345);
            expect(roundMoney(0.00001)).toBe(0.0000);
        });
    });

    describe('Service Catalog', () => {
        it('should have 4 services defined', () => {
            expect(SERVICE_CATALOG).toHaveLength(4);
        });

        it('should have all required service IDs', () => {
            const serviceIds = SERVICE_CATALOG.map(s => s.id);
            expect(serviceIds).toContain('mototaxi');
            expect(serviceIds).toContain('el_pana');
            expect(serviceIds).toContain('el_amigo');
            expect(serviceIds).toContain('full_pana');
        });

        it('all services should have positive base prices', () => {
            SERVICE_CATALOG.forEach(service => {
                expect(service.tarifa_base_neta_usd).toBeGreaterThan(0);
                expect(service.pfs_base_usd).toBeGreaterThan(0);
            });
        });
    });

    describe('calculatePrice', () => {
        it('should calculate correct price for base distance', () => {
            const result = calculatePrice(6, 'mototaxi');
            expect(result.usd).toBe(1.32);
            expect(result.ves).toBeGreaterThan(0);
            expect(result.liquidation).toBeDefined();
        });

        it('should add extra km charges correctly', () => {
            const base = calculatePrice(6, 'mototaxi');
            const extra = calculatePrice(8, 'mototaxi'); // 2 km extra

            const expectedExtra = 2 * 0.535; // pfs_km_adicional_usd
            expect(extra.usd).toBeCloseTo(base.usd + expectedExtra, 2);
        });

        it('should handle different service types', () => {
            const mototaxi = calculatePrice(10, 'mototaxi');
            const elPana = calculatePrice(10, 'el_pana');
            const fullPana = calculatePrice(10, 'full_pana');

            expect(elPana.usd).toBeGreaterThan(mototaxi.usd);
            expect(fullPana.usd).toBeGreaterThan(elPana.usd);
        });
    });

    describe('calculateLiquidation', () => {
        let liquidation: ReturnType<typeof calculateLiquidation>;

        beforeEach(() => {
            liquidation = calculateLiquidation('el_pana', 10);
        });

        it('should include all required sections', () => {
            expect(liquidation.input).toBeDefined();
            expect(liquidation.conductor).toBeDefined();
            expect(liquidation.plataforma).toBeDefined();
            expect(liquidation.seniat).toBeDefined();
            expect(liquidation.meta).toBeDefined();
        });

        it('driver should receive 95% of PFS (before ISLR)', () => {
            const pfs = liquidation.input.pfs_usd;
            const expectedDriverGross = pfs * 0.95;
            expect(liquidation.conductor.pago_bruto_usd).toBeCloseTo(expectedDriverGross, 4);
        });

        it('platform should receive 5% of PFS', () => {
            const pfs = liquidation.input.pfs_usd;
            const expectedPlatformGross = pfs * 0.05;
            expect(liquidation.plataforma.comision_bruta_usd).toBeCloseTo(expectedPlatformGross, 4);
        });

        it('ISLR should be 3% of driver gross payment', () => {
            const driverGross = liquidation.conductor.pago_bruto_usd;
            const expectedISLR = driverGross * 0.03;
            expect(liquidation.conductor.islr_retenido_usd).toBeCloseTo(expectedISLR, 4);
        });

        it('IVA should be 16% of platform net income', () => {
            const platformNet = liquidation.plataforma.ingreso_neto_app_usd;
            const platformGross = liquidation.plataforma.comision_bruta_usd;
            const expectedIVA = platformGross - platformNet;

            // IVA = Gross / 1.16 * 0.16
            expect(liquidation.plataforma.iva_debito_fiscal_usd).toBeCloseTo(expectedIVA, 4);
        });

        it('driver net deposit should be gross minus ISLR', () => {
            const gross = liquidation.conductor.pago_bruto_usd;
            const islr = liquidation.conductor.islr_retenido_usd;
            const expectedNet = gross - islr;
            expect(liquidation.conductor.deposito_neto_usd).toBeCloseTo(expectedNet, 4);
        });

        it('total should balance (PFS = driver net + platform net + IVA + ISLR)', () => {
            const pfs = liquidation.input.pfs_usd;
            const driverNet = liquidation.conductor.deposito_neto_usd;
            const platformNet = liquidation.plataforma.ingreso_neto_app_usd;
            const iva = liquidation.plataforma.iva_debito_fiscal_usd;
            const islr = liquidation.conductor.islr_retenido_usd;

            const total = driverNet + platformNet + iva + islr;
            expect(total).toBeCloseTo(pfs, 2);
            expect(liquidation.meta.valid).toBe(true);
        });

        it('VES amounts should use current BCV rate', () => {
            const pfsVes = liquidation.input.pfs_ves;
            const pfsUsd = liquidation.input.pfs_usd;

            expect(pfsVes).toBeCloseTo(pfsUsd * currentBcvRate, 2);
            expect(liquidation.meta.tasa_bcv).toBe(currentBcvRate);
        });

        it('should handle zero distance correctly', () => {
            const result = calculateLiquidation('mototaxi', 0);
            expect(result.input.pfs_usd).toBeGreaterThan(0); // Should still have base price
            expect(result.meta.valid).toBe(true);
        });

        it('should throw error for invalid service ID', () => {
            expect(() => {
                calculateLiquidation('invalid_service' as ServiceId, 10);
            }).toThrow();
        });
    });

    describe('Edge Cases', () => {
        it('should handle very large distances', () => {
            const result = calculatePrice(1000, 'el_pana');
            expect(result.usd).toBeGreaterThan(0);
            expect(result.liquidation.meta.valid).toBe(true);
        });

        it('should handle fractional distances', () => {
            const result1 = calculatePrice(6.5, 'mototaxi');
            const result2 = calculatePrice(6.9, 'mototaxi');
            expect(result2.usd).toBeGreaterThan(result1.usd);
        });

        it('all monetary values should have max 4 decimal places', () => {
            const liquidation = calculateLiquidation('full_pana', 15.7);

            // Check all monetary fields
            expect(liquidation.conductor.pago_bruto_usd.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(4);
            expect(liquidation.conductor.deposito_neto_usd.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(4);
            expect(liquidation.plataforma.comision_bruta_usd.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(4);
        });
    });

    describe('Financial Consistency', () => {
        it('same distance should always produce same result', () => {
            const result1 = calculateLiquidation('el_amigo', 12);
            const result2 = calculateLiquidation('el_amigo', 12);

            expect(result1.input.pfs_usd).toBe(result2.input.pfs_usd);
            expect(result1.conductor.deposito_neto_usd).toBe(result2.conductor.deposito_neto_usd);
        });

        it('all services should produce valid liquidations', () => {
            const services: ServiceId[] = ['mototaxi', 'el_pana', 'el_amigo', 'full_pana'];

            services.forEach(serviceId => {
                const result = calculateLiquidation(serviceId, 10);
                expect(result.meta.valid).toBe(true);
            });
        });
    });
});
