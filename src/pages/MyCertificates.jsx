// frontend/src/pages/MyCertificates.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Printer, ExternalLink, Loader, AlertCircle, Share2, Copy } from "lucide-react";
import { QRCodeSVG as QRCode } from "qrcode.react";

const MyCertificates = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCert, setShowCert] = useState(null);
  
  const token = localStorage.getItem("token");
  const userName = (() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user.name || "Student";
    } catch {
      return "Student";
    }
  })();

  const fetchCertificates = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching certificates...");
      const response = await fetch("/api/certificates/my", {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Certificates received:", data);
      
      let certs = [];
      if (data && data.success && Array.isArray(data.certificates)) {
        certs = data.certificates;
      } else if (Array.isArray(data)) {
        certs = data;
      } else if (data && data.certificates && Array.isArray(data.certificates)) {
        certs = data.certificates;
      } else {
        console.warn("Unexpected response format:", data);
        certs = [];
      }
      
      setCertificates(certs);
      
    } catch (error) {
      console.error("Fetch error:", error);
      setError(error.message || "Failed to fetch certificates");
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const generateCertificate = async (courseId, courseTitle) => {
    try {
      const response = await fetch("/api/certificates/generate", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ course_id: courseId })
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchCertificates();
        alert(`🎉 Certificate for "${courseTitle}" generated successfully!`);
      } else {
        alert(data.error || 'Failed to generate certificate');
      }
    } catch (error) {
      console.error("Error generating certificate:", error);
      alert('Error generating certificate: ' + error.message);
    }
  };

  const downloadCertificate = async (cert) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print certificates');
      return;
    }

    const publicUrl = `${window.location.origin}/verify-certificate/${cert.certificate_id}`;

    const certHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate - ${cert.course_title}</title>
          <style>
            body { margin: 0; padding: 40px; font-family: 'Georgia', serif; background: #f5f3ff; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            .certificate { max-width: 800px; width: 100%; padding: 60px; background: white; border: 8px solid #8b5cf6; border-radius: 20px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.1); }
            .icon { font-size: 80px; margin-bottom: 20px; }
            h1 { color: #7c3aed; font-size: 32px; margin-bottom: 10px; }
            .divider { width: 100px; height: 2px; background: #7c3aed; margin: 20px auto; }
            .subtitle { color: #6b7280; font-size: 16px; }
            .name { font-size: 48px; font-weight: bold; color: #7c3aed; margin: 20px 0; }
            .course { font-size: 24px; font-weight: bold; color: #1f2937; margin: 10px 0; }
            .details { color: #6b7280; font-size: 14px; margin-top: 30px; }
            .cert-id { font-family: monospace; font-size: 12px; color: #9ca3af; margin-top: 20px; }
            .qr-code { margin: 20px auto; display: block; }
            @media print { body { background: white; padding: 20px; } .certificate { box-shadow: none; border-color: #7c3aed; } }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="icon">🎓</div>
            <h1>Certificate of Completion</h1>
            <div class="divider"></div>
            <p class="subtitle">This certificate is proudly presented to</p>
            <div class="name">${userName}</div>
            <p class="subtitle">for successfully completing</p>
            <div class="course">${cert.course_title}</div>
            <div class="details">Completion Date: ${new Date(cert.issued_date).toLocaleDateString()}</div>
            <div class="cert-id">Certificate ID: ${cert.certificate_id}</div>
            <div class="qr-code">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(publicUrl)}" alt="QR Code" />
            </div>
          </div>
          <script>
            window.onload = function() { 
              setTimeout(window.print, 500); 
            }
          <\/script>
        </body>
      </html>
    `;
    
    printWindow.document.write(certHTML);
    printWindow.document.close();
  };

  const handleViewCertificate = (cert) => {
    setShowCert(cert);
  };

  const handleShare = (cert) => {
    const publicUrl = `${window.location.origin}/verify-certificate/${cert.certificate_id}`;
    navigator.clipboard.writeText(publicUrl).then(() => {
      alert(`Copied to clipboard:\n${publicUrl}`);
    }, (err) => {
      console.error('Could not copy text: ', err);
      alert('Failed to copy link.');
    });
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchCertificates();
  }, []);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Loading your certificates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
          <button 
            onClick={fetchCertificates}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>🎓 My Certificates</h1>
            <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {certificates.length} certificate{certificates.length !== 1 ? 's' : ''} earned
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button 
              onClick={fetchCertificates} 
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <span>🔄</span> Refresh
            </button>
             <button 
               onClick={setDarkMode} 
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg transition"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button 
              onClick={() => navigate("/my-learning")} 
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Back to Learning
            </button>
          </div>
        </div>

        {certificates.length === 0 ? (
          <div className={`text-center py-16 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="text-6xl mb-4">🎓</div>
            <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>No certificates yet</h2>
            <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Complete a course to earn a certificate!</p>
            <button 
              onClick={() => navigate("/")} 
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg transition"
            >
              Browse Courses →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map(cert => (
              <div key={cert.id} className={`rounded-2xl overflow-hidden shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 text-center text-white">
                  <div className="text-5xl mb-3">🎓</div>
                  <h3 className="text-lg font-bold truncate">{cert.course_title}</h3>
                </div>
                <div className="p-5">
                  <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Completed: {cert.issued_date_formatted || new Date(cert.issued_date).toLocaleDateString()}
                  </p>
                  <p className={`text-xs mb-4 font-mono ${darkMode ? 'text-gray-500' : 'text-gray-400'} truncate`}>
                    ID: {cert.certificate_id}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleViewCertificate(cert)}
                      className="py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => downloadCertificate(cert)}
                      className="py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button
                      onClick={() => handleShare(cert)}
                      className="col-span-2 py-2 bg-gray-600 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition flex items-center justify-center gap-2 mt-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certificate Modal */}
      {showCert && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setShowCert(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-6xl mb-4">🎓</div>
            <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">Certificate of Completion</h2>
            <div className="border-b-2 border-indigo-600 w-20 mx-auto my-3"></div>
            
            <p className="text-gray-600 dark:text-gray-400 mt-4">This certificate is proudly presented to</p>
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 my-4">{userName}</p>
            
            <p className="text-gray-600 dark:text-gray-400">for successfully completing</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white my-2">{showCert.course_title}</p>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Completion Date: {showCert.issued_date_formatted || new Date(showCert.issued_date).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-mono break-all">
              Certificate ID: {showCert.certificate_id}
            </p>
            <div className="mt-6 flex justify-center">
              <QRCode 
                value={`${window.location.origin}/verify-certificate/${showCert.certificate_id}`}
                bgColor={darkMode ? '#1f2937' : '#ffffff'}
                fgColor={darkMode ? '#ffffff' : '#000000'}
              />
            </div>
            
            <div className="flex justify-center gap-3 mt-6">
              <button 
                onClick={() => downloadCertificate(showCert)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button 
                onClick={() => window.print()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button 
                onClick={() => setShowCert(null)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCertificates;