'use client'

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

type HistoryPoint = {
  created_at: string;
  probability: number;
};

interface MarketChartProps {
  history: HistoryPoint[];
}

export function MarketChart({ history }: MarketChartProps) {
  // Map data for Recharts
  const data = history.map((point) => ({
    time: new Date(point.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    probability: Math.round(point.probability * 100)
  }));

  return (
    <div className="h-[300px] w-full bg-slate-900/50 p-4 rounded-xl border border-slate-800">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="#64748b" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            domain={[0, 100]} 
            stroke="#64748b" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
            itemStyle={{ color: '#10b981' }}
          />
          <Area 
            type="monotone" 
            dataKey="probability" 
            stroke="#10b981" 
            fillOpacity={1} 
            fill="url(#colorProb)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
