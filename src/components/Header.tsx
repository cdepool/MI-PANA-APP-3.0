import React, { useState, useEffect } from 'react';
import { Bell, Moon, Sun, Menu } from 'lucide-react';
import '../styles/Header.css';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

interface ExchangeRate {
  rate: number;
  source: string;
  lastUpdate: string;
  isFresh: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onMenuClick }) => {
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch exchange rate using new service
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const { fetchBcvRateWithFallback } = await import('../services/exchangeRateService');
        const { rate, source, isFresh } = await fetchBcvRateWithFallback();

        setExchangeRate({
          rate,
          source,
          isFresh,
          lastUpdate: new Date().toLocaleTimeString('es-VE', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
        setLoading(false);
      }
    };

    fetchExchangeRate();
    // Update every 5 minutes
    const interval = setInterval(fetchExchangeRate, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Left section: Logo and menu */}
        <div className="header-left">
          <button className="menu-button" onClick={onMenuClick} aria-label="Menu">
            <Menu size={24} />
          </button>

          <div className="logo-container">
            <img
              src="/logo-mipana.png"
              alt="MI PANA"
              className="logo"
              onError={(e) => {
                // Fallback if logo doesn't exist
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="logo-text hidden">
              <span className="logo-title">MI PANA</span>
            </div>
          </div>
        </div>

        {/* Center section: Title (optional) */}
        {title && (
          <div className="header-center">
            <h1 className="header-title">{title}</h1>
            {subtitle && <p className="header-subtitle">{subtitle}</p>}
          </div>
        )}

        {/* Right section: Exchange rate, notifications, and dark mode */}
        <div className="header-right">
          {/* Exchange Rate Display */}
          <div className="exchange-rate">
            <span className="exchange-rate-icon">{exchangeRate && !exchangeRate.isFresh ? '⚠️' : '📈'}</span>
            <span className="exchange-rate-label">Tasa BCV:</span>
            {loading ? (
              <span className="exchange-rate-value loading">...</span>
            ) : exchangeRate ? (
              <>
                <span className="exchange-rate-value" style={!exchangeRate.isFresh ? { color: '#FFA500' } : {}}>
                  Bs {exchangeRate.rate.toFixed(2)}
                </span>
                {!exchangeRate.isFresh && (
                  <span className="text-xs text-orange-500 ml-1" title="Datos desactualizados">⚠️</span>
                )}
              </>
            ) : (
              <span className="exchange-rate-value error">N/A</span>
            )}
          </div>

          {/* Notifications */}
          <button className="icon-button" aria-label="Notifications">
            <Bell size={20} />
            <span className="notification-badge">3</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            className="icon-button"
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      {/* Exchange Rate Bar (Mobile) */}
      <div className="exchange-rate-bar-mobile">
        <span className="exchange-rate-icon">📈</span>
        <span className="exchange-rate-label">Tasa BCV:</span>
        {loading ? (
          <span className="exchange-rate-value loading">Cargando...</span>
        ) : exchangeRate ? (
          <span className="exchange-rate-value">
            Bs {exchangeRate.rate.toFixed(2)}
          </span>
        ) : (
          <span className="exchange-rate-value error">No disponible</span>
        )}
      </div>
    </header>
  );
};
