// Bancamiga API Client
// Shared module for Edge Functions

export interface BancamigaConfig {
  host: string;
  dni: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpires?: number;
}

export interface BancamigaPayment {
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

export interface BancamigaResponse {
  code: number;
  mensaje?: string;
  mod?: string;
  lista?: BancamigaPayment[];
  num?: number;
  token?: string;
  refresToken?: string;
  expireDate?: number;
}

export class BancamigaClient {
  private config: BancamigaConfig;

  constructor(config: BancamigaConfig) {
    this.config = config;
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.host}/healthcheck`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      console.error('[Bancamiga] Health check failed:', error);
      return false;
    }
  }

  /**
   * Generate new access and refresh tokens
   */
  async generateTokens(password: string): Promise<{
    token: string;
    refresToken: string;
    expireDate: number;
  }> {
    const response = await fetch(`${this.config.host}/public/auth/security/users/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.accessToken || ''}`,
      },
      body: JSON.stringify({
        Dni: this.config.dni,
        Pass: password,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate tokens: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<{
    token: string;
    refresToken: string;
    expireDate: number;
  }> {
    if (!this.config.refreshToken) {
      throw new Error('Refresh token not available');
    }

    const response = await fetch(`${this.config.host}/public/re/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.accessToken}`,
      },
      body: JSON.stringify({
        refresh_token: this.config.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    const data: BancamigaResponse = await response.json();

    if (data.code !== 200) {
      throw new Error(`Bancamiga Refresh Error: ${data.mensaje}`);
    }

    // Update internal config
    this.config.accessToken = data.token!;
    this.config.refreshToken = data.refresToken!;
    this.config.tokenExpires = data.expireDate!;

    return {
      token: data.token!,
      refresToken: data.refresToken!,
      expireDate: data.expireDate!,
    };
  }

  /**
   * Check if token is expired or about to expire
   */
  isTokenExpired(): boolean {
    if (!this.config.tokenExpires) {
      return true;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const expiresIn = this.config.tokenExpires - nowSeconds;

    // Consider expired if less than 5 minutes remaining
    return expiresIn < 5 * 60;
  }

  /**
   * Ensure valid access token (refresh if needed, re-authenticate as fallback)
   */
  async ensureValidToken(): Promise<void> {
    if (this.isTokenExpired()) {
      console.log('[Bancamiga] Token expired, attempting refresh...');
      try {
        await this.refreshAccessToken();
        console.log('[Bancamiga] Token refreshed successfully');
      } catch (refreshError) {
        console.error('[Bancamiga] Refresh token failed:', refreshError);
        console.log('[Bancamiga] Attempting re-authentication with password...');

        const password = Deno.env.get('BANCAMIGA_PASSWORD');
        if (password) {
          try {
            const newTokens = await this.generateTokens(password);
            this.config.accessToken = newTokens.token;
            this.config.refreshToken = newTokens.refresToken;
            this.config.tokenExpires = newTokens.expireDate;
            console.log('[Bancamiga] Re-authentication successful, new tokens acquired');
          } catch (authError) {
            console.error('[Bancamiga] Re-authentication failed:', authError);
            throw new Error('BANCAMIGA_AUTH_EXPIRED: No se pudo renovar el token de autenticación bancaria. Contacta a soporte técnico.');
          }
        } else {
          console.warn('[Bancamiga] No BANCAMIGA_PASSWORD configured for fallback authentication');
          throw new Error('BANCAMIGA_TOKEN_EXPIRED: Token de acceso expirado y no hay método de renovación configurado.');
        }
      }
    }
  }

  /**
   * Search for mobile payments by phone and bank
   */
  async searchPayments(params: {
    phoneOrig: string;
    bancoOrig: string;
    fechaMovimiento: string; // YYYY-MM-DD
  }): Promise<BancamigaPayment[]> {
    await this.ensureValidToken();

    // Ensure phone is in format 58XXXXXXXXXX
    let cleanPhone = params.phoneOrig.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '58' + cleanPhone;
    if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) cleanPhone = '58' + cleanPhone.substring(1);

    console.log(`[Bancamiga] Fetching: ${this.config.host}/public/protected/pm/find`);
    const response = await fetch(`${this.config.host}/public/protected/pm/find`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.accessToken}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'es-VE,es;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      body: JSON.stringify({
        Phone: cleanPhone,
        Bank: params.bancoOrig,
        Date: params.fechaMovimiento,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[Bancamiga] Search failed with status ${response.status}. Body:`, errorBody.substring(0, 500));
      throw new Error(`Failed to search payments: ${response.statusText} ${errorBody.substring(0, 100)}`);
    }

    const data: BancamigaResponse = await response.json();
    console.log(`[Bancamiga] API Response: code=${data.code}, items=${data.lista?.length || 0}`);

    if (data.code !== 200) {
      console.warn(`[Bancamiga] searchPayments returned code ${data.code}: ${data.mensaje}`);
      return [];
    }

    if (data.lista && data.lista.length > 0) {
      console.log(`[Bancamiga] Found ${data.lista.length} payments:`, data.lista.map(p => ({ ref: p.NroReferencia, amount: p.Amount, status: p.Status })));
    }

    return data.lista || [];
  }

  /**
   * Get payment history for a specific date
   */
  async getPaymentHistory(params: {
    date: string; // YYYY-MM-DD
  }): Promise<BancamigaPayment[]> {
    await this.ensureValidToken();

    console.log(`[Bancamiga] Fetching: ${this.config.host}/public/protected/pm/history/find`);
    const response = await fetch(`${this.config.host}/public/protected/pm/history/find`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.accessToken}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        Date: params.date,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get payment history: ${response.statusText}`);
    }

    const data: BancamigaResponse = await response.json();

    if (data.code !== 200) {
      console.warn(`[Bancamiga] getPaymentHistory returned code ${data.code}: ${data.mensaje}`);
      return [];
    }

    return data.lista || [];
  }

  /**
   * Find a specific payment by reference digits
   */
  async findPaymentByReference(params: {
    phoneOrig: string;
    bancoOrig: string;
    referenceDigits: string;
    expectedAmount?: number;
    dateRange?: number; // days to search back (default: 1)
  }): Promise<BancamigaPayment | null> {
    const daysToSearch = params.dateRange || 1;
    const today = new Date();

    // Search backwards from today
    for (let i = 0; i < daysToSearch; i++) {
      const searchDate = new Date(today);
      searchDate.setDate(searchDate.getDate() - i);

      const dateStr = searchDate.toISOString().split('T')[0];

      try {
        const payments = await this.searchPayments({
          phoneOrig: params.phoneOrig,
          bancoOrig: params.bancoOrig,
          fechaMovimiento: dateStr,
        });

        // Filter by reference digits
        console.log(`[Bancamiga] Filtering ${payments.length} payments for digits: ${params.referenceDigits} and amount: ${params.expectedAmount}`);
        const matchingPayments = payments.filter((payment) => {
          const refFull = String(payment.NroReferencia);
          const refShort = String(payment.NroReferenciaCorto);

          const refMatch = refFull.endsWith(params.referenceDigits) ||
            refShort.endsWith(params.referenceDigits);

          console.log(`[Bancamiga] Checking payment: ref=${refFull}, short=${refShort}, match=${refMatch}`);

          if (!refMatch) return false;

          // If expected amount is provided, validate it
          if (params.expectedAmount) {
            const paymentAmount = parseFloat(String(payment.Amount).replace(',', '.'));
            const tolerance = 0.01; // Allow 1 cent difference
            const amountMatch = Math.abs(paymentAmount - params.expectedAmount) <= tolerance;
            console.log(`[Bancamiga] Amount check: payment=${paymentAmount}, expected=${params.expectedAmount}, match=${amountMatch}`);
            return amountMatch;
          }

          return true;
        });

        if (matchingPayments.length > 0) {
          // Return the most recent match
          return matchingPayments[0];
        }
      } catch (error) {
        console.error(`[Bancamiga] Error searching payments for ${dateStr}:`, error);
      }
    }

    return null;
  }
}

/**
 * Create Bancamiga client from environment variables
 */
export function createBancamigaClient(): BancamigaClient {
  const config: BancamigaConfig = {
    host: Deno.env.get('BANCAMIGA_HOST') || 'https://adminp2p.sitca-ve.com',
    dni: Deno.env.get('BANCAMIGA_DNI') || 'J40724274',
    accessToken: Deno.env.get('BANCAMIGA_ACCESS_TOKEN'),
    refreshToken: Deno.env.get('BANCAMIGA_REFRESH_TOKEN'),
    tokenExpires: Deno.env.get('BANCAMIGA_TOKEN_EXPIRES')
      ? parseInt(Deno.env.get('BANCAMIGA_TOKEN_EXPIRES')!)
      : undefined,
  };

  if (!config.dni) {
    throw new Error('BANCAMIGA_DNI environment variable is required');
  }

  return new BancamigaClient(config);
}
