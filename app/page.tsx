'use client';

import { useEffect, useState } from 'react';
import DashboardStats from '@/components/DashboardStats';
import ActiveTrades from '@/components/ActiveTrades';
import RecentTrades from '@/components/RecentTrades';

export default function Home() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/trades/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({ totalTrades: 0, activeTrades: 0, totalPnL: 0, winRate: 0, activeStrategies: 0 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-white">Trading Dashboard</h1>
        <p className="text-gray-400">AI-driven MEXC SOL/USDT futures trading with 50x leverage</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading...</div>
        </div>
      ) : (
        <>
          <DashboardStats stats={stats} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <ActiveTrades />
            <RecentTrades />
          </div>
        </>
      )}
    </div>
  );
}
