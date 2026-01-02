import React, { useState, useEffect } from 'react';
import { Bell, Moon, Sun, Menu } from 'lucide-react';

const ProfessionalHeader: React.FC = () => {
  const [tasa, setTasa] = useState<string>('---');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const fetchTasa = async () => {
      try {
        const response = await fetch('https://dolarapi.com/v1/dolares/oficial');
        const data = await response.json();
        setTasa(data.promedio.toLocaleString('es-VE', { minimumFractionDigits: 2 }));
      } catch (error) {
        console.error('Error fetching tasa:', error);
      }
    };
    fetchTasa();
  }, []);

  return (
    <header className="bg-mipana-navy text-white h-16 flex items-center justify-between px-4 md:px-8 shadow-lg sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
            <span className="text-mipana-navy font-bold text-xs">MP</span>
          </div>
          <span className="font-bold text-lg tracking-tight hidden sm:block">MI PANA APP</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/20">
          <span className="text-xs font-medium text-cyan-400">📈 Tasa BCV:</span>
          <span className="text-sm font-bold">Bs {tasa}</span>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-mipana-orange rounded-full border-2 border-mipana-navy"></span>
          </button>
          <button 
            onClick={() => setIsDark(!isDark)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default ProfessionalHeader;
