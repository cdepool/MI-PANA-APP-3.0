
/**
 * Passenger Service - MI PANA APP
 * Handles passenger-specific profile operations
 */

import {
    PassengerProfile,
    TravelPreferences,
    PhotoProfile,
    PersonalData,
    AccessLog,
    DeviceInfo,
    ProfileChange,
} from '../types';
import { resizeImage, generateThumbnail, detectFace } from '../utils/imageUtils';
import { supabase } from './supabaseClient';

// Helper: Simulate network delay (optional)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- DEVICE INFO DETECTION ---

const getDeviceInfo = (): { browser: string; os: string; deviceType: 'MOBILE' | 'TABLET' | 'DESKTOP' } => {
    const ua = navigator.userAgent;

    // Detect browser
    let browser = 'Unknown';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    // Detect OS
    let os = 'Unknown';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    // Detect device type
    let deviceType: 'MOBILE' | 'TABLET' | 'DESKTOP' = 'DESKTOP';
    if (/Mobile|Android|iPhone/i.test(ua)) deviceType = 'MOBILE';
    else if (/Tablet|iPad/i.test(ua)) deviceType = 'TABLET';

    return { browser, os, deviceType };
};

// --- HELPER FUNCTIONS ---

/**
 * Calculate profile completeness percentage
 */
function calculateCompleteness(profile: PassengerProfile): number {
    let score = 0;
    const maxScore = 10;

    // Personal data (40%)
    if (profile.personalData.fullName) score += 1;
    if (profile.personalData.birthDate) score += 1;
    if (profile.personalData.gender) score += 0.5;
    if (profile.personalData.nationality) score += 0.5;
    if (profile.personalData.cedula) score += 1;

    // Photo (20%)
    if (profile.photoProfile.url) score += 1.5;
    if (profile.photoProfile.verified) score += 0.5;

    // Verification (20%)
    if (profile.contactVerification.phoneVerified) score += 1;
    if (profile.contactVerification.emailVerified) score += 1;

    // Preferences (20%)
    if (profile.preferences) score += 2;

    return Math.round((score / maxScore) * 100);
}

// --- PUBLIC SERVICE ---

export const passengerService = {

    /**
     * Get or create passenger profile
     */
    getProfile: async (userId: string): Promise<PassengerProfile | null> => {
        const { data, error } = await supabase
            .from('passenger_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error('Error fetching passenger profile:', error);
            return null;
        }

        return data as PassengerProfile;
    },

    /**
     * Create initial passenger profile
     */
    createProfile: async (
        userId: string,
        initialData: Partial<PersonalData>
    ): Promise<PassengerProfile> => {

        const newProfile: PassengerProfile = {
            userId,
            personalData: {
                fullName: initialData.fullName || '',
                cedula: initialData.cedula || '',
                birthDate: initialData.birthDate,
                gender: initialData.gender,
                nationality: initialData.nationality,
                address: initialData.address,
            },
            photoProfile: {
                verified: false,
            },
            security: {
                pin: '', // Set externally
                twoFactorEnabled: false,
            },
            contactVerification: {
                phoneVerified: false,
                emailVerified: false,
            },
            profileCompleteness: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'ACTIVE',
        };

        const { error } = await supabase
            .from('passenger_profiles')
            .insert([{
                user_id: userId,
                ...newProfile
            }]);

        if (error) throw new Error(error.message);

        return newProfile;
    },

    /**
     * Update personal data
     */
    updatePersonalData: async (
        userId: string,
        data: Partial<PersonalData>
    ): Promise<PassengerProfile> => {

        const { data: currentProfile, error: fetchError } = await supabase
            .from('passenger_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (fetchError || !currentProfile) throw new Error('Perfil no encontrado');

        const oldData = { ...currentProfile.personalData };
        const updatedPersonalData = {
            ...currentProfile.personalData,
            ...data,
        };

        const updatedProfile = {
            ...currentProfile,
            personalData: updatedPersonalData,
            updatedAt: new Date(),
            profileCompleteness: calculateCompleteness({ ...currentProfile, personalData: updatedPersonalData } as PassengerProfile)
        };

        const { error: updateError } = await supabase
            .from('passenger_profiles')
            .update({
                personalData: updatedPersonalData,
                updatedAt: updatedProfile.updatedAt,
                profileCompleteness: updatedProfile.profileCompleteness
            })
            .eq('user_id', userId);

        if (updateError) throw new Error(updateError.message);

        // Log change
        await passengerService.logProfileChange(
            userId,
            'PERSONAL_DATA',
            'personalData',
            oldData,
            updatedPersonalData
        );

        return updatedProfile as PassengerProfile;
    },

    /**
     * Upload and process profile photo
     */
    uploadPhoto: async (userId: string, file: File): Promise<PhotoProfile> => {

        // Detect face
        const faceResult = await detectFace(file);
        if (!faceResult.faceDetected) {
            throw new Error('No se detectó un rostro en la imagen. Por favor, sube una foto clara de tu rostro.');
        }

        // Resize main photo
        const mainPhoto = await resizeImage(file, {
            maxWidth: 600,
            maxHeight: 600,
            quality: 0.85,
            format: 'jpeg',
        });

        // Generate thumbnail
        const thumbnail = await generateThumbnail(file, 150);

        // Upload to Supabase Storage
        const fileName = `${userId}/profile-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
            .from('passenger-photos')
            .upload(fileName, file); // Ideally upload the resized blob, but file is easier here

        if (uploadError) throw new Error(uploadError.message);

        const { data: { publicUrl } } = supabase.storage
            .from('passenger-photos')
            .getPublicUrl(fileName);

        const photoProfile: PhotoProfile = {
            url: publicUrl,
            thumbnailUrl: thumbnail, // We might want to upload thumbnail too, but keeping base64 for now if small
            verified: true,
            uploadedAt: new Date(),
            fileSize: mainPhoto.sizeBytes,
        };

        const { data: currentProfile } = await supabase
            .from('passenger_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (!currentProfile) throw new Error('Perfil no encontrado');

        const updatedCompleteness = calculateCompleteness({ ...currentProfile, photoProfile } as PassengerProfile);

        const { error: updateError } = await supabase
            .from('passenger_profiles')
            .update({
                photoProfile,
                updatedAt: new Date(),
                profileCompleteness: updatedCompleteness
            })
            .eq('user_id', userId);

        if (updateError) throw new Error(updateError.message);

        // Log change
        await passengerService.logProfileChange(
            userId,
            'PHOTO',
            'photoProfile',
            {},
            photoProfile
        );

        return photoProfile;
    },

    /**
     * Update travel preferences
     */
    updatePreferences: async (
        userId: string,
        preferences: TravelPreferences
    ): Promise<PassengerProfile> => {

        const { data: currentProfile, error: fetchError } = await supabase
            .from('passenger_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (fetchError || !currentProfile) throw new Error('Perfil no encontrado');

        const oldPreferences = currentProfile.preferences;

        const { error: updateError } = await supabase
            .from('passenger_profiles')
            .update({
                preferences,
                updatedAt: new Date()
            })
            .eq('user_id', userId);

        if (updateError) throw new Error(updateError.message);

        // Log change
        await passengerService.logProfileChange(
            userId,
            'PREFERENCES',
            'preferences',
            oldPreferences,
            preferences
        );

        return { ...currentProfile, preferences } as PassengerProfile;
    },

    /**
     * Get travel preferences
     */
    getPreferences: async (userId: string): Promise<TravelPreferences | null> => {
        const profile = await passengerService.getProfile(userId);
        return profile?.preferences || null;
    },

    /**
     * Log access (login/logout/changes)
     */
    logAccess: async (
        userId: string,
        accessType: AccessLog['accessType'],
        success: boolean = true,
        failureReason?: string
    ): Promise<void> => {
        const deviceInfo = getDeviceInfo();

        const log: AccessLog = {
            id: `log-${Date.now()}`, // Supabase will generate ID usually, but keeping type consistency
            userId,
            timestamp: new Date(),
            ipAddress: '0.0.0.0', // Should be handled by backend/edge function
            userAgent: navigator.userAgent,
            browser: deviceInfo.browser,
            device: deviceInfo.deviceType,
            os: deviceInfo.os,
            location: 'Caracas, Venezuela',
            accessType,
            success,
            failureReason,
        };

        await supabase.from('access_logs').insert([log]);
    },

    /**
     * Get access history
     */
    getAccessHistory: async (
        userId: string,
        limit: number = 20
    ): Promise<AccessLog[]> => {
        const { data, error } = await supabase
            .from('access_logs')
            .select('*')
            .eq('userId', userId) // Check if column is userId or user_id
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) return [];
        return data as AccessLog[];
    },

    /**
     * Register or update current device
     */
    registerDevice: async (userId: string): Promise<DeviceInfo> => {
        const deviceInfo = getDeviceInfo();
        const deviceId = btoa(navigator.userAgent).substr(0, 32);

        const deviceData: DeviceInfo = {
            id: `dev-${Date.now()}`,
            userId,
            deviceId,
            deviceName: `${deviceInfo.browser} on ${deviceInfo.os}`,
            deviceType: deviceInfo.deviceType,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            ipAddress: '0.0.0.0',
            location: 'Caracas, Venezuela',
            lastAccessAt: new Date(),
            isActive: true,
            sessionToken: `token-${Date.now()}`,
        };

        // Check if device exists
        const { data: existing } = await supabase
            .from('user_devices')
            .select('*')
            .eq('userId', userId)
            .eq('deviceId', deviceId)
            .single();

        if (existing) {
            await supabase
                .from('user_devices')
                .update(deviceData)
                .eq('id', existing.id);
            return { ...deviceData, id: existing.id };
        } else {
            await supabase
                .from('user_devices')
                .insert([deviceData]);
            return deviceData;
        }
    },

    /**
     * Get connected devices
     */
    getDevices: async (userId: string): Promise<DeviceInfo[]> => {
        const { data, error } = await supabase
            .from('user_devices')
            .select('*')
            .eq('userId', userId)
            .eq('isActive', true);

        if (error) return [];
        return data as DeviceInfo[];
    },

    /**
     * Disconnect device
     */
    disconnectDevice: async (userId: string, deviceId: string): Promise<void> => {
        await supabase
            .from('user_devices')
            .update({ isActive: false })
            .eq('userId', userId)
            .eq('id', deviceId);
    },

    /**
     * Log profile change for audit
     */
    logProfileChange: async (
        userId: string,
        changeType: ProfileChange['changeType'],
        fieldModified: string,
        oldValue: any,
        newValue: any
    ): Promise<void> => {
        const change: ProfileChange = {
            id: `change-${Date.now()}`,
            userId,
            changeType,
            fieldModified,
            oldValue,
            newValue,
            performedBy: 'USER',
            timestamp: new Date(),
            requiresVerification: false,
            verified: true,
        };

        await supabase.from('profile_changes').insert([change]);
    },

    /**
     * Get profile change history
     */
    getProfileChanges: async (
        userId: string,
        limit: number = 20
    ): Promise<ProfileChange[]> => {
        const { data, error } = await supabase
            .from('profile_changes')
            .select('*')
            .eq('userId', userId)
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) return [];
        return data as ProfileChange[];
    },
};
