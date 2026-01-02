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
  Refpk: string;
  NroReferencia: string;
  NroReferenciaCorto: string;
  Amount: string;
  PhoneOrig: string;
  PhoneDest: string;
  BancoOrig: string;
  BancoDest: string;
  FechaMovimiento: string;
  HoraMovimiento: string;
}

export interface BancamigaSearchResponse {
  Code: number;
  Data: {
    payments: BancamigaPayment[];
  };
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

    const response = await fetch(`${this.config.host}/public/auth/security/users/token/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.refreshToken}`,
      },
      body: JSON.stringify({
        Dni: this.config.dni,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Update internal config
    this.config.accessToken = data.token;
    this.config.refreshToken = data.refresToken;
    this.config.tokenExpires = data.expireDate;

    return data;
  }

  /**
   * Check if token is expired or about to expire
   */
  isTokenExpired(): boolean {
    if (!this.config.tokenExpires) {
      return true;
    }

    const now = Date.now();
    const expiresIn = this.config.tokenExpires - now;
    
    // Consider expired if less than 5 minutes remaining
    return expiresIn < 5 * 60 * 1000;
  }

  /**
   * Ensure valid access token (refresh if needed)
   */
  async ensureValidToken(): Promise<void> {
    if (this.isTokenExpired()) {
      console.log('[Bancamiga] Token expired, refreshing...');
      await this.refreshAccessToken();
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

    const response = await fetch(`${this.config.host}/public/p2p/movements/mobile/find`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.accessToken}`,
      },
      body: JSON.stringify({
        PhoneOrig: params.phoneOrig,
        BancoOrig: params.bancoOrig,
        FechaMovimiento: params.fechaMovimiento,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to search payments: ${response.statusText}`);
    }

    const data: BancamigaSearchResponse = await response.json();

    if (data.Code !== 200) {
      throw new Error(`Bancamiga API error: ${data.Code}`);
    }

    return data.Data?.payments || [];
  }

  /**
   * Get payment history for a date range
   */
  async getPaymentHistory(params: {
    fechaInicio: string; // YYYY-MM-DD
    fechaFin: string; // YYYY-MM-DD
  }): Promise<BancamigaPayment[]> {
    await this.ensureValidToken();

    const response = await fetch(`${this.config.host}/public/p2p/movements/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.accessToken}`,
      },
      body: JSON.stringify({
        FechaInicio: params.fechaInicio,
        FechaFin: params.fechaFin,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get payment history: ${response.statusText}`);
    }

    const data: BancamigaSearchResponse = await response.json();

    if (data.Code !== 200) {
      throw new Error(`Bancamiga API error: ${data.Code}`);
    }

    return data.Data?.payments || [];
  }

  /**
   * Find a specific payment by reference digits
   */
  async findPaymentByReference(params: {
    phoneOrig: string;
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
          bancoOrig: '0172',
          fechaMovimiento: dateStr,
        });

        // Filter by reference digits
        const matchingPayments = payments.filter((payment) => {
          const refMatch = payment.NroReferencia.endsWith(params.referenceDigits) ||
                          payment.NroReferenciaCorto.endsWith(params.referenceDigits);
          
          if (!refMatch) return false;

          // If expected amount is provided, validate it
          if (params.expectedAmount) {
            const paymentAmount = parseFloat(payment.Amount);
            const tolerance = 0.01; // Allow 1 cent difference
            return Math.abs(paymentAmount - params.expectedAmount) <= tolerance;
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
    dni: Deno.env.get('BANCAMIGA_DNI') || '',
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
