import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/Card';

interface PerformanceData {
  date: string;
  performance: number;
  temperature?: number;
}

interface PerformanceChartProps {
  data: PerformanceData[];
  title?: string;
  height?: number;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ 
  data, 
  title = "Performans Analizi",
  height = 300 
}) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
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
              tickFormatter={(value) => `${value}%`}
              domain={[0, 100]}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                `${value.toFixed(1)}${name === 'performance' ? '%' : '°C'}`,
                name === 'performance' ? 'Performans' : 'Sıcaklık'
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
            <Area 
              type="monotone" 
              dataKey="performance" 
              stroke="#3b82f6" 
              fillOpacity={1}
              fill="url(#performanceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Performans durumu göstergesi */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>İyi (80%+)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span>Orta (60-80%)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span>Düşük (&lt;60%)</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-gray-900">
            {data.length > 0 ? `${data[data.length - 1].performance.toFixed(1)}%` : '0%'}
          </div>
          <div className="text-xs text-gray-500">Son Performans</div>
        </div>
      </div>
    </Card>
  );
};
