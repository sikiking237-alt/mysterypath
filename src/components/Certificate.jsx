import React, { useRef } from "react";

const Certificate = ({ userName, courseName, completionDate, darkMode, onClose, certificateId }) => {
  const certificateRef = useRef(null);

  const formatDate = (date) => {
    if (!date) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const displayCertId = certificateId || `MP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const websiteUrl = "www.mysterypath.com";

  const handleDownload = () => {
    const element = certificateRef.current;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate - ${courseName}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            font-family: 'Georgia', 'Times New Roman', serif;
            padding: 40px;
          }
          .certificate-wrapper { max-width: 900px; width: 100%; margin: 0 auto; }
          .certificate {
            background: white;
            border-radius: 20px;
            padding: 50px;
            text-align: center;
            position: relative;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          }
          .logo {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
          }
          .logo span { font-size: 45px; }
          h1 { font-size: 36px; color: #1f2937; letter-spacing: 2px; margin-bottom: 10px; }
          .student-name { font-size: 48px; font-weight: bold; color: #667eea; margin: 20px 0; font-family: 'Brush Script MT', cursive; }
          .course-name { font-size: 24px; font-weight: bold; color: #764ba2; margin: 15px 0; background: #f3e8ff; display: inline-block; padding: 10px 30px; border-radius: 50px; }
          .details { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          .detail-item { text-align: center; flex: 1; }
          .detail-label { font-size: 11px; color: #9ca3af; text-transform: uppercase; }
          .detail-value { font-size: 13px; font-weight: bold; color: #374151; margin-top: 5px; }
          .signature { margin-top: 30px; font-family: 'Brush Script MT', cursive; font-size: 28px; color: #374151; }
          .footer { margin-top: 20px; font-size: 10px; color: #9ca3af; }
          @media print {
            body { background: white; padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="certificate-wrapper">${element.outerHTML}</div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Certificate_${courseName.replace(/\s/g, '_')}_${userName.replace(/\s/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate - ${courseName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            font-family: 'Georgia', 'Times New Roman', serif;
            padding: 40px;
          }
          .certificate-wrapper { max-width: 900px; width: 100%; }
          .certificate {
            background: white;
            border-radius: 20px;
            padding: 50px;
            text-align: center;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          }
          .logo {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
          }
          .logo span { font-size: 45px; }
          h1 { font-size: 36px; color: #1f2937; letter-spacing: 2px; margin-bottom: 10px; }
          .student-name { font-size: 48px; font-weight: bold; color: #667eea; margin: 20px 0; font-family: 'Brush Script MT', cursive; }
          .course-name { font-size: 24px; font-weight: bold; color: #764ba2; margin: 15px 0; background: #f3e8ff; display: inline-block; padding: 10px 30px; border-radius: 50px; }
          .details { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          .detail-item { text-align: center; flex: 1; }
          .detail-label { font-size: 11px; color: #9ca3af; text-transform: uppercase; }
          .detail-value { font-size: 13px; font-weight: bold; color: #374151; margin-top: 5px; }
          .signature { margin-top: 30px; font-family: 'Brush Script MT', cursive; font-size: 28px; color: #374151; }
          .footer { margin-top: 20px; font-size: 10px; color: #9ca3af; }
          @media print { body { background: white; padding: 0; } }
        </style>
      </head>
      <body>
        <div class="certificate-wrapper">${certificateRef.current.outerHTML}</div>
        <script>window.print();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-auto" style={{ background: 'linear-gradient(135deg, #9333ea 0%, #db2777 100%)' }}>
      <div className="max-w-3xl w-full">
        {/* Certificate Card */}
        <div ref={certificateRef} className="bg-white rounded-2xl shadow-2xl p-10 text-center relative">
          {/* Decorative border */}
          <div className="absolute inset-4 border-2 border-gray-100 rounded-xl pointer-events-none" />
          
          {/* Logo / Seal */}
          <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
            <span className="text-4xl">🎓</span>
          </div>
          
          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-800 mb-2">CERTIFICATE OF COMPLETION</h1>
          <div className="w-24 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto my-3" />
          
          <p className="text-gray-500 mt-4">This certificate is proudly presented to</p>
          
          {/* STUDENT NAME - LARGE AND VISIBLE */}
          <div className="text-5xl font-bold text-purple-600 my-4" style={{ fontFamily: "'Brush Script MT', cursive" }}>
            {userName || "Valued Student"}
          </div>
          
          <p className="text-gray-500">for successfully completing the course</p>
          
          {/* Course Name */}
          <div className="text-2xl font-bold text-purple-700 my-4 bg-purple-50 inline-block px-8 py-2 rounded-full">
            {courseName || "Course Name"}
          </div>
          
          <p className="text-sm text-gray-400 max-w-md mx-auto mt-4">
            This certificate acknowledges the dedication, hard work, and mastery of skills demonstrated throughout this course.
          </p>
          
          {/* Details Row */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            <div className="text-center flex-1">
              <div className="text-xs text-gray-400 uppercase">Completion Date</div>
              <div className="text-sm font-semibold text-gray-700 mt-1">{formatDate(completionDate)}</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-xs text-gray-400 uppercase">Certificate ID</div>
              <div className="text-xs font-mono text-gray-600 mt-1">{displayCertId}</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-xs text-gray-400 uppercase">Platform</div>
              <div className="text-sm font-semibold text-gray-700 mt-1">MysteryPath</div>
            </div>
          </div>
          
          {/* Signature */}
          <div className="mt-6" style={{ fontFamily: "'Brush Script MT', cursive", fontSize: '28px', color: '#374151' }}>
            learnFlow Team
          </div>
          
          {/* Footer */}
          <div className="mt-4 text-xs text-gray-400">
            Verify at {websiteUrl}/verify/{displayCertId}
          </div>
        </div>

        {/* Buttons - VISIBLE AND CLEAR */}
        <div className="flex gap-4 mt-6 justify-center">
          <button 
            onClick={handlePrint} 
            className="px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-lg transition flex items-center gap-2 shadow-md"
          >
            🖨️ Print Certificate
          </button>
          <button 
            onClick={handleDownload} 
            className="px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-lg transition flex items-center gap-2 shadow-md"
          >
            📥 Download Certificate
          </button>
          <button 
            onClick={onClose} 
            className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Certificate;