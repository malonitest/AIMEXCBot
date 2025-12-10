'use client';

import { useEffect, useState } from 'react';

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    leverage: 50,
    positionSize: 100,
    stopLoss: 2,
    takeProfit: 5,
    strategyType: 'trend_following',
  });

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    try {
      const response = await fetch('/api/strategy');
      const data = await response.json();
      setStrategies(data.strategies);
    } catch (error) {
      console.error('Error fetching strategies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        setShowForm(false);
        fetchStrategies();
        setFormData({
          name: '',
          leverage: 50,
          positionSize: 100,
          stopLoss: 2,
          takeProfit: 5,
          strategyType: 'trend_following',
        });
      }
    } catch (error) {
      console.error('Error creating strategy:', error);
    }
  };

  const toggleStrategy = async (id: number, isActive: boolean) => {
    try {
      await fetch(`/api/strategy/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchStrategies();
    } catch (error) {
      console.error('Error toggling strategy:', error);
    }
  };

  const deleteStrategy = async (id: number) => {
    if (!confirm('Are you sure you want to delete this strategy?')) return;
    
    try {
      await fetch(`/api/strategy/${id}`, { method: 'DELETE' });
      fetchStrategies();
    } catch (error) {
      console.error('Error deleting strategy:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white">Trading Strategies</h1>
          <p className="text-gray-400">Manage your automated trading strategies</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-mexc-primary hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          {showForm ? 'Cancel' : 'New Strategy'}
        </button>
      </div>

      {showForm && (
        <div className="bg-mexc-secondary rounded-lg p-6 border border-gray-700 mb-8">
          <h2 className="text-xl font-bold mb-4 text-white">Create New Strategy</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Strategy Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="My Trend Following Strategy"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Leverage (1-125x)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="125"
                  value={formData.leverage}
                  onChange={(e) => setFormData({ ...formData, leverage: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Position Size (USDT)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.positionSize}
                  onChange={(e) => setFormData({ ...formData, positionSize: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stop Loss (%)
                </label>
                <input
                  type="number"
                  required
                  step="0.1"
                  min="0.1"
                  value={formData.stopLoss}
                  onChange={(e) => setFormData({ ...formData, stopLoss: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Take Profit (%)
                </label>
                <input
                  type="number"
                  required
                  step="0.1"
                  min="0.1"
                  value={formData.takeProfit}
                  onChange={(e) => setFormData({ ...formData, takeProfit: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Strategy Type
              </label>
              <select
                value={formData.strategyType}
                onChange={(e) => setFormData({ ...formData, strategyType: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                <option value="trend_following">Trend Following</option>
                <option value="mean_reversion">Mean Reversion</option>
                <option value="breakout">Breakout</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-mexc-primary hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Create Strategy
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-400 py-8">Loading...</div>
      ) : strategies.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          No strategies yet. Create your first strategy to get started!
        </div>
      ) : (
        <div className="grid gap-4">
          {strategies.map((strategy) => (
            <div
              key={strategy.id}
              className="bg-mexc-secondary rounded-lg p-6 border border-gray-700"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{strategy.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {strategy.symbol} • {strategy.strategy_type.replace('_', ' ')}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleStrategy(strategy.id, strategy.is_active)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      strategy.is_active
                        ? 'bg-green-900 text-green-300 hover:bg-green-800'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {strategy.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => deleteStrategy(strategy.id)}
                    className="px-4 py-2 bg-red-900 text-red-300 hover:bg-red-800 rounded-lg font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Leverage</div>
                  <div className="text-white font-medium">{strategy.leverage}x</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Position Size</div>
                  <div className="text-white font-medium">{strategy.position_size_usdt} USDT</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Stop Loss</div>
                  <div className="text-red-400 font-medium">{strategy.stop_loss_percent}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Take Profit</div>
                  <div className="text-green-400 font-medium">{strategy.take_profit_percent}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Created</div>
                  <div className="text-white font-medium">
                    {new Date(strategy.created_at).toLocaleDateString()}
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
