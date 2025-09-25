import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/Card';

interface ProductionData {
  date: string;
  production: number;
  target?: number;
}

interface ProductionChartProps {
  data: ProductionData[];
  title?: string;
  height?: number;
}

export const ProductionChart: React.FC<ProductionChartProps> = ({ 
  data, 
  title = "Üretim Grafiği",
  height = 300 
}) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('tr-TR', { 
                  month: 'short', 
                  day: 'numeric' 
                });
              }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value} kWh`}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                `${value.toLocaleString('tr-TR')} kWh`,
                name === 'production' ? 'Üretim' : 'Hedef'
              ]}
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('tr-TR', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
              }}
            />
            <Line 
              type="monotone" 
              dataKey="production" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            {data.some(d => d.target !== undefined) && (
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="#6b7280" 
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
