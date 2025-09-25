import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card } from '../ui/Card';

interface FaultStatusData {
  name: string;
  value: number;
  color: string;
}

interface FaultStatusChartProps {
  data: FaultStatusData[];
  title?: string;
  height?: number;
  compact?: boolean;
}

const COLORS = {
  'Açık': '#ef4444',
  'Devam Ediyor': '#f59e0b',
  'Beklemede': '#6b7280',
  'Çözüldü': '#10b981'
};

export const FaultStatusChart: React.FC<FaultStatusChartProps> = ({ 
  data, 
  title = "Arıza Durumu",
  height = 300,
  compact = false
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card padding="sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      
      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={compact ? 48 : 60}
              outerRadius={compact ? 80 : 100}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.name as keyof typeof COLORS] || '#6b7280'} 
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [
                `${value} arıza`,
                ''
              ]}
            />
            {!compact && (
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color }}>
                    {value} ({entry.payload?.value || 0})
                  </span>
                )}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>

      {!compact && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{total}</div>
            <div className="text-sm text-gray-600">Toplam Arıza</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {data.filter(d => d.name !== 'Çözüldü').reduce((sum, d) => sum + d.value, 0)}
            </div>
            <div className="text-sm text-gray-600">Aktif Arıza</div>
          </div>
        </div>
      )}

      {!compact && (
        <div className="mt-4 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: COLORS[item.name as keyof typeof COLORS] || '#6b7280' }}
                ></div>
                <span className="text-gray-700">{item.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">{item.value}</span>
                <span className="text-gray-500">
                  ({total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
