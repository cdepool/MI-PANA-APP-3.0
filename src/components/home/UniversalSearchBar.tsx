import { Search } from 'lucide-react';

export function UniversalSearchBar() {
    return (
        <div className="px-4 mb-6">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 shadow-sm text-sm"
                    placeholder="¿Qué necesitas hoy?"
                    disabled={false} // Todo: connect to logic
                />
            </div>
        </div>
    );
}
