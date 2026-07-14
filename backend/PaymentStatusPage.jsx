// src/pages/PaymentStatusPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { apiCall } from '../config/apiConfig';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const PaymentStatusPage = ({ darkMode }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, failed, error
    const [message, setMessage] = useState('Verifying your payment, please wait...');

    useEffect(() => {
        const verify = async () => {
            const params = new URLSearchParams(location.search);
            const reference = params.get('reference');

            if (!reference) {
                setStatus('error');
                setMessage('No payment reference found. Your payment cannot be verified.');
                return;
            }

            try {
                const response = await apiCall(`/api/payment/verify?reference=${reference}`);
                if (response.success) {
                    setStatus('success');
                    setMessage(response.message || 'Payment successful! You are now enrolled.');
                    // Redirect to my-learning after a few seconds
                    setTimeout(() => {
                        navigate('/my-learning');
                    }, 3000);
                } else {
                    setStatus('failed');
                    setMessage(response.message || 'Payment was not successful. Please try again or contact support.');
                }
            } catch (err) {
                setStatus('error');
                setMessage('A server error occurred while verifying your payment. Please contact support.');
                console.error("Verification error:", err);
            }
        };

        verify();
    }, [location, navigate]);

    const renderIcon = () => {
        switch (status) {
            case 'verifying':
                return <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />;
            case 'success':
                return <CheckCircle className="w-16 h-16 text-green-500" />;
            case 'failed':
                return <XCircle className="w-16 h-16 text-red-500" />;
            case 'error':
                return <AlertTriangle className="w-16 h-16 text-yellow-500" />;
            default:
                return null;
        }
    };

    const getCardClass = () => {
        switch (status) {
            case 'success': return 'border-green-500';
            case 'failed': return 'border-red-500';
            case 'error': return 'border-yellow-500';
            default: return darkMode ? 'border-gray-700' : 'border-gray-200';
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
            <div className={`w-full max-w-md p-8 rounded-2xl shadow-2xl border-t-4 ${getCardClass()} ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="text-center">
                    <div className="mx-auto mb-6 flex items-center justify-center">{renderIcon()}</div>
                    <h1 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {status === 'verifying' && 'Payment Verification'}
                        {status === 'success' && 'Payment Successful!'}
                        {status === 'failed' && 'Payment Failed'}
                        {status === 'error' && 'Verification Error'}
                    </h1>
                    <p className={`text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{message}</p>
                    {status === 'success' && <p className="text-sm text-gray-500 mt-4">Redirecting you to your courses...</p>}
                    {(status === 'failed' || status === 'error') && <div className="mt-8"><Link to="/courses" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">Back to Courses</Link></div>}
                </div>
            </div>
        </div>
    );
};

export default PaymentStatusPage;