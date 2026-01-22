// BANCAMIGA Service - MI PANA APP
// Servicio para integración con API de BANCAMIGA

import { createClient } from '@supabase/supabase-js';

interface BancamigaConfig {
    host: string;
    accessToken: string;
    refreshToken: string;
    tokenExpires: number;
    dni: string;
}

interface PaymentMobile {
    ID: string;
    created_at: string;
    update_at: string;
    Dni: string;
    PhoneDest: string;
    PhoneOrig: string;
    Amount: number;
    BancoOrig: string;
    NroReferenciaCorto: string;
    NroReferencia: string;
    HoraMovimiento: string;
    FechaMovimiento: string;
    Descripcion: string;
    Status: string;
    Refpk: string;
    Ref: number;
}

interface BancamigaResponse {
    code: number;
    mensaje?: string;
    mod?: string;
    lista?: PaymentMobile[];
    num?: number;
    token?: string;
    refresToken?: string;
    expireDate?: number;
}

export class BancamigaService {
    private config: BancamigaConfig;

    constructor() {
        this.config = {
            host: import.meta.env.VITE_BANCAMIGA_HOST || 'https://adminp2p.sitca-ve.com',
            accessToken: import.meta.env.VITE_BANCAMIGA_ACCESS_TOKEN || '',
            refreshToken: import.meta.env.VITE_BANCAMIGA_REFRESH_TOKEN || '',
            tokenExpires: parseInt(import.meta.env.VITE_BANCAMIGA_TOKEN_EXPIRES || '0'),
            dni: import.meta.env.VITE_BANCAMIGA_DNI || 'J40724274',
        };
    }

    /**
     * 1. HEALTH CHECK
     * Verifica el estado del servicio de BANCAMIGA
     */
    async healthCheck(): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const response = await fetch(`${this.config.host}/healthcheck`, {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('❌ Health check failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 2. RENOVAR TOKENS
     * Genera nuevos ACCESS_TOKEN y REFRESH_TOKEN
     */
    async refreshTokens(): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const response = await fetch(`${this.config.host}/public/re/refresh`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refresh_token: this.config.refreshToken,
                }),
            });

            const data: BancamigaResponse = await response.json();

            if (data.code !== 200) {
                throw new Error(data.mensaje || 'Error renovando tokens');
            }

            // Actualizar tokens en memoria
            this.config.accessToken = data.token!;
            this.config.refreshToken = data.refresToken!;
            this.config.tokenExpires = data.expireDate!;

            console.log('✅ Tokens renovados exitosamente');
            return {
                success: true,
                data: {
                    accessToken: data.token,
                    refreshToken: data.refresToken,
                    expiresAt: new Date(data.expireDate! * 1000),
                },
            };
        } catch (error) {
            console.error('❌ Error renovando tokens:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 3. BUSCAR PAGOS MÓVIL (MÁS IMPORTANTE)
     * Busca pagos de un teléfono, banco y fecha específicos
     */
    async findPaymentMobile(
        phoneOrig: string,
        bankOrig: string,
        date: string
    ): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            if (!phoneOrig || !bankOrig || !date) {
                throw new Error('Faltan parámetros: phoneOrig, bankOrig, date');
            }

            const response = await fetch(`${this.config.host}/public/protected/pm/find`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Phone: phoneOrig,
                    Bank: bankOrig,
                    Date: date,
                }),
            });

            const data: BancamigaResponse = await response.json();

            if (data.code !== 200) {
                console.warn('⚠️ Respuesta con código diferente a 200:', data);
            }

            console.log(`✅ Encontrados ${data.num || 0} pagos`);
            return {
                success: true,
                data: {
                    totalPayments: data.num || 0,
                    payments: data.lista || [],
                    raw: data,
                },
            };
        } catch (error) {
            console.error('❌ Error buscando pagos móvil:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 4. HISTORIAL DE PAGOS (MÁXIMO 1 VEZ CADA 10 MIN)
     * Busca TODOS los pagos recibidos en una fecha
     */
    async findPaymentHistory(date: string): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            if (!date) {
                throw new Error('Date es requerida (YYYY-MM-DD)');
            }

            const response = await fetch(`${this.config.host}/public/protected/pm/history/find`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Date: date,
                }),
            });

            const data: BancamigaResponse = await response.json();

            if (data.code !== 200) {
                console.warn('⚠️ Respuesta con código diferente a 200:', data);
            }

            console.log(`✅ Historial: ${data.num || 0} pagos encontrados`);
            return {
                success: true,
                data: {
                    totalPayments: data.num || 0,
                    payments: data.lista || [],
                    raw: data,
                },
            };
        } catch (error) {
            console.error('❌ Error buscando historial:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 5. VALIDAR SI TOKEN EXPIRA PRONTO
     */
    isTokenExpiringSoon(daysBeforeExpire: number = 30): boolean {
        const now = Math.floor(Date.now() / 1000);
        const expiresIn = this.config.tokenExpires - now;
        const secondsInDays = daysBeforeExpire * 24 * 60 * 60;

        const expires = expiresIn < secondsInDays;

        if (expires) {
            console.warn(`⚠️ Token expirará en menos de ${daysBeforeExpire} días`);
        }

        return expires;
    }

    /**
     * 6. OBTENER INFORMACIÓN DE EXPIRACIÓN
     */
    getTokenInfo() {
        const now = Math.floor(Date.now() / 1000);
        const expiresIn = this.config.tokenExpires - now;
        const daysRemaining = Math.floor(expiresIn / (24 * 60 * 60));

        return {
            expiresAt: new Date(this.config.tokenExpires * 1000),
            expiresInDays: daysRemaining,
            expiresInSeconds: expiresIn,
            needsRenewal: daysRemaining < 30,
        };
    }
}

export const bancamigaService = new BancamigaService();
