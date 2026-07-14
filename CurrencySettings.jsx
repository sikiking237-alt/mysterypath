import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const CurrencySettings = ({ settings, onUpdate, darkMode }) => {
  const [currencies, setCurrencies] = useState([]);
  const [newCurrencyCode, setNewCurrencyCode] = useState('');
  const [newCurrencyName, setNewCurrencyName] = useState('');

  useEffect(() => {
    if (settings.supportedCurrencies) {
      try {
        const parsedCurrencies = typeof settings.supportedCurrencies === 'string'
          ? JSON.parse(settings.supportedCurrencies)
          : settings.supportedCurrencies;
        if (Array.isArray(parsedCurrencies)) {
          setCurrencies(parsedCurrencies);
        }
      } catch (e) {
        console.error("Failed to parse supportedCurrencies", e);
        setCurrencies([]);
      }
    }
  }, [settings.supportedCurrencies]);

  const handleAddCurrency = () => {
    if (newCurrencyCode && newCurrencyName && !currencies.find(c => c.code.toLowerCase() === newCurrencyCode.toLowerCase())) {
      const updatedCurrencies = [...currencies, { code: newCurrencyCode.toUpperCase(), name: newCurrencyName }];
      setCurrencies(updatedCurrencies);
      onUpdate('supportedCurrencies', JSON.stringify(updatedCurrencies));
      setNewCurrencyCode('');
      setNewCurrencyName('');
    }
  };

  const handleRemoveCurrency = (codeToRemove) => {
    const updatedCurrencies = currencies.filter(c => c.code !== codeToRemove);
    setCurrencies(updatedCurrencies);
    onUpdate('supportedCurrencies', JSON.stringify(updatedCurrencies));
  };

  const inputClass = `w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:ring-2 focus:ring-purple-500`;

  return (
    <div className="space-y-4">
      <h4 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Supported Currencies</h4>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
        {currencies.map(currency => (
          <div key={currency.code} className={`flex items-center justify-between p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <div>
              <span className="font-bold">{currency.code}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">- {currency.name}</span>
            </div>
            <button
              onClick={() => handleRemoveCurrency(currency.code)}
              className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400"
              aria-label={`Remove ${currency.name}`}
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h5 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Add New Currency</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Currency Code
            </label>
            <input
              type="text"
              value={newCurrencyCode}
              onChange={(e) => setNewCurrencyCode(e.target.value)}
              className={inputClass}
              placeholder="e.g., JPY"
              maxLength="3"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Currency Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCurrencyName}
                onChange={(e) => setNewCurrencyName(e.target.value)}
                className={inputClass}
                placeholder="e.g., Japanese Yen"
              />
              <button
                onClick={handleAddCurrency}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition shadow-md disabled:opacity-50 flex items-center gap-2"
                disabled={!newCurrencyCode || !newCurrencyName}
              >
                <Plus size={18} />
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencySettings;