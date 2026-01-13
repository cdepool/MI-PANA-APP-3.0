
import { DriverProfile, DriverDocument, AuditChange, VerificationStatus } from '../types';
import { authService } from './authService';
import { supabase } from './supabaseClient';

// Helper: Sleep (optional, can be removed if real network is fast enough, but good for UI loading states)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- DEFAULT PROFILE GENERATOR ---

// --- PUBLIC SERVICE ---

export const driverService = {

    // 1. Get Full Profile
    getProfile: async (userId: string): Promise<DriverProfile | null> => {
        // Try to fetch from 'driver_profiles' table
        const { data, error } = await supabase
            .from('driver_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
            console.error('Error fetching driver profile:', error);
        }

        if (data) {
            // Parse JSON fields if Supabase returns them as strings (depending on client config)
            // Usually Supabase JS client parses JSON automatically.
            return data as DriverProfile;
        }

        // Return null if not found
        return null;
    },

    // 2. Update Specific Section
    updateSection: async (userId: string, section: keyof DriverProfile, data: any): Promise<{ success: boolean, message: string, requiresApproval: boolean }> => {

        // Fetch current profile to manage audit logs
        const { data: currentProfile, error: fetchError } = await supabase
            .from('driver_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (fetchError || !currentProfile) throw new Error('Perfil no encontrado');

        // Validation Logic (Mock logic kept for frontend validation)
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
            oldValue: currentProfile[section],
            newValue: data,
            timestamp: new Date(),
            status: 'PENDING'
        };

        // Critical sections require approval
        const criticalSections = ['fiscalData', 'bankingData', 'vehicle'];
        const requiresApproval = criticalSections.includes(section);

        let updateData: any = {};
        let auditLog = currentProfile.auditLog || [];
        let pendingChanges = currentProfile.pendingChanges || [];

        if (requiresApproval) {
            pendingChanges.push(auditEntry);
            updateData = { pendingChanges };

            // We don't update the actual section data yet
            const { error } = await supabase
                .from('driver_profiles')
                .update(updateData)
                .eq('user_id', userId);

            if (error) throw new Error(error.message);

            return { success: true, message: 'Cambios enviados a revisión.', requiresApproval: true };
        } else {
            // Auto-approve non-critical
            auditEntry.status = 'APPROVED';
            auditLog.push(auditEntry);

            updateData = {
                [section]: data,
                auditLog
            };

            const { error } = await supabase
                .from('driver_profiles')
                .update(updateData)
                .eq('user_id', userId);

            if (error) throw new Error(error.message);

            return { success: true, message: 'Perfil actualizado correctamente.', requiresApproval: false };
        }
    },

    // 3. Upload Document
    uploadDocument: async (userId: string, type: DriverDocument['type'], file: File): Promise<DriverDocument> => {

        const fileName = `${userId}/${type}-${Date.now()}.${file.name.split('.').pop()}`;

        const { data, error } = await supabase.storage
            .from('driver-documents')
            .upload(fileName, file);

        if (error) throw new Error(error.message);

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('driver-documents')
            .getPublicUrl(fileName);

        const newDoc: DriverDocument = {
            id: `doc-${Date.now()}`,
            type,
            url: publicUrl,
            uploadedAt: new Date(),
            status: 'PENDING',
            metadata: {
                fileSize: file.size,
                mimeType: file.type
            }
        };

        // Add to profile documents list
        const { data: profile } = await supabase
            .from('driver_profiles')
            .select('documents')
            .eq('user_id', userId)
            .single();

        const currentDocs = profile?.documents || [];
        const updatedDocs = [...currentDocs, newDoc];

        const { error: updateError } = await supabase
            .from('driver_profiles')
            .update({ documents: updatedDocs })
            .eq('user_id', userId);

        if (updateError) throw new Error(updateError.message);

        return newDoc;
    },

    // 4. Get Pending Changes
    getPendingChanges: async (userId: string): Promise<AuditChange[]> => {
        const { data, error } = await supabase
            .from('driver_profiles')
            .select('pendingChanges')
            .eq('user_id', userId)
            .single();

        if (error) return [];
        return data?.pendingChanges || [];
    }
};
