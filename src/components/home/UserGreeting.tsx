import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';

export function UserGreeting() {
    const { user, logout } = useAuth();
    const userName = user?.name?.split(' ')[0] || "Pana";

    return (
        <header className="px-4 pt-4 pb-2 flex justify-between items-start">
            <h1 className="text-2xl font-bold text-gray-900">
                Hola {userName},
                <br />
                <span className="text-gray-500 text-lg font-normal">¿Qué vamos a hacer?</span>
            </h1>
            <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-full shadow-sm border border-gray-100"
                aria-label="Cerrar sesión"
            >
                <LogOut size={20} />
            </button>
        </header>
    );
}
