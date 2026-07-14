// src/components/Admin/ManagePayouts.jsx
import React, { useState, useEffect } from 'react';
import { apiCall, apiEndpoints } from '../../config/apiConfig';
import { DollarSign, Banknote, Smartphone, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const ManagePayouts = ({ darkMode }) => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPayouts = async () => {
      setLoading(true);
      setError('');
      try {
        // NOTE: Ensure you add `payouts: `${API_BASE_URL}/admin/payouts`,` to your apiConfig.js
        const response = await apiCall(apiEndpoints.admin.payouts, { method: 'GET' });
        if (response.success) {
          setPayouts(response.payouts);
        } else {
          setError(response.error || 'Failed to fetch payout information.');
        }
      } catch (err) {
        setError('An error occurred while connecting to the server.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayouts();
  }, []);

  const PayoutDetails = ({ payout }) => {
    if (!payout || !payout.payout_details) {
      return <span className="text-xs text-gray-500 italic">No details provided</span>;
    }

    const { payout_type, details } = payout.payout_details;

    if (payout_type === 'mobile_money') {
      return (
        <div className="flex items-center gap-3">
          <Smartphone size={18} className="text-green-500 flex-shrink-0" />
          <div>
            <div className="font-mono text-sm">{details.phone_number}</div>
            <div className="text-xs text-gray-500">{details.provider}</div>
          </div>
        </div>
      );
    }

    if (payout_type === 'bank_account') {
      return (
        <div className="flex items-center gap-3">
          <Banknote size={18} className="text-blue-500 flex-shrink-0" />
          <div>
            <div className="font-semibold text-sm">{details.account_name}</div>
            <div className="font-mono text-xs text-gray-500">{details.account_number} - {details.bank_name}</div>
          </div>
        </div>
      );
    }

    return <span className="text-xs text-gray-500">Unknown payout type</span>;
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading Payouts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        <AlertTriangle size={40} className="mx-auto mb-2" />
        <p className="font-semibold">Error loading data</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className={`p-6 lg:p-8 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      <div className="flex items-center gap-4 mb-8">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? 'bg-green-900/50' : 'bg-green-100'}`}>
          <DollarSign size={24} className="text-green-500" />
        </div>
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Instructor Payouts
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            View and manage instructor payment details.
          </p>
        </div>
      </div>

      <div className={`rounded-2xl shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Instructor</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Payout Method & Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {payouts.map((payout) => (
                <tr key={payout.instructor_id} className={`transition-colors ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold">{payout.instructor_name}</div>
                    <div className="text-xs text-gray-500">{payout.instructor_email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <PayoutDetails payout={payout} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${darkMode ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}`}>
                      <Clock size={12} />
                      Pending
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {payout.updated_at ? new Date(payout.updated_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => alert('This would mark the payout as complete.')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${darkMode ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                    >
                      <CheckCircle size={14} />
                      Mark as Paid
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagePayouts;