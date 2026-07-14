import React, { useState } from 'react';

const OAuthTest = () => {
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => {
    setLogs(prev => [...prev, msg]);
    console.log(msg);
  };

  const testConfig = () => {
    setLogs([]);
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = 'http://localhost:5173/auth/callback';
    
    addLog('🔍 Testing Google OAuth Configuration');
    addLog('📋 Client ID: ' + (clientId || '❌ NOT FOUND'));
    addLog('📋 Redirect URI: ' + redirectUri);
    
    if (!clientId) {
      addLog('❌ ERROR: Client ID not found!');
      return;
    }
    
    if (clientId === 'your-google-client-id.apps.googleusercontent.com') {
      addLog('❌ ERROR: Using placeholder Client ID!');
      return;
    }
    
    addLog('✅ Client ID looks valid');
    addLog('✅ Redirect URI: ' + redirectUri);
    addLog('');
    addLog('📌 IMPORTANT:');
    addLog('1. Go to https://console.cloud.google.com/apis/credentials');
    addLog('2. Edit your OAuth 2.0 Client ID');
    addLog('3. Add this redirect URI: http://localhost:5173/auth/callback');
    addLog('4. Click SAVE and wait 2-3 minutes');
    addLog('5. Restart the dev server');
  };

  const redirectToGoogle = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = 'http://localhost:5173/auth/callback';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email%20profile&access_type=offline&prompt=select_account`;
    window.location.href = authUrl;
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">🔑 Google OAuth Test</h1>
      
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
        <p className="font-medium">Current Configuration:</p>
        <p className="text-sm">Client ID: {import.meta.env.VITE_GOOGLE_CLIENT_ID || '❌ NOT SET'}</p>
        <p className="text-sm">Redirect URI: http://localhost:5173/auth/callback</p>
      </div>
      
      <div className="flex gap-4 mb-4">
        <button onClick={testConfig} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          🔍 Test Configuration
        </button>
        <button onClick={redirectToGoogle} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
          🚀 Go to Google
        </button>
      </div>
      
      {logs.length > 0 && (
        <div className="p-4 bg-black text-green-400 rounded-lg font-mono text-sm overflow-auto max-h-96">
          {logs.map((log, i) => (<div key={i}>{log}</div>))}
        </div>
      )}
    </div>
  );
};

export default OAuthTest;
