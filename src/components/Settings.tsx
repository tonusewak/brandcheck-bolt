import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Eye, EyeOff, Globe, Copy, Check } from 'lucide-react';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  apiConfig: {
    userId: string;
    apiKey: string;
  };
  onSaveConfig: (config: { userId: string; apiKey: string }) => void;
}

export default function Settings({ isOpen, onClose, apiConfig, onSaveConfig }: SettingsProps) {
  const [userId, setUserId] = useState(apiConfig.userId);
  const [apiKey, setApiKey] = useState(apiConfig.apiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentIP, setCurrentIP] = useState<string>('');
  const [loadingIP, setLoadingIP] = useState(false);
  const [ipCopied, setIpCopied] = useState(false);

  const fetchCurrentIP = async () => {
    setLoadingIP(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-domains/ip`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        }
      });
      const data = await response.json();
      setCurrentIP(data.ip);
    } catch (error) {
      console.error('Failed to fetch IP:', error);
      setCurrentIP('Error fetching IP');
    }
    setLoadingIP(false);
  };

  const copyIPToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentIP);
      setIpCopied(true);
      setTimeout(() => setIpCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy IP:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate save delay
    onSaveConfig({ userId, apiKey });
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <SettingsIcon className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">API Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">ResellerClub API Configuration</h3>
              <p className="text-sm text-blue-700">
                Configure your ResellerClub API credentials for authentic domain availability checking. The system will check .com and .in availability for each brand name you search.
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-orange-900 flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  IP Whitelisting Required
                </h3>
                <button
                  onClick={fetchCurrentIP}
                  disabled={loadingIP}
                  className="text-sm bg-orange-100 hover:bg-orange-200 text-orange-800 px-3 py-1 rounded-md transition-colors"
                >
                  {loadingIP ? 'Getting IP...' : 'Get Server IP'}
                </button>
              </div>
              <p className="text-sm text-orange-700 mb-3">
                ResellerClub requires IP whitelisting for API access. You need to add our server's IP address to your ResellerClub account.
              </p>
              {currentIP && (
                <div className="bg-white border border-orange-300 rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Server IP Address:</p>
                      <code className="text-lg font-mono text-orange-800 bg-orange-100 px-2 py-1 rounded">
                        {currentIP}
                      </code>
                    </div>
                    <button
                      onClick={copyIPToClipboard}
                      className="flex items-center space-x-1 text-orange-600 hover:text-orange-800 transition-colors"
                    >
                      {ipCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span className="text-sm">{ipCopied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-orange-600 mt-2">
                    Add this IP to: ResellerClub Dashboard → Settings → API Settings → IP Whitelist
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
                  Auth User ID
                </label>
                <input
                  type="text"
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter your ResellerClub User ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    id="apiKey"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your ResellerClub API Key"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-1">How to get API credentials:</h4>
              <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                <li>Sign up at ResellerClub.com</li>
                <li>Go to Settings → API Settings → Generate API key</li>
                <li>Add the server IP (above) to IP Whitelist</li>
                <li>Copy your User ID and API Key here</li>
                <li>Test the connection with a brand search</li>
              </ol>
              <p className="text-xs text-yellow-600 mt-2">
                <strong>API Format:</strong> The system uses your brand name in place of "mybrand" in the API call:<br/>
                <code className="text-xs">httpapi.com/api/domains/available.json?auth-userid=YOUR_ID&api-key=YOUR_KEY&domain-name=BRAND_NAME&tlds=com&tlds=in</code>
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleSave}
                disabled={isSaving || !userId.trim() || !apiKey.trim()}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}