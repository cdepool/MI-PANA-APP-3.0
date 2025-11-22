import { DriverProfile, DriverDocument, AuditChange, VerificationStatus } from '../types';
import { authService } from './authService';

// LocalStorage Keys
const DB_PROFILES_KEY = 'mipana_db_profiles';

// Helper: Sleep
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- MOCK DATABASE ACCESS ---

const getDbProfiles = (): Record<string, DriverProfile> => {
    try {
        const stored = localStorage.getItem(DB_PROFILES_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (e) {
        return {};
    }
};

const saveDbProfiles = (profiles: Record<string, DriverProfile>) => {
    localStorage.setItem(DB_PROFILES_KEY, JSON.stringify(profiles));
};

// --- DEFAULT PROFILE GENERATOR ---

const generateDefaultProfile = (userId: string, user: any): DriverProfile => {
    return {
        userId,
        personalData: {
            fullName: user.name || 'Conductor Nuevo',
            birthDate: new Date('1990-01-01'),
            nationality: 'VENEZOLANO',
            address: 'Dirección no registrada',
            phone: user.phone || ''
        },
        vehicle: {
            model: user.vehicle?.model || 'Modelo no registrado',
            color: user.vehicle?.color || 'Color no registrado',
            plate: user.vehicle?.plate || 'SIN-PLACA',
            brand: 'Marca Genérica',
            year: 2020,
            serviceType: 'mototaxi',
            documents: []
        },
        documents: [],
        auditLog: [],
        pendingChanges: []
    };
};

// --- PUBLIC SERVICE ---

export const driverService = {

    // 1. Get Full Profile
    getProfile: async (userId: string): Promise<DriverProfile> => {
        await delay(800);
        const profiles = getDbProfiles();

        if (!profiles[userId]) {
            // Create default if not exists
            const user = authService.getSession(); // Get basic info from session
            profiles[userId] = generateDefaultProfile(userId, user || {});
            saveDbProfiles(profiles);
        }

        return profiles[userId];
    },

    // 2. Update Specific Section
    updateSection: async (userId: string, section: keyof DriverProfile, data: any): Promise<{ success: boolean, message: string, requiresApproval: boolean }> => {
        await delay(1000);
        const profiles = getDbProfiles();
        const profile = profiles[userId];

        if (!profile) throw new Error('Perfil no encontrado');

        // Validation Logic (Mock)
        if (section === 'fiscalData') {
            if (!data.rif || !data.rif.match(/^[JVEG]-\d{7,8}-\d$/)) {
                throw new Error('Formato de RIF inválido (Ej: V-12345678-0)');
            }
        }

        if (section === 'bankingData') {
            if (data.accountNumber.length !== 20) {
                throw new Error('El número de cuenta debe tener 20 dígitos');
            }
        }

        // Create Audit Log
        const changeId = `chg-${Date.now()}`;
        const auditEntry: AuditChange = {
            id: changeId,
            field: section,
            oldValue: profile[section],
            newValue: data,
            timestamp: new Date(),
            status: 'PENDING'
        };

        // Critical sections require approval
        const criticalSections = ['fiscalData', 'bankingData', 'vehicle'];
        const requiresApproval = criticalSections.includes(section);

        if (requiresApproval) {
            profile.pendingChanges.push(auditEntry);
            saveDbProfiles(profiles);
            return { success: true, message: 'Cambios enviados a revisión.', requiresApproval: true };
        } else {
            // Auto-approve non-critical
            auditEntry.status = 'APPROVED';
            profile.auditLog.push(auditEntry);

            // Update actual data
            (profile as any)[section] = data;

            saveDbProfiles(profiles);
            return { success: true, message: 'Perfil actualizado correctamente.', requiresApproval: false };
        }
    },

    // 3. Upload Document
    uploadDocument: async (userId: string, type: DriverDocument['type'], file: File): Promise<DriverDocument> => {
        await delay(2000); // Simulate upload time

        // Create fake URL (in real app, this is S3/Cloud Storage)
        const fakeUrl = URL.createObjectURL(file);

        const newDoc: DriverDocument = {
            id: `doc-${Date.now()}`,
            type,
            url: fakeUrl,
            uploadedAt: new Date(),
            status: 'PENDING',
            metadata: {
                fileSize: file.size,
                mimeType: file.type
            }
        };

        const profiles = getDbProfiles();
        if (profiles[userId]) {
            profiles[userId].documents.push(newDoc);
            saveDbProfiles(profiles);
        }

        return newDoc;
    },

    // 4. Get Pending Changes
    getPendingChanges: async (userId: string): Promise<AuditChange[]> => {
        await delay(500);
        const profiles = getDbProfiles();
        return profiles[userId]?.pendingChanges || [];
    }
};
