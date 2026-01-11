import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ShieldCheck, ArrowLeft, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DemoViewBanner: React.FC = () => {
    const { isSuperAdmin, viewAsRole, switchView } = useAuth();
    const navigate = useNavigate();

    if (!isSuperAdmin || !viewAsRole) return null;

    const roleLabels: Record<string, string> = {
        [UserRole.PASSENGER]: 'Pasajero',
        [UserRole.DRIVER]: 'Conductor',
    };

    const handleReturn = () => {
        switchView(null);
        navigate('/admin');
    };

    return (
        <div className="bg-mipana-navy text-white px-4 py-2 flex items-center justify-between shadow-lg sticky top-0 z-[60] border-b border-mipana-gold/30">
            <div className="flex items-center gap-3">
                <div className="bg-mipana-gold/20 p-1.5 rounded-lg border border-mipana-gold/30">
                    <ShieldCheck size={18} className="text-mipana-gold" />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-mipana-gold uppercase tracking-widest leading-none mb-1">Modo Demo Activo</p>
                    <p className="text-xs font-medium flex items-center gap-1.5 text-white/90">
                        Vista actual: <span className="font-bold text-white underline decoration-mipana-gold underline-offset-2">{roleLabels[viewAsRole]}</span>
                        <Info size={12} className="text-white/50" />
                    </p>
                </div>
            </div>

            <button
                onClick={handleReturn}
                className="flex items-center gap-2 bg-mipana-gold hover:bg-mipana-gold/90 text-mipana-navy px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-md active:scale-95"
            >
                <ArrowLeft size={14} />
                Volver al Panel Admin
            </button>
        </div>
    );
};

export default DemoViewBanner;
