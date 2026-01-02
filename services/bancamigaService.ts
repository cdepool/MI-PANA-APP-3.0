import { supabase } from './supabaseClient';
import logger from '../utils/logger';

export interface PaymentVerificationResult {
  success: boolean;
  message: string;
  transactionId?: string;
  amountVes?: number;
}

export const bancamigaService = {
  /**
   * Verifica un pago móvil contra la API de Bancamiga vía Supabase Edge Function
   */
  async verifyPayment(
    phone: string,
    idNumber: string,
    amountVes: number,
    reference: string,
    walletId: string
  ): Promise<PaymentVerificationResult> {
    try {
      logger.log(`Iniciando verificación de pago: Ref ${reference}, Monto ${amountVes} Bs`);

      // Llamada a la Edge Function de Supabase
      const { data, error } = await supabase.functions.invoke('bancamiga-verify-payment', {
        body: {
          phone,
          idNumber,
          amountVes,
          reference,
          walletId
        }
      });

      if (error) {
        logger.error("Error invocando función de verificación", error);
        return {
          success: false,
          message: "Error técnico al conectar con el servicio de pagos."
        };
      }

      return {
        success: data.success,
        message: data.message,
        transactionId: data.transactionId,
        amountVes: data.amountVes
      };
    } catch (error) {
      logger.error("Error en bancamigaService.verifyPayment", error);
      return {
        success: false,
        message: "Ocurrió un error inesperado al procesar tu pago."
      };
    }
  },

  /**
   * Obtiene los datos bancarios oficiales para mostrar al usuario
   */
  getOfficialPaymentData() {
    return {
      bankName: "Bancamiga (0272)",
      phone: "0414-5274111",
      idNumber: "J-40724274-1",
      holder: "Next TV C.A."
    };
  }
};
