'use client';

import { useEffect, useState } from 'react';

export default function RecentTrades() {
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentTrades();
  }, []);

  const fetchRecentTrades = async () => {
    try {
      const response = await fetch('/api/trades?status=CLOSED&limit=10');
      const data = await response.json();
      setTrades(data.trades || []);
    } catch (error) {
      console.error('Error fetching recent trades:', error);
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-mexc-secondary rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold mb-4 text-white">Recent Closed Trades</h2>
      
      {loading ? (
        <div className="text-center text-gray-400 py-8">Loading...</div>
      ) : trades.length === 0 ? (
        <div className="text-center text-gray-400 py-8">No closed trades</div>
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
                    {new Date(trade.closed_at).toLocaleString()}
                  </div>
                </div>
                <div
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    parseFloat(trade.pnl) >= 0
                      ? 'bg-green-900 text-green-300'
                      : 'bg-red-900 text-red-300'
                  }`}
                >
                  {parseFloat(trade.pnl) >= 0 ? '+' : ''}
                  {parseFloat(trade.pnl).toFixed(2)} USDT
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div className="text-gray-400">Entry</div>
                  <div className="text-white">${parseFloat(trade.entry_price).toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-gray-400">Exit</div>
                  <div className="text-white">${parseFloat(trade.exit_price).toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-gray-400">PnL %</div>
                  <div className={parseFloat(trade.pnl_percent) >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {parseFloat(trade.pnl_percent).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
