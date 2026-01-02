import React from 'react';
import '../styles/StatsCard.css';

export type BorderColor = 'cyan' | 'orange' | 'navy' | 'yellow' | 'green' | 'red';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  borderColor?: BorderColor;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  borderColor = 'cyan',
  trend,
  onClick,
}) => {
  return (
    <div 
      className={`stats-card border-${borderColor} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      <div className="stats-card-header">
        <h3 className="stats-card-title">{title}</h3>
        {icon && <div className="stats-card-icon">{icon}</div>}
      </div>

      <div className="stats-card-body">
        <div className="stats-card-value">{value}</div>
        {subtitle && <div className="stats-card-subtitle">{subtitle}</div>}
      </div>

      {trend && (
        <div className={`stats-card-trend ${trend.isPositive ? 'positive' : 'negative'}`}>
          <span className="trend-icon">{trend.isPositive ? '↑' : '↓'}</span>
          <span className="trend-value">{Math.abs(trend.value)}%</span>
          <span className="trend-label">vs mes anterior</span>
        </div>
      )}
    </div>
  );
};
