import React, { useRef } from "react";

const Certificate = ({ userName, courseName, completionDate, darkMode, onClose, certificateId }) => {
  const certificateRef = useRef(null);

  const formatDate = (date) => {
    if (!date) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const displayCertId = certificateId || `MP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const websiteUrl = "www.learnflow.com";

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const certificateHtml = certificateRef.current.outerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate of Completion - ${courseName}</title>
        <style>
          @media print {
            body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none; }
          }
          body {
            margin: 0;
            padding: 40px;
            background: white;
            font-family: 'Georgia', 'Times New Roman', serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .certificate-container { width: 800px; max-width: 100%; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div class="certificate-container">${certificateHtml}</div>
        <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPDF = async () => {
    try {
      // Dynamically import html2canvas and jspdf
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      const element = certificateRef.current;
      
      // Show loading indicator
      const loadingDiv = document.createElement('div');
      loadingDiv.innerHTML = 'Generating PDF... Please wait';
      loadingDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border-radius:10px;z-index:10000;box-shadow:0 0 20px rgba(0,0,0,0.2);font-weight:bold;';
      document.body.appendChild(loadingDiv);
      
      const canvas = await html2canvas(element, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Certificate_${courseName.replace(/\s/g, '_')}_${userName.replace(/\s/g, '_')}.pdf`);
      
      document.body.removeChild(loadingDiv);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again or use Print instead.");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Certificate of Completion - ${courseName}`,
        text: `I have successfully completed ${courseName} on learnFlow!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`I have successfully completed ${courseName} on learnFlow! Certificate ID: ${displayCertId}`);
      alert("Certificate information copied to clipboard!");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative max-w-4xl w-full">
        {/* Certificate */}
        <div
          ref={certificateRef}
          className="relative bg-white rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)" }}
        >
          {/* Decorative Border */}
          <div className="absolute inset-4 border-4 border-double border-purple-600 rounded-xl pointer-events-none" />
          
          {/* Decorative Corners */}
          <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-l-4 border-purple-600 rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-24 h-24 border-t-4 border-r-4 border-purple-600 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 border-b-4 border-l-4 border-purple-600 rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-24 h-24 border-b-4 border-r-4 border-purple-600 rounded-br-2xl" />

          {/* Background Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <div className="text-8xl font-bold text-gray-800 transform -rotate-12">learnFlow</div>
          </div>

          {/* Website URL at top */}
          <div className="absolute top-6 right-8 text-xs text-gray-400 font-mono">
            {websiteUrl}
          </div>

          <div className="text-center p-12 relative z-10">
            {/* Logo/Seal */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center shadow-xl">
                <span className="text-4xl">🌊</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-5xl font-bold text-gray-800 mb-2" style={{ fontFamily: "'Georgia', serif", letterSpacing: '2px' }}>
              Certificate of Completion
            </h1>
            <div className="w-32 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 mx-auto my-4" />

            {/* Body */}
            <p className="text-lg text-gray-600 mb-4">This certificate is proudly presented to</p>
            
            {/* Owner Name - Large and prominent */}
            <h2 className="text-5xl font-bold text-purple-600 mb-4" style={{ fontFamily: "'Courier New', monospace", letterSpacing: '2px' }}>
              {userName || "Valued Student"}
            </h2>
            
            <p className="text-lg text-gray-600 mb-2">for successfully completing the course</p>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              {courseName || "Course Name"}
            </h3>

            <p className="text-sm text-gray-500 max-w-md mx-auto mb-8">
              This certificate acknowledges the dedication, hard work, and mastery of skills demonstrated throughout the course.
            </p>

            {/* Date, Certificate ID, and Signature */}
            <div className="flex justify-between items-end mt-8 pt-8">
              <div className="text-left">
                <div className="w-40 h-0.5 bg-gray-300 mb-2" />
                <p className="text-sm text-gray-500">Completion Date</p>
                <p className="font-semibold text-gray-700">{formatDate(completionDate)}</p>
              </div>
              <div className="text-center">
                <div className="w-40 h-0.5 bg-gray-300 mb-2" />
                <p className="text-sm text-gray-500">Certificate ID</p>
                <p className="font-mono text-xs text-gray-600">{displayCertId}</p>
              </div>
              <div className="text-right">
                <div className="w-40 h-0.5 bg-gray-300 mb-2" />
                <p className="text-sm text-gray-500">Authorized Signature</p>
                <div className="flex items-center justify-end gap-1">
                  <svg className="w-16 h-8" viewBox="0 0 100 30">
                    <path d="M10,20 Q30,5 50,20 T90,15" stroke="#4f46e5" fill="none" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-xs text-gray-500 mt-1">learnFlow Team</p>
              </div>
            </div>

            {/* Footer with Website */}
            <div className="mt-8 pt-4 text-center">
              <p className="text-xs text-gray-400">
                This certificate is issued by learnFlow Learning Platform and verifies the completion of the specified course.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Verify at: {websiteUrl}/verify/{displayCertId}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6 justify-center no-print flex-wrap">
          <button
            onClick={handlePrint}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
          >
            🖨️ Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
          >
            📥 Download PDF
          </button>
          <button
            onClick={handleShare}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
          >
            📤 Share
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Certificate;