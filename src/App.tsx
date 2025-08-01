import React, { useState, useMemo } from 'react';
import { Search, Globe, Users, CheckCircle, XCircle, Clock, Lightbulb, Scale, ChevronDown, Filter, Plus, Trash2 } from 'lucide-react';

interface AvailabilityResult {
  domain: string;
  available: boolean;
  platform: string;
  icon: React.ReactNode;
}

interface SuggestionResult {
  name: string;
  available: boolean;
  score: number;
}

interface TrademarkResult {
  name: string;
  category: string;
  available: boolean;
  similarMarks: number;
  status: 'available' | 'similar_found' | 'exact_match';
}

interface MultiSearchResult {
  name: string;
  domainCom: boolean;
  domainIn: boolean;
  instagram: boolean;
  twitter: boolean;
  facebook: boolean;
  linkedin: boolean;
  youtube: boolean;
  tiktok: boolean;
  trademark: boolean;
  overallScore: number;
}

const socialPlatforms = [
  { name: 'Instagram', icon: '📷', baseUrl: 'instagram.com/', key: 'instagram' },
  { name: 'Twitter', icon: '🐦', baseUrl: 'twitter.com/', key: 'twitter' },
  { name: 'Facebook', icon: '📘', baseUrl: 'facebook.com/', key: 'facebook' },
  { name: 'LinkedIn', icon: '💼', baseUrl: 'linkedin.com/company/', key: 'linkedin' },
  { name: 'YouTube', icon: '📺', baseUrl: 'youtube.com/c/', key: 'youtube' },
  { name: 'TikTok', icon: '🎵', baseUrl: 'tiktok.com/@', key: 'tiktok' }
];

const trademarkCategories = [
  { id: 1, name: 'Chemical preparations', description: 'Chemicals, fertilizers, paints', keywords: ['chemical', 'fertilizer', 'paint', 'coating'] },
  { id: 2, name: 'Paints and coatings', description: 'Paints, varnishes, lacquers', keywords: ['paint', 'varnish', 'lacquer', 'coating', 'color'] },
  { id: 3, name: 'Cosmetics and cleaning', description: 'Soaps, perfumes, cosmetics', keywords: ['soap', 'perfume', 'cosmetic', 'beauty', 'skincare', 'makeup'] },
  { id: 4, name: 'Industrial oils', description: 'Lubricants, fuels, candles', keywords: ['oil', 'lubricant', 'fuel', 'candle', 'wax'] },
  { id: 5, name: 'Pharmaceuticals', description: 'Medicines, medical supplies', keywords: ['medicine', 'drug', 'pharmaceutical', 'medical', 'health'] },
  { id: 9, name: 'Electronics', description: 'Computers, software, electronics', keywords: ['computer', 'software', 'electronic', 'device', 'tech', 'app'] },
  { id: 12, name: 'Vehicles', description: 'Cars, motorcycles, parts', keywords: ['car', 'vehicle', 'motorcycle', 'auto', 'transport'] },
  { id: 16, name: 'Paper and printing', description: 'Paper, stationery, printed matter', keywords: ['paper', 'print', 'stationery', 'book', 'magazine'] },
  { id: 18, name: 'Leather goods', description: 'Bags, wallets, leather products', keywords: ['bag', 'handbag', 'wallet', 'leather', 'purse', 'luggage', 'backpack'] },
  { id: 25, name: 'Clothing', description: 'Apparel, footwear, headgear', keywords: ['clothing', 'apparel', 'shirt', 'dress', 'shoe', 'footwear', 'fashion'] },
  { id: 28, name: 'Toys and games', description: 'Toys, sporting goods, games', keywords: ['toy', 'game', 'sport', 'play', 'entertainment'] },
  { id: 29, name: 'Food products', description: 'Meat, fish, preserved foods', keywords: ['food', 'meat', 'fish', 'snack', 'preserved'] },
  { id: 30, name: 'Staple foods', description: 'Coffee, tea, sugar, bread', keywords: ['coffee', 'tea', 'sugar', 'bread', 'bakery', 'beverage'] },
  { id: 32, name: 'Beverages', description: 'Non-alcoholic drinks, juices', keywords: ['drink', 'juice', 'beverage', 'water', 'soda'] },
  { id: 35, name: 'Business services', description: 'Advertising, business management', keywords: ['business', 'advertising', 'marketing', 'consulting', 'service'] },
  { id: 36, name: 'Financial services', description: 'Insurance, banking, real estate', keywords: ['finance', 'bank', 'insurance', 'real estate', 'investment'] },
  { id: 38, name: 'Communications', description: 'Telecommunications, broadcasting', keywords: ['communication', 'telecom', 'broadcast', 'media', 'internet'] },
  { id: 41, name: 'Education and entertainment', description: 'Training, entertainment, sports', keywords: ['education', 'training', 'entertainment', 'sport', 'event'] },
  { id: 42, name: 'Technology services', description: 'IT services, research, design', keywords: ['technology', 'IT', 'research', 'design', 'development'] },
  { id: 43, name: 'Food services', description: 'Restaurants, catering, hotels', keywords: ['restaurant', 'catering', 'hotel', 'hospitality', 'dining'] },
  { id: 44, name: 'Medical services', description: 'Healthcare, veterinary services', keywords: ['medical', 'healthcare', 'doctor', 'clinic', 'veterinary'] },
  { id: 45, name: 'Legal and security', description: 'Legal services, security, personal care', keywords: ['legal', 'security', 'law', 'protection', 'safety'] }
];

function App() {
  const [brandName, setBrandName] = useState('');
  const [multiSearchMode, setMultiSearchMode] = useState(false);
  const [brandNames, setBrandNames] = useState(['']);
  const [autoSuggest, setAutoSuggest] = useState(true);
  const [checkTrademark, setCheckTrademark] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(35);
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AvailabilityResult[]>([]);
  const [multiResults, setMultiResults] = useState<MultiSearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionResult[]>([]);
  const [trademarkResults, setTrademarkResults] = useState<TrademarkResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return trademarkCategories;
    
    const searchTerm = categorySearch.toLowerCase();
    return trademarkCategories.filter(category => 
      category.name.toLowerCase().includes(searchTerm) ||
      category.description.toLowerCase().includes(searchTerm) ||
      category.keywords.some(keyword => keyword.includes(searchTerm))
    );
  }, [categorySearch]);

  // Auto-select category based on search
  const handleCategorySearch = (value: string) => {
    setCategorySearch(value);
    if (value.trim()) {
      const matchedCategory = trademarkCategories.find(category =>
        category.keywords.some(keyword => keyword.includes(value.toLowerCase()))
      );
      if (matchedCategory && matchedCategory.id !== selectedCategory) {
        setSelectedCategory(matchedCategory.id);
      }
    }
  };

  const addBrandName = () => {
    setBrandNames([...brandNames, '']);
  };

  const removeBrandName = (index: number) => {
    if (brandNames.length > 1) {
      setBrandNames(brandNames.filter((_, i) => i !== index));
    }
  };

  const updateBrandName = (index: number, value: string) => {
    const updated = [...brandNames];
    updated[index] = value;
    setBrandNames(updated);
  };

  const generateMockResults = (name: string): AvailabilityResult[] => {
    const domainResults = [
      {
        domain: `${name.toLowerCase()}.com`,
        available: Math.random() > 0.6,
        platform: '.com',
        icon: <Globe className="w-5 h-5" />
      },
      {
        domain: `${name.toLowerCase()}.in`,
        available: Math.random() > 0.4,
        platform: '.in',
        icon: <Globe className="w-5 h-5" />
      }
    ];

    const socialResults = socialPlatforms.map(platform => ({
      domain: `${platform.baseUrl}${name.toLowerCase()}`,
      available: Math.random() > 0.5,
      platform: platform.name,
      icon: <span className="text-lg">{platform.icon}</span>
    }));

    return [...domainResults, ...socialResults];
  };

  const generateMultiResults = (names: string[]): MultiSearchResult[] => {
    return names.filter(name => name.trim()).map(name => {
      const domainCom = Math.random() > 0.6;
      const domainIn = Math.random() > 0.4;
      const instagram = Math.random() > 0.5;
      const twitter = Math.random() > 0.5;
      const facebook = Math.random() > 0.5;
      const linkedin = Math.random() > 0.5;
      const youtube = Math.random() > 0.5;
      const tiktok = Math.random() > 0.5;
      const trademark = Math.random() > 0.7;

      const availableCount = [domainCom, domainIn, instagram, twitter, facebook, linkedin, youtube, tiktok, trademark].filter(Boolean).length;
      const overallScore = Math.round((availableCount / 9) * 100);

      return {
        name: name.trim(),
        domainCom,
        domainIn,
        instagram,
        twitter,
        facebook,
        linkedin,
        youtube,
        tiktok,
        trademark,
        overallScore
      };
    });
  };

  const generateTrademarkResults = (name: string, categoryId: number): TrademarkResult[] => {
    const category = trademarkCategories.find(c => c.id === categoryId);
    if (!category) return [];

    const random = Math.random();
    let status: 'available' | 'similar_found' | 'exact_match';
    let similarMarks = 0;

    if (random > 0.7) {
      status = 'available';
      similarMarks = 0;
    } else if (random > 0.3) {
      status = 'similar_found';
      similarMarks = Math.floor(Math.random() * 5) + 1;
    } else {
      status = 'exact_match';
      similarMarks = 1;
    }

    return [{
      name,
      category: category.name,
      available: status === 'available',
      similarMarks,
      status
    }];
  };

  const generateSuggestions = (name: string): SuggestionResult[] => {
    const prefixes = ['Get', 'My', 'The', 'Pro', 'Go', 'Try'];
    const suffixes = ['HQ', 'Lab', 'Pro', 'Hub', 'Co', 'App', 'Now', 'Today'];
    
    const suggestions: SuggestionResult[] = [];
    
    prefixes.slice(0, 2).forEach(prefix => {
      suggestions.push({
        name: prefix + name,
        available: Math.random() > 0.3,
        score: Math.floor(Math.random() * 30) + 70
      });
    });

    suffixes.slice(0, 3).forEach(suffix => {
      suggestions.push({
        name: name + suffix,
        available: Math.random() > 0.3,
        score: Math.floor(Math.random() * 25) + 75
      });
    });

    if (name.length > 4) {
      suggestions.push({
        name: name.slice(0, -1) + 'fy',
        available: Math.random() > 0.4,
        score: Math.floor(Math.random() * 20) + 80
      });
    }

    return suggestions.sort((a, b) => b.score - a.score);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (multiSearchMode) {
      const validNames = brandNames.filter(name => name.trim());
      if (validNames.length === 0) return;
    } else {
      if (!brandName.trim()) return;
    }

    setIsLoading(true);
    setHasSearched(false);

    await new Promise(resolve => setTimeout(resolve, 2000));

    if (multiSearchMode) {
      const mockMultiResults = generateMultiResults(brandNames);
      setMultiResults(mockMultiResults);
      setResults([]);
      setSuggestions([]);
      setTrademarkResults([]);
    } else {
      const mockResults = generateMockResults(brandName);
      setResults(mockResults);
      setMultiResults([]);

      if (checkTrademark) {
        const mockTrademarkResults = generateTrademarkResults(brandName, selectedCategory);
        setTrademarkResults(mockTrademarkResults);
      } else {
        setTrademarkResults([]);
      }

      if (autoSuggest) {
        const mockSuggestions = generateSuggestions(brandName);
        setSuggestions(mockSuggestions);
      } else {
        setSuggestions([]);
      }
    }

    setIsLoading(false);
    setHasSearched(true);
  };

  const getAvailabilityStats = () => {
    if (results.length === 0) return null;
    const available = results.filter(r => r.available).length;
    const total = results.length;
    return { available, total, percentage: Math.round((available / total) * 100) };
  };

  const selectedCategoryData = trademarkCategories.find(c => c.id === selectedCategory);
  const stats = getAvailabilityStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 p-3 rounded-xl shadow-lg">
              <Search className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              BrandCheck
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Instantly check domain, social media, and trademark availability for your brand name. 
            Get smart suggestions when your first choice isn't available.
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="space-y-6">
              {/* Search Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Filter className="w-5 h-5 text-orange-600" />
                  <label className="text-sm font-medium text-gray-700">
                    Multiple name search (comma separated)
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={multiSearchMode}
                    onChange={(e) => setMultiSearchMode(e.target.checked)}
                    className="sr-only"
                  />
                  <label
                    onClick={() => setMultiSearchMode(!multiSearchMode)}
                    className={`flex items-center cursor-pointer w-12 h-6 rounded-full transition-all duration-300 ${
                      multiSearchMode ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                        multiSearchMode ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </label>
                </div>
              </div>

              {/* Brand Name Input */}
              {!multiSearchMode ? (
                <div>
                  <label htmlFor="brand" className="block text-sm font-semibold text-gray-700 mb-2">
                    Brand Name or Keyword
                  </label>
                  <input
                    type="text"
                    id="brand"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g., Nuraglow, Vedanova, EcoBloom"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-lg"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Brand Names (Multiple)
                  </label>
                  <div className="space-y-3">
                    {brandNames.map((name, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => updateBrandName(index, e.target.value)}
                          placeholder={`Brand name ${index + 1}`}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                        />
                        {brandNames.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBrandName(index)}
                            className="px-3 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors duration-200"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addBrandName}
                      className="flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-xl transition-colors duration-200"
                    >
                      <Plus className="w-4 h-4" />
                      Add another name
                    </button>
                  </div>
                </div>
              )}

              {/* Trademark Category Selection */}
              {!multiSearchMode && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Scale className="w-5 h-5 text-orange-600" />
                      <label htmlFor="trademark" className="text-sm font-medium text-gray-700">
                        Check trademark availability (India)
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="trademark"
                        checked={checkTrademark}
                        onChange={(e) => setCheckTrademark(e.target.checked)}
                        className="sr-only"
                      />
                      <label
                        htmlFor="trademark"
                        className={`flex items-center cursor-pointer w-12 h-6 rounded-full transition-all duration-300 ${
                          checkTrademark ? 'bg-orange-500' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                            checkTrademark ? 'translate-x-6' : 'translate-x-0.5'
                          }`}
                        />
                      </label>
                    </div>
                  </div>

                  {checkTrademark && (
                    <div className="space-y-3">
                      {/* Category Search */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Search Product Category
                        </label>
                        <input
                          type="text"
                          value={categorySearch}
                          onChange={(e) => handleCategorySearch(e.target.value)}
                          placeholder="e.g., handbag, software, restaurant"
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>

                      {/* Category Dropdown */}
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Trademark Category
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-left flex items-center justify-between bg-white"
                          >
                            <div>
                              <div className="font-medium text-gray-800">
                                Class {selectedCategoryData?.id}: {selectedCategoryData?.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {selectedCategoryData?.description}
                              </div>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                              showCategoryDropdown ? 'rotate-180' : ''
                            }`} />
                          </button>
                          
                          {showCategoryDropdown && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                              {filteredCategories.map((category) => (
                                <button
                                  key={category.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCategory(category.id);
                                    setShowCategoryDropdown(false);
                                  }}
                                  className={`w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors duration-150 ${
                                    selectedCategory === category.id ? 'bg-orange-50 border-r-2 border-orange-500' : ''
                                  }`}
                                >
                                  <div className="font-medium text-gray-800">
                                    Class {category.id}: {category.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {category.description}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!multiSearchMode && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <label htmlFor="suggest" className="text-sm font-medium text-gray-700">
                      Auto-suggest alternatives if unavailable
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="suggest"
                      checked={autoSuggest}
                      onChange={(e) => setAutoSuggest(e.target.checked)}
                      className="sr-only"
                    />
                    <label
                      htmlFor="suggest"
                      className={`flex items-center cursor-pointer w-12 h-6 rounded-full transition-all duration-300 ${
                        autoSuggest ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                          autoSuggest ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </label>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || (!multiSearchMode && !brandName.trim()) || (multiSearchMode && !brandNames.some(name => name.trim()))}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-lg shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin" />
                    Checking Availability...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    🔍 Check Availability
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="animate-pulse space-y-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full mx-auto flex items-center justify-center">
                  <Search className="w-8 h-8 text-orange-600 animate-bounce" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700">Checking availability...</h3>
                <p className="text-gray-500">
                  {multiSearchMode ? 'Scanning multiple names across platforms' : 'Scanning domains and social platforms'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Multi Search Results Table */}
        {hasSearched && !isLoading && multiResults.length > 0 && (
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Users className="w-6 h-6 text-orange-600" />
                Multi-Brand Availability Results
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Brand Name</th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-700">.com</th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-700">.in</th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-700">📷</th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-700">🐦</th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-700">📘</th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-700">💼</th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-700">📺</th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-700">🎵</th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-700">⚖️</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {multiResults.map((result, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
                        <td className="py-4 px-4 font-medium text-gray-800">{result.name}</td>
                        <td className="text-center py-4 px-2">
                          {result.domainCom ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 mx-auto" />
                          )}
                        </td>
                        <td className="text-center py-4 px-2">
                          {result.domainIn ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 mx-auto" />
                          )}
                        </td>
                        <td className="text-center py-4 px-2">
                          {result.instagram ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 mx-auto" />
                          )}
                        </td>
                        <td className="text-center py-4 px-2">
                          {result.twitter ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 mx-auto" />
                          )}
                        </td>
                        <td className="text-center py-4 px-2">
                          {result.facebook ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 mx-auto" />
                          )}
                        </td>
                        <td className="text-center py-4 px-2">
                          {result.linkedin ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 mx-auto" />
                          )}
                        </td>
                        <td className="text-center py-4 px-2">
                          {result.youtube ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 mx-auto" />
                          )}
                        </td>
                        <td className="text-center py-4 px-2">
                          {result.tiktok ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 mx-auto" />
                          )}
                        </td>
                        <td className="text-center py-4 px-2">
                          {result.trademark ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 mx-auto" />
                          )}
                        </td>
                        <td className="text-center py-4 px-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            result.overallScore >= 70 ? 'bg-green-100 text-green-800' :
                            result.overallScore >= 40 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {result.overallScore}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-gray-500 text-center">
                💡 Green checkmarks indicate availability, red X marks indicate taken/unavailable
              </div>
            </div>
          </div>
        )}

        {/* Single Search Results */}
        {hasSearched && !isLoading && !multiSearchMode && results.length > 0 && (
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Stats Overview */}
            {stats && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      Results for "{brandName}"
                    </h2>
                    <p className="text-gray-600">
                      {stats.available} of {stats.total} platforms available ({stats.percentage}%)
                      {trademarkResults.length > 0 && trademarkResults[0].available && 
                        ' • Trademark available'
                      }
                      {trademarkResults.length > 0 && !trademarkResults[0].available && 
                        ' • Trademark conflicts found'
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${stats.percentage >= 50 ? 'text-green-600' : 'text-amber-600'}`}>
                      {stats.percentage}%
                    </div>
                    <div className="text-sm text-gray-500">Available</div>
                  </div>
                </div>
              </div>
            )}

            {/* Trademark Results */}
            {trademarkResults.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <Scale className="w-6 h-6 text-orange-600" />
                  Trademark Status (India)
                </h3>
                {trademarkResults.map((result, index) => (
                  <div key={index} className="space-y-4">
                    <div className={`p-6 rounded-xl border-2 ${
                      result.status === 'available' 
                        ? 'border-green-200 bg-green-50' 
                        : result.status === 'similar_found'
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-red-200 bg-red-50'
                    }`}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800 mb-1">
                            Class {selectedCategory}: {result.category}
                          </h4>
                          <p className="text-gray-600">
                            {selectedCategoryData?.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.status === 'available' ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-600" />
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-white rounded-lg">
                          <div className="text-2xl font-bold text-gray-800">
                            {result.status === 'available' ? '✅' : '⚠️'}
                          </div>
                          <div className="text-sm font-medium text-gray-700 mt-1">
                            {result.status === 'available' ? 'Available' : 
                             result.status === 'similar_found' ? 'Similar Found' : 'Exact Match'}
                          </div>
                        </div>
                        
                        <div className="text-center p-3 bg-white rounded-lg">
                          <div className="text-2xl font-bold text-gray-800">
                            {result.similarMarks}
                          </div>
                          <div className="text-sm font-medium text-gray-700 mt-1">
                            Similar Marks
                          </div>
                        </div>
                        
                        <div className="text-center p-3 bg-white rounded-lg">
                          <div className="text-2xl font-bold text-gray-800">
                            🇮🇳
                          </div>
                          <div className="text-sm font-medium text-gray-700 mt-1">
                            India Registry
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-white rounded-lg">
                        <div className={`text-sm font-medium ${
                          result.status === 'available' ? 'text-green-700' :
                          result.status === 'similar_found' ? 'text-amber-700' : 'text-red-700'
                        }`}>
                          {result.status === 'available' && 
                            '✅ No conflicting trademarks found. You can proceed with trademark application.'
                          }
                          {result.status === 'similar_found' && 
                            `⚠️ ${result.similarMarks} similar trademark(s) found. Review recommended before filing.`
                          }
                          {result.status === 'exact_match' && 
                            '❌ Exact or highly similar trademark already exists. Consider alternative names.'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="mt-4 text-xs text-gray-500 text-center">
                  💡 This is a preliminary check. Consult a trademark attorney for comprehensive analysis before filing.
                </div>
              </div>
            )}

            {/* Availability Results */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Users className="w-6 h-6" />
                Availability Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                      result.available
                        ? 'border-green-200 bg-green-50 hover:border-green-300'
                        : 'border-red-200 bg-red-50 hover:border-red-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {result.icon}
                        <span className="font-medium text-gray-800">{result.platform}</span>
                      </div>
                      {result.available ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="text-sm text-gray-600 break-all">{result.domain}</div>
                    <div className={`text-sm font-medium mt-1 ${
                      result.available ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {result.available ? 'Available' : 'Taken'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <Lightbulb className="w-6 h-6 text-amber-500" />
                  Alternative Suggestions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md cursor-pointer ${
                        suggestion.available
                          ? 'border-orange-200 bg-orange-50 hover:border-orange-300'
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        if (suggestion.available) {
                          setBrandName(suggestion.name);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-800">{suggestion.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                            {suggestion.score}%
                          </span>
                          {suggestion.available ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                      </div>
                      <div className={`text-sm ${
                        suggestion.available ? 'text-orange-700' : 'text-gray-600'
                      }`}>
                        {suggestion.available ? 'Available - Click to check' : 'Partially available'}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-gray-500 text-center">
                  💡 Click on available suggestions to check their availability
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {hasSearched && !isLoading && results.length === 0 && multiResults.length === 0 && (
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-lg p-12">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No results found</h3>
              <p className="text-gray-500">Please try searching for a different brand name.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;