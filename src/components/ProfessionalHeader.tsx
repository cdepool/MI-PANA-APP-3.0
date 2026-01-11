import React, { useState, useEffect } from 'react';
import { Bell, Moon, Sun, Menu } from 'lucide-react';

interface ProfessionalHeaderProps {
  onMenuClick?: () => void;
}

const ProfessionalHeader: React.FC<ProfessionalHeaderProps> = ({ onMenuClick }) => {
  const [tasa, setTasa] = useState<string>('---');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const fetchTasa = async () => {
      try {
        const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        const data = await response.json();
        setTasa(data.promedio.toLocaleString('es-VE', { minimumFractionDigits: 2 }));
      } catch (error) {
        console.error('Error fetching tasa:', error);
      }
    };
    fetchTasa();
  }, []);

  return (
    <header className="bg-mipana-navy text-white h-16 flex items-center justify-between px-3 md:px-8 shadow-lg sticky top-0 z-50">
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={onMenuClick}
          className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors shrink-0"
        >
          <Menu size={22} className="md:w-6 md:h-6" />
        </button>
        <div className="flex items-center shrink-0">
          <img src="/logo-app.png" alt="Mi Pana App" className="h-8 md:h-10 w-auto" />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        <div className="flex items-center gap-1.5 md:gap-2 bg-white/10 px-2.5 md:px-4 py-1.5 rounded-full border border-white/20 whitespace-nowrap">
          <span className="text-[10px] md:text-xs font-medium text-cyan-400">📈 BCV:</span>
          <span className="text-xs md:text-sm font-bold">Bs {tasa}</span>
        </div>

        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <button className="p-1.5 md:p-2 hover:bg-white/10 rounded-full transition-colors relative">
            <Bell size={18} className="md:w-5 md:h-5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 md:w-2 h-1.5 md:h-2 bg-mipana-orange rounded-full border border-mipana-navy"></span>
          </button>
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-1.5 md:p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            {isDark ? <Sun size={18} className="md:w-5 md:h-5" /> : <Moon size={18} className="md:w-5 md:h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default ProfessionalHeader;
