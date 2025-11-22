import React, { useEffect, useState } from 'react';
import { User, DriverProfile } from '../types';
import { authService } from '../services/authService';
import { driverService } from '../services/driverService';
import { ProfileSectionCard } from '../components/conductor/ProfileSectionCard';
import { PhotoUploadModal } from '../components/conductor/PhotoUploadModal';
import { DocumentUploadZone } from '../components/conductor/DocumentUploadZone';
import { BankingVerificationFlow } from '../components/conductor/BankingVerificationFlow';
import { PendingChangesNotification } from '../components/conductor/PendingChangesNotification';
import { User as UserIcon, Car, CreditCard, FileText, Shield, Camera, ArrowLeft } from 'lucide-react';

const ConductorProfile: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<DriverProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [editingSection, setEditingSection] = useState<string | null>(null);
    const [showPhotoModal, setShowPhotoModal] = useState(false);

    // Form States
    const [personalForm, setPersonalForm] = useState<any>({});
    const [vehicleForm, setVehicleForm] = useState<any>({});
    const [fiscalForm, setFiscalForm] = useState<any>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const currentUser = authService.getSession();
            if (!currentUser) return; // Handle redirect in real app
            setUser(currentUser);

            const driverProfile = await driverService.getProfile(currentUser.id);
            setProfile(driverProfile);

            // Init forms
            setPersonalForm(driverProfile.personalData);
            setVehicleForm(driverProfile.vehicle);
            setFiscalForm(driverProfile.fiscalData || { rif: '', address: '', fiscalStatus: 'PERSONA_NATURAL' });

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (section: keyof DriverProfile, data: any) => {
        if (!user) return;
        setLoading(true);
        try {
            const result = await driverService.updateSection(user.id, section, data);
            alert(result.message);
            setEditingSection(null);
            await loadData(); // Reload to see changes/pending status
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (file: File) => {
        if (!user) return;
        // In a real app, this would upload to S3 and get a URL
        // For mock, we just update the user avatar in authService
        const fakeUrl = URL.createObjectURL(file);
        await authService.updateUser(user.id, { avatarUrl: fakeUrl });
        await loadData();
    };

    if (loading && !profile) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50">Cargando perfil...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#022859] to-[#035E9F] text-white pt-12 pb-24 px-6 relative">
                <button onClick={() => window.history.back()} className="absolute top-6 left-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
                    <ArrowLeft size={20} />
                </button>

                <div className="flex flex-col items-center">
                    <div className="relative group">
                        <img
                            src={user?.avatarUrl || 'https://via.placeholder.com/150'}
                            alt="Profile"
                            className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                        />
                        <button
                            onClick={() => setShowPhotoModal(true)}
                            className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full text-white shadow-md hover:bg-blue-600 transition"
                        >
                            <Camera size={16} />
                        </button>
                    </div>
                    <h1 className="text-2xl font-bold mt-4">{profile?.personalData.fullName}</h1>
                    <p className="text-blue-100">{profile?.vehicle.model} • {profile?.vehicle.plate}</p>

                    <div className="flex gap-4 mt-4">
                        <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm text-center">
                            <span className="block text-xl font-bold">4.9</span>
                            <span className="text-xs text-blue-200">Calificación</span>
                        </div>
                        <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm text-center">
                            <span className="block text-xl font-bold">142</span>
                            <span className="text-xs text-blue-200">Viajes</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 -mt-16 relative z-10">

                <PendingChangesNotification changes={profile?.pendingChanges || []} />

                {/* 1. Personal Data */}
                <ProfileSectionCard
                    title="Datos Personales"
                    icon={<UserIcon size={20} />}
                    isEditing={editingSection === 'personalData'}
                    onEdit={() => setEditingSection('personalData')}
                    onCancel={() => setEditingSection(null)}
                    onSave={() => handleSave('personalData', personalForm)}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 font-bold uppercase">Nombre Completo</label>
                            <input
                                disabled={editingSection !== 'personalData'}
                                value={personalForm.fullName}
                                onChange={e => setPersonalForm({ ...personalForm, fullName: e.target.value })}
                                className="w-full p-2 border rounded-lg bg-gray-50 disabled:bg-transparent disabled:border-none disabled:p-0 disabled:font-semibold disabled:text-gray-800"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-bold uppercase">Teléfono</label>
                            <input
                                disabled={editingSection !== 'personalData'}
                                value={personalForm.phone}
                                onChange={e => setPersonalForm({ ...personalForm, phone: e.target.value })}
                                className="w-full p-2 border rounded-lg bg-gray-50 disabled:bg-transparent disabled:border-none disabled:p-0 disabled:font-semibold disabled:text-gray-800"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs text-gray-500 font-bold uppercase">Dirección</label>
                            <textarea
                                disabled={editingSection !== 'personalData'}
                                value={personalForm.address}
                                onChange={e => setPersonalForm({ ...personalForm, address: e.target.value })}
                                className="w-full p-2 border rounded-lg bg-gray-50 disabled:bg-transparent disabled:border-none disabled:p-0 disabled:font-semibold disabled:text-gray-800 resize-none"
                            />
                        </div>
                    </div>
                </ProfileSectionCard>

                {/* 2. Vehicle Data */}
                <ProfileSectionCard
                    title="Datos del Vehículo"
                    icon={<Car size={20} />}
                    isEditing={editingSection === 'vehicle'}
                    onEdit={() => setEditingSection('vehicle')}
                    onCancel={() => setEditingSection(null)}
                    onSave={() => handleSave('vehicle', vehicleForm)}
                    pendingChanges={profile?.pendingChanges.some(c => c.field === 'vehicle')}
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 font-bold uppercase">Marca</label>
                            <input
                                disabled={editingSection !== 'vehicle'}
                                value={vehicleForm.brand}
                                onChange={e => setVehicleForm({ ...vehicleForm, brand: e.target.value })}
                                className="w-full p-2 border rounded-lg bg-gray-50 disabled:bg-transparent disabled:border-none disabled:p-0 disabled:font-semibold disabled:text-gray-800"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-bold uppercase">Modelo</label>
                            <input
                                disabled={editingSection !== 'vehicle'}
                                value={vehicleForm.model}
                                onChange={e => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                                className="w-full p-2 border rounded-lg bg-gray-50 disabled:bg-transparent disabled:border-none disabled:p-0 disabled:font-semibold disabled:text-gray-800"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-bold uppercase">Placa</label>
                            <input
                                disabled={editingSection !== 'vehicle'}
                                value={vehicleForm.plate}
                                onChange={e => setVehicleForm({ ...vehicleForm, plate: e.target.value })}
                                className="w-full p-2 border rounded-lg bg-gray-50 disabled:bg-transparent disabled:border-none disabled:p-0 disabled:font-semibold disabled:text-gray-800"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-bold uppercase">Color</label>
                            <input
                                disabled={editingSection !== 'vehicle'}
                                value={vehicleForm.color}
                                onChange={e => setVehicleForm({ ...vehicleForm, color: e.target.value })}
                                className="w-full p-2 border rounded-lg bg-gray-50 disabled:bg-transparent disabled:border-none disabled:p-0 disabled:font-semibold disabled:text-gray-800"
                            />
                        </div>

                        {editingSection === 'vehicle' && (
                            <div className="col-span-2 mt-4">
                                <h4 className="font-bold text-sm mb-2">Documentos del Vehículo</h4>
                                <DocumentUploadZone
                                    label="Título de Propiedad"
                                    onFileSelect={(f) => console.log(f)}
                                />
                            </div>
                        )}
                    </div>
                </ProfileSectionCard>

                {/* 3. Fiscal Data */}
                <ProfileSectionCard
                    title="Información Fiscal"
                    icon={<FileText size={20} />}
                    isEditing={editingSection === 'fiscalData'}
                    onEdit={() => setEditingSection('fiscalData')}
                    onCancel={() => setEditingSection(null)}
                    onSave={() => handleSave('fiscalData', fiscalForm)}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 font-bold uppercase">RIF</label>
                            <input
                                disabled={editingSection !== 'fiscalData'}
                                value={fiscalForm.rif}
                                onChange={e => setFiscalForm({ ...fiscalForm, rif: e.target.value })}
                                placeholder="V-12345678-9"
                                className="w-full p-2 border rounded-lg bg-gray-50 disabled:bg-transparent disabled:border-none disabled:p-0 disabled:font-semibold disabled:text-gray-800"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-bold uppercase">Dirección Fiscal</label>
                            <input
                                disabled={editingSection !== 'fiscalData'}
                                value={fiscalForm.address}
                                onChange={e => setFiscalForm({ ...fiscalForm, address: e.target.value })}
                                className="w-full p-2 border rounded-lg bg-gray-50 disabled:bg-transparent disabled:border-none disabled:p-0 disabled:font-semibold disabled:text-gray-800"
                            />
                        </div>

                        {editingSection === 'fiscalData' && (
                            <DocumentUploadZone
                                label="Copia del RIF Digital"
                                onFileSelect={(f) => console.log(f)}
                            />
                        )}
                    </div>
                </ProfileSectionCard>

                {/* 4. Banking Data */}
                <ProfileSectionCard
                    title="Datos Bancarios"
                    icon={<CreditCard size={20} />}
                    isEditing={editingSection === 'bankingData'}
                    onEdit={() => setEditingSection('bankingData')}
                    onCancel={() => setEditingSection(null)}
                    onSave={() => { }} // Handled by inner flow
                >
                    {editingSection === 'bankingData' ? (
                        <BankingVerificationFlow
                            onCancel={() => setEditingSection(null)}
                            onComplete={(data) => handleSave('bankingData', {
                                ...data,
                                bankName: 'BANCAMIGA',
                                accountType: 'CORRIENTE',
                                isVerified: true
                            })}
                        />
                    ) : (
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Banco</span>
                                <span className="font-semibold">Bancamiga</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Cuenta</span>
                                <span className="font-mono">{profile?.bankingData?.accountNumber ? `•••• ${profile.bankingData.accountNumber.slice(-4)}` : 'No registrada'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Pago Móvil</span>
                                <span className="font-mono">{profile?.bankingData?.pagoMovilPhone || 'No registrado'}</span>
                            </div>
                        </div>
                    )}
                </ProfileSectionCard>

            </div>

            <PhotoUploadModal
                isOpen={showPhotoModal}
                onClose={() => setShowPhotoModal(false)}
                onUpload={handlePhotoUpload}
                currentPhotoUrl={user?.avatarUrl}
            />
        </div>
    );
};

export default ConductorProfile;
