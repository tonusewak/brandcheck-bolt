import React, { useState } from 'react';
import { Search, Globe, Instagram, Facebook, Twitter, Settings as SettingsIcon, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { checkDomainAvailability } from './utils/domainChecker';
import { checkSocialMediaAvailability } from './utils/socialMediaChecker';
import Settings from './components/Settings';

interface DomainResult {
  domain: string;
  available: boolean;
  error?: string;
}

interface SocialResult {
  platform: string;
  username: string;
  available: boolean | null;
  error?: string;
}

function App() {
  const [brandName, setBrandName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [domainResults, setDomainResults] = useState<DomainResult[]>([]);
  const [socialResults, setSocialResults] = useState<SocialResult[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [apiConfig, setApiConfig] = useState({
    userId: localStorage.getItem('resellerclub_userid') || '',
    apiKey: localStorage.getItem('resellerclub_apikey') || ''
  });

  const handleSearch = async () => {
    if (!brandName.trim()) return;

    setIsSearching(true);
    setDomainResults([]);
    setSocialResults([]);

    try {
      // Test with .com and .in domains
      const tlds = ['com', 'in'];
      
      // Check domains
      const domainPromise = checkDomainAvailability(brandName.trim(), tlds, apiConfig);
      
      // Check social media
      const socialPromise = checkSocialMediaAvailability(brandName.trim());

      const [domains, social] = await Promise.all([domainPromise, socialPromise]);
      
      setDomainResults(domains);
      setSocialResults(social);
    } catch (error) {
      console.error('Search error:', error);
      // Set error results
      setDomainResults([
        { domain: `${brandName}.com`, available: false, error: 'Search failed' },
        { domain: `${brandName}.in`, available: false, error: 'Search failed' }
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveConfig = (config: { userId: string; apiKey: string }) => {
    setApiConfig(config);
    localStorage.setItem('resellerclub_userid', config.userId);
    localStorage.setItem('resellerclub_apikey', config.apiKey);
  };

  const getStatusIcon = (available: boolean | null, error?: string) => {
    if (error) return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    if (available === null) return <AlertCircle className="w-5 h-5 text-gray-400" />;
    return available ? 
      <CheckCircle className="w-5 h-5 text-green-500" /> : 
      <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusText = (available: boolean | null, error?: string) => {
    if (error) return error;
    if (available === null) return 'Unable to check';
    return available ? 'Available' : 'Taken';
  };

  const getStatusColor = (available: boolean | null, error?: string) => {
    if (error) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (available === null) return 'text-gray-600 bg-gray-50 border-gray-200';
    return available ? 
      'text-green-600 bg-green-50 border-green-200' : 
      'text-red-600 bg-red-50 border-red-200';
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="w-5 h-5" />;
      case 'facebook': return <Facebook className="w-5 h-5" />;
      case 'twitter': return <Twitter className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">BrandCheck</h1>
                <p className="text-sm text-gray-600">Instant name availability checker</p>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <SettingsIcon className="w-5 h-5" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Check Your Brand Name Availability
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Instantly check domain (.com, .in) and social media availability for your brand
          </p>
          
          <div className="max-w-md mx-auto">
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter your brand name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                  disabled={isSearching}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching || !brandName.trim()}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                <span>{isSearching ? 'Checking...' : 'Check'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {(domainResults.length > 0 || socialResults.length > 0) && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Domain Results */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Globe className="w-6 h-6 text-indigo-600 mr-2" />
                Domain Availability
              </h3>
              <div className="space-y-3">
                {domainResults.map((result) => (
                  <div
                    key={result.domain}
                    className={`p-4 rounded-lg border-2 ${getStatusColor(result.available, result.error)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(result.available, result.error)}
                        <span className="font-medium text-lg">{result.domain}</span>
                      </div>
                      <span className="font-semibold">
                        {getStatusText(result.available, result.error)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {apiConfig.userId && apiConfig.apiKey ? (
                <p className="text-sm text-gray-500 mt-4">
                  ✓ Using ResellerClub API for real-time data
                </p>
              ) : (
                <p className="text-sm text-yellow-600 mt-4">
                  ⚠️ Using mock data - Configure API in Settings for real results
                </p>
              )}
            </div>

            {/* Social Media Results */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Instagram className="w-6 h-6 text-pink-600 mr-2" />
                Social Media Availability
              </h3>
              <div className="space-y-3">
                {socialResults.map((result) => (
                  <div
                    key={result.platform}
                    className={`p-4 rounded-lg border-2 ${getStatusColor(result.available, result.error)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getSocialIcon(result.platform)}
                        <span className="font-medium capitalize">{result.platform}</span>
                      </div>
                      <span className="font-semibold">
                        {getStatusText(result.available, result.error)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-4">
                ✓ Real-time social media username checking
              </p>
            </div>
          </div>
        )}

        {/* API Status Info */}
        {(domainResults.length > 0 || socialResults.length > 0) && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">API Status</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Domain checking: {apiConfig.userId && apiConfig.apiKey ? 'ResellerClub API configured' : 'Mock data (configure API in Settings)'}</p>
              <p>• Social media checking: Real-time verification</p>
              <p>• TLDs checked: .com, .in</p>
            </div>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        apiConfig={apiConfig}
        onSaveConfig={handleSaveConfig}
      />
    </div>
  );
}

export default App;