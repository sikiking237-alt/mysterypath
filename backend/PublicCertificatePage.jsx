import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader, AlertCircle, ShieldCheck, XCircle } from 'lucide-react';

const PublicCertificatePage = ({ darkMode }) => {
  const { certificateId } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/certificates/view/${certificateId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          setCertificate(data.certificate);
        } else {
          throw new Error(data.error || 'Certificate not found.');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (certificateId) {
      fetchCertificate();
    }
  }, [certificateId]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Verifying certificate...</p>
        </div>
      );
    }

    if (error || !certificate) {
      return (
        <div className="text-center text-red-500">
          <XCircle className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Verification Failed</h2>
          <p className="mt-2">{error || 'This certificate is invalid or could not be found.'}</p>
        </div>
      );
    }

    return (
      <>
        <div className="text-center text-green-600 dark:text-green-400 mb-6">
          <ShieldCheck className="w-12 h-12 mx-auto mb-2" />
          <h2 className="text-2xl font-bold">Certificate Verified</h2>
        </div>
        <div className="text-center">
            <div className="text-6xl mb-4">🎓</div>
            <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">Certificate of Completion</h2>
            <div className="border-b-2 border-indigo-600 w-20 mx-auto my-3"></div>
            
            <p className="text-gray-600 dark:text-gray-400 mt-4">This certificate is proudly presented to</p>
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 my-4">{certificate.user_name}</p>
            
            <p className="text-gray-600 dark:text-gray-400">for successfully completing</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white my-2">{certificate.course_title}</p>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Completion Date: {new Date(certificate.completion_date).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-mono break-all">
              Certificate ID: {certificate.certificate_id}
            </p>
        </div>
      </>
    );
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className={`w-full max-w-2xl p-8 rounded-2xl shadow-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {renderContent()}
        <div className="text-center mt-8">
            <Link to="/" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                Return to MysteryPath
            </Link>
        </div>
      </div>
    </div>
  );
};

export default PublicCertificatePage;