// Módulo de Validación de Entradas para Edge Functions
// Utiliza Zod para validación de esquemas

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

// Esquema para recarga de billetera
export const WalletRechargeSchema = z.object({
  amount: z.number().positive().min(1).max(1000000),
  bank_code: z.string().regex(/^\d{4}$/, "Bank code must be 4 digits"),
  last_four_digits: z.string().regex(/^\d{4}$/, "Last four digits must be 4 digits"),
});

// Esquema para consulta de saldo
export const GetBalanceSchema = z.object({
  user_id: z.string().uuid("Invalid user ID format"),
});

// Esquema para verificación de pago
export const VerifyPaymentSchema = z.object({
  reference: z.string().min(4).max(20),
  amount: z.number().positive(),
  bank_code: z.string().regex(/^\d{4}$/),
});

// Esquema para webhook de Bancamiga
export const BancamigaWebhookSchema = z.object({
  reference: z.string(),
  refpk: z.string(),
  phone_orig: z.string(),
  phone_dest: z.string(),
  amount: z.number().positive(),
  bank_orig: z.string(),
  transaction_date: z.string(),
});

// Esquema para sincronización de tasa de cambio
export const ExchangeRateSyncSchema = z.object({
  from_currency: z.enum(["USD", "VES"]),
  to_currency: z.enum(["USD", "VES"]),
  rate: z.number().positive(),
  source: z.string().optional(),
});

// ============================================================================
// FUNCIONES DE VALIDACIÓN
// ============================================================================

/**
 * Valida los datos de entrada contra un esquema Zod
 * @param schema - Esquema Zod para validación
 * @param data - Datos a validar
 * @returns Objeto con resultado de validación
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ["Validation error occurred"] };
  }
}

/**
 * Sanitiza una cadena de texto para prevenir inyección SQL
 * @param input - Cadena de texto a sanitizar
 * @returns Cadena sanitizada
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/['"\\]/g, "") // Eliminar comillas y barras invertidas
    .replace(/[<>]/g, "") // Eliminar caracteres HTML
    .trim();
}

/**
 * Valida que un número de teléfono venezolano sea válido
 * @param phone - Número de teléfono
 * @returns true si es válido, false en caso contrario
 */
export function isValidVenezuelanPhone(phone: string): boolean {
  const phoneRegex = /^(0414|0424|0412|0416|0426)\d{7}$/;
  return phoneRegex.test(phone);
}

/**
 * Valida que un código de banco venezolano sea válido
 * @param bankCode - Código del banco
 * @returns true si es válido, false en caso contrario
 */
export function isValidBankCode(bankCode: string): boolean {
  const validBankCodes = [
    "0102", "0104", "0105", "0108", "0114", "0115", "0116", "0128",
    "0134", "0137", "0138", "0146", "0151", "0156", "0157", "0163",
    "0166", "0168", "0169", "0171", "0172", "0173", "0174", "0175",
    "0177", "0191"
  ];
  return validBankCodes.includes(bankCode);
}

/**
 * Valida que un monto esté dentro de un rango permitido
 * @param amount - Monto a validar
 * @param min - Monto mínimo
 * @param max - Monto máximo
 * @returns true si está dentro del rango, false en caso contrario
 */
export function isValidAmount(amount: number, min: number = 1, max: number = 1000000): boolean {
  return amount >= min && amount <= max && !isNaN(amount) && isFinite(amount);
}

/**
 * Crea una respuesta de error estandarizada
 * @param message - Mensaje de error
 * @param status - Código de estado HTTP
 * @param errors - Lista de errores detallados (opcional)
 * @returns Response con el error
 */
export function createErrorResponse(
  message: string,
  status: number = 400,
  errors?: string[]
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      details: errors,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Crea una respuesta de éxito estandarizada
 * @param data - Datos de respuesta
 * @param message - Mensaje de éxito (opcional)
 * @returns Response con los datos
 */
export function createSuccessResponse<T>(data: T, message?: string): Response {
  return new Response(
    JSON.stringify({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
