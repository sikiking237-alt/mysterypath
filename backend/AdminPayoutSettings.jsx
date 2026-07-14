// src/components/Admin/AdminPayoutSettings.jsx
import React, { useState, useEffect } from 'react';
import { apiCall } from '../../config/apiConfig';
import { DollarSign, Banknote, Smartphone, Save, AlertTriangle, CheckCircle, Loader } from 'lucide-react';

const AdminPayoutSettings = ({ darkMode }) => {
  const [payoutType, setPayoutType] = useState('mobile_money');
  const [details, setDetails] = useState({
    provider: '',
    phone_number: '',
    bank_name: '',
    account_name: '',
    account_number: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchPayoutDetails = async () => {
      setLoading(true);
      setError('');
      try {
        // NOTE: Ensure an endpoint for '/api/payout-details' is available in your apiConfig
        const response = await apiCall('/api/payout-details', { method: 'GET' });
        if (response.success && response.details) {
          setPayoutType(response.details.payout_type);
          setDetails(prev => ({ ...prev, ...response.details.details }));
        } else if (!response.success && response.error) {
          setError(response.error);
        }
      } catch (err) {
        setError('An error occurred while connecting to the server.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayoutDetails();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    let payoutDetails;
    if (payoutType === 'mobile_money') {
      payoutDetails = {
        provider: details.provider,
        phone_number: details.phone_number,
      };
    } else {
      payoutDetails = {
        bank_name: details.bank_name,
        account_name: details.account_name,
        account_number: details.account_number,
      };
    }

    try {
      const response = await apiCall('/api/payout-details', {
        method: 'PUT',
        body: JSON.stringify({
          payout_type: payoutType,
          details: payoutDetails,
        }),
      });

      if (response.success) {
        setSuccess('Payout settings saved successfully!');
      } else {
        setError(response.error || 'Failed to save settings.');
      }
    } catch (err) {
      setError('An error occurred while connecting to the server.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const renderForm = () => {
    if (payoutType === 'mobile_money') {
      return (
        <>
          <div>
            <label htmlFor="provider" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Provider (e.g., MTN, Vodafone)
            </label>
            <input
              type="text"
              name="provider"
              id="provider"
              value={details.provider || ''}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
            />
          </div>
          <div>
            <label htmlFor="phone_number" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Phone Number
            </label>
            <input
              type="text"
              name="phone_number"
              id="phone_number"
              value={details.phone_number || ''}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
            />
          </div>
        </>
      );
    }

    if (payoutType === 'bank_account') {
      return (
        <>
          <div>
            <label htmlFor="bank_name" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Bank Name
            </label>
            <input
              type="text"
              name="bank_name"
              id="bank_name"
              value={details.bank_name || ''}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
            />
          </div>
          <div>
            <label htmlFor="account_name" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Account Name
            </label>
            <input
              type="text"
              name="account_name"
              id="account_name"
              value={details.account_name || ''}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
            />
          </div>
          <div>
            <label htmlFor="account_number" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Account Number
            </label>
            <input
              type="text"
              name="account_number"
              id="account_number"
              value={details.account_number || ''}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
            />
          </div>
        </>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading Settings...</p>
      </div>
    );
  }

  return (
    <div className={`p-6 lg:p-8 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      <div className="flex items-center gap-4 mb-8">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
          <DollarSign size={24} className="text-blue-500" />
        </div>
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Admin Payout Settings
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Set your payout details to receive platform commissions.
          </p>
        </div>
      </div>

      <div className={`rounded-2xl shadow-lg p-6 lg:p-8 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium leading-6">Payout Method</h3>
              <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Select how you'd like to receive your funds.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setPayoutType('mobile_money')}
                className={`flex-1 p-4 rounded-lg border-2 transition-colors flex items-center gap-3 ${
                  payoutType === 'mobile_money'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                    : `border-transparent ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`
                }`}
              >
                <Smartphone className={payoutType === 'mobile_money' ? 'text-indigo-500' : ''} />
                Mobile Money
              </button>
              <button
                type="button"
                onClick={() => setPayoutType('bank_account')}
                className={`flex-1 p-4 rounded-lg border-2 transition-colors flex items-center gap-3 ${
                  payoutType === 'bank_account'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                    : `border-transparent ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`
                }`}
              >
                <Banknote className={payoutType === 'bank_account' ? 'text-indigo-500' : ''} />
                Bank Account
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {renderForm()}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertTriangle size={16} /> {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 text-sm text-green-500">
                <CheckCircle size={16} /> {success}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPayoutSettings;