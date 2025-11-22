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

// LocalStorage Keys
const DB_PASSENGER_PROFILES_KEY = 'mipana_passenger_profiles';
const DB_ACCESS_LOGS_KEY = 'mipana_access_logs';
const DB_DEVICES_KEY = 'mipana_devices';
const DB_PROFILE_CHANGES_KEY = 'mipana_profile_changes';

// Helper: Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- DATABASE HELPERS ---

const getPassengerProfiles = (): PassengerProfile[] => {
    try {
        const stored = localStorage.getItem(DB_PASSENGER_PROFILES_KEY);
        return stored ? JSON.parse(stored, (key, value) => {
            // Parse dates
            if (key === 'birthDate' || key === 'uploadedAt' || key === 'createdAt' || key === 'updatedAt' || key === 'lastPasswordChange') {
                return value ? new Date(value) : undefined;
            }
            return value;
        }) : [];
    } catch {
        return [];
    }
};

const savePassengerProfiles = (profiles: PassengerProfile[]) => {
    localStorage.setItem(DB_PASSENGER_PROFILES_KEY, JSON.stringify(profiles));
};

const getAccessLogs = (): AccessLog[] => {
    try {
        const stored = localStorage.getItem(DB_ACCESS_LOGS_KEY);
        return stored ? JSON.parse(stored, (key, value) => {
            if (key === 'timestamp') return new Date(value);
            return value;
        }) : [];
    } catch {
        return [];
    }
};

const saveAccessLogs = (logs: AccessLog[]) => {
    // Keep only last 100 logs per user
    const trimmedLogs = logs.slice(-100);
    localStorage.setItem(DB_ACCESS_LOGS_KEY, JSON.stringify(trimmedLogs));
};

const getDevices = (): DeviceInfo[] => {
    try {
        const stored = localStorage.getItem(DB_DEVICES_KEY);
        return stored ? JSON.parse(stored, (key, value) => {
            if (key === 'lastAccessAt') return new Date(value);
            return value;
        }) : [];
    } catch {
        return [];
    }
};

const saveDevices = (devices: DeviceInfo[]) => {
    localStorage.setItem(DB_DEVICES_KEY, JSON.stringify(devices));
};

const getProfileChanges = (): ProfileChange[] => {
    try {
        const stored = localStorage.getItem(DB_PROFILE_CHANGES_KEY);
        return stored ? JSON.parse(stored, (key, value) => {
            if (key === 'timestamp') return new Date(value);
            return value;
        }) : [];
    } catch {
        return [];
    }
};

const saveProfileChanges = (changes: ProfileChange[]) => {
    // Keep only last 50 changes per user
    const trimmedChanges = changes.slice(-50);
    localStorage.setItem(DB_PROFILE_CHANGES_KEY, JSON.stringify(trimmedChanges));
};

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

// --- PUBLIC SERVICE ---

export const passengerService = {

    /**
     * Get or create passenger profile
     */
    getProfile: async (userId: string): Promise<PassengerProfile | null> => {
        await delay(300);
        const profiles = getPassengerProfiles();
        return profiles.find(p => p.userId === userId) || null;
    },

    /**
     * Create initial passenger profile
     */
    createProfile: async (
        userId: string,
        initialData: Partial<PersonalData>
    ): Promise<PassengerProfile> => {
        await delay(500);
        const profiles = getPassengerProfiles();

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

        profiles.push(newProfile);
        savePassengerProfiles(profiles);

        return newProfile;
    },

    /**
     * Update personal data
     */
    updatePersonalData: async (
        userId: string,
        data: Partial<PersonalData>
    ): Promise<PassengerProfile> => {
        await delay(600);
        const profiles = getPassengerProfiles();
        const index = profiles.findIndex(p => p.userId === userId);

        if (index === -1) throw new Error('Perfil no encontrado');

        const oldData = { ...profiles[index].personalData };

        profiles[index].personalData = {
            ...profiles[index].personalData,
            ...data,
        };
        profiles[index].updatedAt = new Date();
        profiles[index].profileCompleteness = calculateCompleteness(profiles[index]);

        savePassengerProfiles(profiles);

        // Log change
        await passengerService.logProfileChange(
            userId,
            'PERSONAL_DATA',
            'personalData',
            oldData,
            profiles[index].personalData
        );

        return profiles[index];
    },

    /**
     * Upload and process profile photo
     */
    uploadPhoto: async (userId: string, file: File): Promise<PhotoProfile> => {
        await delay(1000); // Simulate upload time

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

        const profiles = getPassengerProfiles();
        const index = profiles.findIndex(p => p.userId === userId);

        if (index === -1) throw new Error('Perfil no encontrado');

        const photoProfile: PhotoProfile = {
            url: mainPhoto.dataUrl,
            thumbnailUrl: thumbnail,
            verified: true, // Auto-verify if face detected
            uploadedAt: new Date(),
            fileSize: mainPhoto.sizeBytes,
        };

        profiles[index].photoProfile = photoProfile;
        profiles[index].updatedAt = new Date();
        profiles[index].profileCompleteness = calculateCompleteness(profiles[index]);

        savePassengerProfiles(profiles);

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
        await delay(400);
        const profiles = getPassengerProfiles();
        const index = profiles.findIndex(p => p.userId === userId);

        if (index === -1) throw new Error('Perfil no encontrado');

        const oldPreferences = profiles[index].preferences;

        profiles[index].preferences = preferences;
        profiles[index].updatedAt = new Date();

        savePassengerProfiles(profiles);

        // Log change
        await passengerService.logProfileChange(
            userId,
            'PREFERENCES',
            'preferences',
            oldPreferences,
            preferences
        );

        return profiles[index];
    },

    /**
     * Get travel preferences
     */
    getPreferences: async (userId: string): Promise<TravelPreferences | null> => {
        await delay(200);
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
        const logs = getAccessLogs();
        const deviceInfo = getDeviceInfo();

        const log: AccessLog = {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId,
            timestamp: new Date(),
            ipAddress: '192.168.***.***', // Masked for privacy in localStorage
            userAgent: navigator.userAgent,
            browser: deviceInfo.browser,
            device: deviceInfo.deviceType,
            os: deviceInfo.os,
            location: 'Caracas, Venezuela', // Mock location
            accessType,
            success,
            failureReason,
        };

        logs.push(log);
        saveAccessLogs(logs);
    },

    /**
     * Get access history
     */
    getAccessHistory: async (
        userId: string,
        limit: number = 20
    ): Promise<AccessLog[]> => {
        await delay(300);
        const logs = getAccessLogs();
        return logs
            .filter(log => log.userId === userId)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    },

    /**
     * Register or update current device
     */
    registerDevice: async (userId: string): Promise<DeviceInfo> => {
        const devices = getDevices();
        const deviceInfo = getDeviceInfo();

        // Generate device ID based on user agent
        const deviceId = btoa(navigator.userAgent).substr(0, 32);

        const existingIndex = devices.findIndex(
            d => d.userId === userId && d.deviceId === deviceId
        );

        const deviceData: DeviceInfo = {
            id: existingIndex >= 0 ? devices[existingIndex].id : `dev-${Date.now()}`,
            userId,
            deviceId,
            deviceName: `${deviceInfo.browser} on ${deviceInfo.os}`,
            deviceType: deviceInfo.deviceType,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            ipAddress: '192.168.***.***',
            location: 'Caracas, Venezuela',
            lastAccessAt: new Date(),
            isActive: true,
            sessionToken: `token-${Date.now()}`,
        };

        if (existingIndex >= 0) {
            devices[existingIndex] = deviceData;
        } else {
            devices.push(deviceData);
        }

        saveDevices(devices);
        return deviceData;
    },

    /**
     * Get connected devices
     */
    getDevices: async (userId: string): Promise<DeviceInfo[]> => {
        await delay(250);
        const devices = getDevices();
        return devices.filter(d => d.userId === userId && d.isActive);
    },

    /**
     * Disconnect device
     */
    disconnectDevice: async (userId: string, deviceId: string): Promise<void> => {
        await delay(400);
        const devices = getDevices();
        const index = devices.findIndex(
            d => d.userId === userId && d.id === deviceId
        );

        if (index >= 0) {
            devices[index].isActive = false;
            saveDevices(devices);
        }
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
        const changes = getProfileChanges();

        const change: ProfileChange = {
            id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

        changes.push(change);
        saveProfileChanges(changes);
    },

    /**
     * Get profile change history
     */
    getProfileChanges: async (
        userId: string,
        limit: number = 20
    ): Promise<ProfileChange[]> => {
        await delay(300);
        const changes = getProfileChanges();
        return changes
            .filter(c => c.userId === userId)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    },
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
