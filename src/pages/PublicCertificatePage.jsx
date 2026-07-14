// frontend/src/pages/PublicCertificatePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { CheckCircle, AlertCircle, Loader, Download, Printer, Share2 } from 'lucide-react';

const PublicCertificatePage = ({ darkMode }) => {
  const { certificateId } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);

  useEffect(() => {
    const verifyCertificate = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/certificates/verify/${certificateId}`);
        const data = await response.json();
        
        if (data.success) {
          setCertificate(data.certificate);
          setVerificationStatus('valid');
        } else {
          setError(data.error || 'Certificate not found');
          setVerificationStatus('invalid');
        }
      } catch (err) {
        setError('Failed to verify certificate');
        setVerificationStatus('error');
      } finally {
        setLoading(false);
      }
    };
    
    verifyCertificate();
  }, [certificateId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Implementation for downloading certificate
    window.print();
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `Certificate Verification - ${certificate?.course_title || 'Certificate'}`,
        text: `Verify this certificate: ${certificate?.certificate_id}`,
        url: url,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url).then(() => {
        alert('Link copied to clipboard!');
      }).catch(console.error);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Verifying certificate...</p>
        </div>
      </div>
    );
  }

  if (error || verificationStatus === 'invalid') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center max-w-md">
          <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <h1 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Certificate Not Found</h1>
          <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            The certificate you're looking for doesn't exist or has been revoked.
          </p>
          <Link to="/" className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return null;
  }

  const verificationUrl = `${window.location.origin}/verify-certificate/${certificateId}`;

  return (
    <div className={`min-h-screen p-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-3xl mx-auto">
        {/* Certificate Display */}
        <div className={`rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`} id="certificate-content">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-8 text-center text-white">
            <div className="text-6xl mb-4">🎓</div>
            <h1 className="text-3xl font-bold">Certificate of Completion</h1>
            <div className="w-24 h-1 bg-white/50 mx-auto mt-3"></div>
          </div>

          {/* Body */}
          <div className="p-8 text-center">
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              This certificate is proudly presented to
            </p>
            <h2 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 my-4">
              {certificate.user_name}
            </h2>
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              for successfully completing
            </p>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white my-4">
              {certificate.course_title}
            </h3>
            
            <div className="flex justify-center gap-8 mt-6 text-sm text-gray-500 dark:text-gray-400">
              <div>
                <span className="block font-semibold text-gray-700 dark:text-gray-300">Date</span>
                {new Date(certificate.issued_date).toLocaleDateString()}
              </div>
              <div>
                <span className="block font-semibold text-gray-700 dark:text-gray-300">Certificate ID</span>
                <span className="font-mono text-xs">{certificate.certificate_id}</span>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mt-6">
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <QRCode 
                  value={verificationUrl} 
                  size={150}
                  bgColor={darkMode ? '#374151' : '#ffffff'}
                  fgColor={darkMode ? '#ffffff' : '#000000'}
                />
              </div>
            </div>

            {/* Verification Badge */}
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Verified Certificate</span>
            </div>
          </div>

          {/* Footer */}
          <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-6 text-center text-sm text-gray-500 dark:text-gray-400`}>
            <p>This certificate can be verified at {window.location.origin}/verify-certificate/{certificateId}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <button
            onClick={handlePrint}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <Printer className="w-5 h-5" />
            Print
          </button>
          <button
            onClick={handleDownload}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download
          </button>
          <button
            onClick={handleShare}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            Share
          </button>
          <Link
            to="/"
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PublicCertificatePage;