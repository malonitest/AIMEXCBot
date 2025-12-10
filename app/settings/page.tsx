'use client';

import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    apiKey: '',
    secretKey: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      setHasApiKey(data.hasApiKey);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'API keys saved successfully!' });
        setHasApiKey(true);
        setFormData({ apiKey: '', secretKey: '' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save API keys' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save API keys' });
    } finally {
      setSaving(false);
    }
  };

  const executeStrategies = async () => {
    setExecuting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/strategy/execute', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `Strategy execution completed. Check trade history for results.` 
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to execute strategies' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to execute strategies' });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white">Settings</h1>
        <p className="text-gray-400">Configure your MEXC API credentials and bot settings</p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-900 text-green-300'
              : 'bg-red-900 text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-mexc-secondary rounded-lg p-6 border border-gray-700 mb-6">
        <h2 className="text-xl font-bold mb-4 text-white">MEXC API Configuration</h2>
        
        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : (
          <>
            {hasApiKey && (
              <div className="mb-4 p-4 bg-green-900 text-green-300 rounded-lg">
                ✓ API keys are configured
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  required
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  placeholder="Enter your MEXC API key"
                />
                <p className="mt-1 text-sm text-gray-400">
                  Your API key will be encrypted before storage
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Secret Key
                </label>
                <input
                  type="password"
                  required
                  value={formData.secretKey}
                  onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  placeholder="Enter your MEXC secret key"
                />
                <p className="mt-1 text-sm text-gray-400">
                  Your secret key will be encrypted before storage
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-mexc-primary hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : hasApiKey ? 'Update API Keys' : 'Save API Keys'}
              </button>
            </form>

            <div className="mt-6 p-4 bg-yellow-900 text-yellow-300 rounded-lg">
              <strong>Security Notice:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Keys are encrypted using AES-256 encryption</li>
                <li>• Never share your API keys with anyone</li>
                <li>• Enable IP whitelist on MEXC for additional security</li>
                <li>• Only grant necessary permissions (trading, not withdrawal)</li>
              </ul>
            </div>
          </>
        )}
      </div>

      {hasApiKey && (
        <div className="bg-mexc-secondary rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-white">Manual Execution</h2>
          <p className="text-gray-400 mb-4">
            Manually execute active strategies. In production, this would run automatically on a schedule.
          </p>
          <button
            onClick={executeStrategies}
            disabled={executing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {executing ? 'Executing...' : 'Execute Active Strategies'}
          </button>
        </div>
      )}

      <div className="mt-6 bg-mexc-secondary rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-white">About</h2>
        <div className="text-gray-400 space-y-2">
          <p><strong className="text-white">Trading Pair:</strong> SOL/USDT Futures</p>
          <p><strong className="text-white">Max Leverage:</strong> 50x (configurable per strategy)</p>
          <p><strong className="text-white">Exchange:</strong> MEXC</p>
          <p><strong className="text-white">Database:</strong> Azure PostgreSQL Flexible Server</p>
          <p><strong className="text-white">Hosting:</strong> Azure App Service</p>
        </div>
      </div>
    </div>
  );
}
