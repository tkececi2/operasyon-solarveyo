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
    icon: 'text-blue-600',
    text: 'text-gray-900'
  },
  green: {
    icon: 'text-green-600',
    text: 'text-gray-900'
  },
  yellow: {
    icon: 'text-yellow-600',
    text: 'text-gray-900'
  },
  red: {
    icon: 'text-red-600',
    text: 'text-gray-900'
  }
};

export const KPICards: React.FC<KPICardsProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {data.map((kpi, index) => {
        const Icon = iconMap[kpi.icon];
        const colors = colorMap[kpi.color];
        
        return (
          <Card key={index} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              {/* İkon - Sol tarafta */}
              <div className="flex-shrink-0">
                <Icon className={`w-8 h-8 ${colors.icon}`} />
              </div>
              
              {/* İçerik - Sağ tarafta */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 mb-1">
                  {kpi.title}
                </p>
                <div className="flex items-baseline gap-1">
                  <p className={`text-2xl font-bold ${colors.text}`}>
                    {typeof kpi.value === 'number' 
                      ? kpi.value.toLocaleString('tr-TR') 
                      : kpi.value
                    }
                  </p>
                  {kpi.unit && (
                    <span className="text-xs text-gray-500 font-normal">
                      {kpi.unit}
                    </span>
                  )}
                </div>
                
                {kpi.change !== undefined && kpi.change !== 0 && (
                  <div className="flex items-center mt-1.5 gap-1">
                    {kpi.changeType === 'increase' ? (
                      <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                    ) : kpi.changeType === 'decrease' ? (
                      <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                    ) : null}
                    <span className={`text-xs font-medium ${
                      kpi.changeType === 'increase' 
                        ? 'text-green-600' 
                        : kpi.changeType === 'decrease'
                        ? 'text-red-600'
                        : 'text-gray-500'
                    }`}>
                      {kpi.change > 0 ? '+' : ''}{kpi.change.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
