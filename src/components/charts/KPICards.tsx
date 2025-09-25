import React from 'react';
import { TrendingUp, TrendingDown, Zap, DollarSign, Leaf, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/Card';

interface KPIData {
  title: string;
  value: string | number;
  unit?: string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: 'power' | 'money' | 'eco' | 'alert';
  color: 'blue' | 'green' | 'yellow' | 'red';
}

interface KPICardsProps {
  data: KPIData[];
}

const iconMap = {
  power: Zap,
  money: DollarSign,
  eco: Leaf,
  alert: AlertTriangle
};

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    text: 'text-blue-900'
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    text: 'text-green-900'
  },
  yellow: {
    bg: 'bg-yellow-50',
    icon: 'text-yellow-600',
    text: 'text-yellow-900'
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    text: 'text-red-900'
  }
};

export const KPICards: React.FC<KPICardsProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {data.map((kpi, index) => {
        const Icon = iconMap[kpi.icon];
        const colors = colorMap[kpi.color];
        
        return (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {kpi.title}
                </p>
                <div className="flex items-baseline">
                  <p className={`text-2xl font-semibold ${colors.text}`}>
                    {typeof kpi.value === 'number' 
                      ? kpi.value.toLocaleString('tr-TR') 
                      : kpi.value
                    }
                  </p>
                  {kpi.unit && (
                    <span className="ml-2 text-sm text-gray-500">
                      {kpi.unit}
                    </span>
                  )}
                </div>
                
                {kpi.change !== undefined && kpi.change !== 0 && (
                  <div className="flex items-center mt-2">
                    {kpi.changeType === 'increase' ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : kpi.changeType === 'decrease' ? (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    ) : null}
                    <span className={`text-sm ${
                      kpi.changeType === 'increase' 
                        ? 'text-green-600' 
                        : kpi.changeType === 'decrease'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}>
                      {kpi.change > 0 ? '+' : ''}{kpi.change.toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      önceki döneme göre
                    </span>
                  </div>
                )}
              </div>
              
              <div className={`p-3 rounded-lg ${colors.bg}`}>
                <Icon className={`w-6 h-6 ${colors.icon}`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
