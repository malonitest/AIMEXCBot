'use client';

import { useEffect, useState } from 'react';

export default function TradesPage() {
  const [trades, setTrades] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'OPEN' | 'CLOSED'>('all');
  const [selectedTrade, setSelectedTrade] = useState<number | null>(null);

  useEffect(() => {
    fetchTrades();
  }, [filter]);

  useEffect(() => {
    if (selectedTrade) {
      fetchTradeLogs(selectedTrade);
    }
  }, [selectedTrade]);

  const fetchTrades = async () => {
    try {
      const url = filter === 'all' 
        ? '/api/trades?limit=100' 
        : `/api/trades?status=${filter}&limit=100`;
      const response = await fetch(url);
      const data = await response.json();
      setTrades(data.trades || []);
    } catch (error) {
      console.error('Error fetching trades:', error);
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTradeLogs = async (tradeId: number) => {
    try {
      const response = await fetch(`/api/trades/logs?tradeId=${tradeId}`);
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Error fetching trade logs:', error);
      setLogs([]);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white">Trade History</h1>
        <p className="text-gray-400">View all your past and current trades</p>
      </div>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-mexc-primary text-white'
              : 'bg-mexc-secondary text-gray-300 hover:bg-gray-700'
          }`}
        >
          All Trades
        </button>
        <button
          onClick={() => setFilter('OPEN')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'OPEN'
              ? 'bg-mexc-primary text-white'
              : 'bg-mexc-secondary text-gray-300 hover:bg-gray-700'
          }`}
        >
          Open
        </button>
        <button
          onClick={() => setFilter('CLOSED')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'CLOSED'
              ? 'bg-mexc-primary text-white'
              : 'bg-mexc-secondary text-gray-300 hover:bg-gray-700'
          }`}
        >
          Closed
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-8">Loading...</div>
      ) : trades.length === 0 ? (
        <div className="text-center text-gray-400 py-8">No trades found</div>
      ) : (
        <div className="grid gap-4">
          {trades.map((trade) => (
            <div
              key={trade.id}
              className="bg-mexc-secondary rounded-lg p-6 border border-gray-700 cursor-pointer hover:border-mexc-primary transition-colors"
              onClick={() => setSelectedTrade(selectedTrade === trade.id ? null : trade.id)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="text-xl font-bold text-white">{trade.symbol}</h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.side === 'LONG'
                          ? 'bg-green-900 text-green-300'
                          : 'bg-red-900 text-red-300'
                      }`}
                    >
                      {trade.side} {trade.leverage}x
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.status === 'OPEN'
                          ? 'bg-yellow-900 text-yellow-300'
                          : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {trade.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    {trade.strategy_name || 'Manual Trade'}
                  </p>
                </div>
                {trade.status === 'CLOSED' && (
                  <div
                    className={`text-2xl font-bold ${
                      parseFloat(trade.pnl) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {parseFloat(trade.pnl) >= 0 ? '+' : ''}
                    {parseFloat(trade.pnl).toFixed(2)} USDT
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Entry Price</div>
                  <div className="text-white font-medium">
                    ${parseFloat(trade.entry_price).toFixed(4)}
                  </div>
                </div>
                {trade.exit_price && (
                  <div>
                    <div className="text-sm text-gray-400">Exit Price</div>
                    <div className="text-white font-medium">
                      ${parseFloat(trade.exit_price).toFixed(4)}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-400">Quantity</div>
                  <div className="text-white font-medium">
                    {parseFloat(trade.quantity).toFixed(4)}
                  </div>
                </div>
                {trade.pnl_percent && (
                  <div>
                    <div className="text-sm text-gray-400">PnL %</div>
                    <div
                      className={`font-medium ${
                        parseFloat(trade.pnl_percent) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {parseFloat(trade.pnl_percent).toFixed(2)}%
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-400">Opened</div>
                  <div className="text-white font-medium">
                    {new Date(trade.opened_at).toLocaleString()}
                  </div>
                </div>
                {trade.closed_at && (
                  <div>
                    <div className="text-sm text-gray-400">Closed</div>
                    <div className="text-white font-medium">
                      {new Date(trade.closed_at).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {selectedTrade === trade.id && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Trade Logs</h4>
                  {logs.length === 0 ? (
                    <div className="text-sm text-gray-400">No logs available</div>
                  ) : (
                    <div className="space-y-2">
                      {logs.map((log) => (
                        <div key={log.id} className="text-sm">
                          <span className="text-gray-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                          <span
                            className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                              log.log_type === 'ERROR'
                                ? 'bg-red-900 text-red-300'
                                : log.log_type === 'WARNING'
                                ? 'bg-yellow-900 text-yellow-300'
                                : 'bg-blue-900 text-blue-300'
                            }`}
                          >
                            {log.log_type}
                          </span>
                          <span className="ml-2 text-gray-300">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
