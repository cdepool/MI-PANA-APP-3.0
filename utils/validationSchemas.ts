import { z } from 'zod';

// --- PIN VALIDATION ---

export const pinSchema = z.string()
    .length(4, 'El PIN debe tener exactamente 4 dígitos')
    .regex(/^\d{4}$/, 'El PIN debe contener solo números')
    .refine((pin) => {
        // Check for sequential patterns (1234, 4321)
        const isSequential = (str: string) => {
            const digits = str.split('').map(Number);
            const ascending = digits.every((d, i) => i === 0 || d === digits[i - 1] + 1);
            const descending = digits.every((d, i) => i === 0 || d === digits[i - 1] - 1);
            return ascending || descending;
        };
        return !isSequential(pin);
    }, 'El PIN no puede ser secuencial (ej: 1234, 4321)')
    .refine((pin) => {
        // Check for repetitive patterns (1111, 2222)
        return !/^(\d)\1{3}$/.test(pin);
    }, 'El PIN no puede tener todos los dígitos iguales');

export const pinChangeSchema = z.object({
    currentPin: pinSchema,
    newPin: pinSchema,
    confirmPin: z.string(),
}).refine((data) => data.newPin === data.confirmPin, {
    message: 'Los PINs no coinciden',
    path: ['confirmPin'],
}).refine((data) => data.currentPin !== data.newPin, {
    message: 'El nuevo PIN debe ser diferente al actual',
    path: ['newPin'],
});

// --- PERSONAL DATA VALIDATION ---

export const personalDataSchema = z.object({
    fullName: z.string()
        .min(5, 'El nombre debe tener al menos 5 caracteres')
        .max(255, 'El nombre no puede exceder 255 caracteres')
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),

    birthDate: z.date()
        .optional()
        .refine((date) => {
            if (!date) return true;
            const age = Math.floor((Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
            return age >= 18 && age <= 100;
        }, 'Debes tener entre 18 y 100 años'),

    gender: z.enum(['MASCULINO', 'FEMENINO', 'OTRO', 'PREFIERO_NO_DECIRLO']).optional(),

    nationality: z.enum(['VENEZOLANO', 'EXTRANJERO']).optional(),

    cedula: z.string()
        .regex(/^[VEJ]-\d{6,9}$/, 'Formato de cédula inválido (ej: V-12345678)'),

    address: z.string()
        .min(10, 'La dirección debe tener al menos 10 caracteres')
        .max(500, 'La dirección no puede exceder 500 caracteres')
        .optional(),
});

// --- PHOTO VALIDATION ---

export const photoUploadSchema = z.object({
    file: z.instanceof(File)
        .refine((file) => file.size <= 5 * 1024 * 1024, 'El archivo no puede exceder 5MB')
        .refine(
            (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
            'Solo se permiten imágenes JPG, PNG o WebP'
        ),

    cropData: z.object({
        x: z.number().min(0),
        y: z.number().min(0),
        width: z.number().min(50),
        height: z.number().min(50),
        rotation: z.number().min(0).max(360).optional(),
    }).optional(),
});

// --- PREFERENCES VALIDATION ---

export const travelPreferencesSchema = z.object({
    preferredVehicleType: z.enum(['MOTO', 'CAR', 'FREIGHT']).optional(),

    preferredTime: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),

    requireHighRating: z.boolean().default(false),

    minDriverRating: z.number()
        .min(0, 'La calificación mínima debe ser al menos 0')
        .max(5, 'La calificación máxima es 5.0')
        .default(4.0),

    preferFemaleDriver: z.boolean().default(false),

    preferConversationalDriver: z.boolean().default(false),

    musicPreference: z.enum([
        'NINGUNA',
        'SUAVE',
        'VARIADA',
        'REGGAETON',
        'SALSA',
        'POP',
        'ROCK'
    ]).optional(),

    temperaturePreference: z.number()
        .min(16, 'La temperatura mínima es 16°C')
        .max(28, 'La temperatura máxima es 28°C')
        .optional(),
});

// --- CONTACT VALIDATION ---

export const phoneSchema = z.string()
    .regex(/^\+58\s?(412|414|424|416|426)\s?\d{7}$/, 'Formato de teléfono venezolano inválido (ej: +58 412 1234567)');

export const emailSchema = z.string()
    .email('Email inválido')
    .min(5, 'El email debe tener al menos 5 caracteres')
    .max(255, 'El email no puede exceder 255 caracteres');

// --- VALIDATION HELPERS ---

export type PinValidation = z.infer<typeof pinSchema>;
export type PinChangeValidation = z.infer<typeof pinChangeSchema>;
export type PersonalDataValidation = z.infer<typeof personalDataSchema>;
export type PhotoUploadValidation = z.infer<typeof photoUploadSchema>;
export type TravelPreferencesValidation = z.infer<typeof travelPreferencesSchema>;

// Utility function to validate and return errors
export const validateWithSchema = <T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    errors?: Record<string, string>;
} => {
    try {
        const result = schema.parse(data);
        return { success: true, data: result };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errors: Record<string, string> = {};
            error.errors.forEach((err) => {
                const path = err.path.join('.');
                errors[path] = err.message;
            });
            return { success: false, errors };
        }
        return { success: false, errors: { _general: 'Error de validación desconocido' } };
    }
};
