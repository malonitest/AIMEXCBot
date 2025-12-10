'use client';

import { useEffect, useState } from 'react';

export default function ActiveTrades() {
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveTrades();
    const interval = setInterval(fetchActiveTrades, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchActiveTrades = async () => {
    try {
      const response = await fetch('/api/trades?status=OPEN&limit=10');
      const data = await response.json();
      setTrades(data.trades);
    } catch (error) {
      console.error('Error fetching active trades:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-mexc-secondary rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold mb-4 text-white">Active Positions</h2>
      
      {loading ? (
        <div className="text-center text-gray-400 py-8">Loading...</div>
      ) : trades.length === 0 ? (
        <div className="text-center text-gray-400 py-8">No active trades</div>
      ) : (
        <div className="space-y-3">
          {trades.map((trade) => (
            <div
              key={trade.id}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium text-white">{trade.symbol}</div>
                  <div className="text-sm text-gray-400">
                    {trade.strategy_name || 'Manual Trade'}
                  </div>
                </div>
                <div
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    trade.side === 'LONG'
                      ? 'bg-green-900 text-green-300'
                      : 'bg-red-900 text-red-300'
                  }`}
                >
                  {trade.side} {trade.leverage}x
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-gray-400">Entry</div>
                  <div className="text-white">${parseFloat(trade.entry_price).toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-gray-400">Quantity</div>
                  <div className="text-white">{parseFloat(trade.quantity).toFixed(4)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
