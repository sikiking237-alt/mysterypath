import React, { useState, useEffect, useRef } from "react";
import LogoutButton from '../components/LogoutButton';
import { useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";

const FrontendCodingLab = ({ darkMode, onLogout, initialHtml = '', initialCss = '', initialJs = '', isEmbedded = false }) => {
  const navigate = useNavigate();
  const [html, setHtml] = useState(initialHtml || '<div class="container">\n  <h1>Welcome to the Lab</h1>\n  <p>Start coding to see magic happen!</p>\n  <button id="btn">Click Me</button>\n</div>');
  const [css, setCss] = useState(initialCss || 'body {\n  font-family: sans-serif;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n  margin: 0;\n  background: #f0f2f5;\n}\n\n.container {\n  text-align: center;\n  padding: 2rem;\n  background: white;\n  border-radius: 8px;\n  box-shadow: 0 4px 6px rgba(0,0,0,0.1);\n}\n\nh1 {\n  color: #7c3aed;\n}\n\nbutton {\n  background: #7c3aed;\n  color: white;\n  border: none;\n  padding: 0.5rem 1rem;\n  border-radius: 4px;\n  cursor: pointer;\n}');
  const [js, setJs] = useState(initialJs || 'document.getElementById("btn").addEventListener("click", () => {\n  alert("Button Clicked!");\n});');
  const [activeTab, setActiveTab] = useState("html");
  const [srcDoc, setSrcDoc] = useState("");
  const [consoleLogs, setConsoleLogs] = useState([]); // New state for console output
  const iframeRef = useRef(null); // Ref for the iframe
  const consoleEndRef = useRef(null); // Ref for auto-scrolling console

  useEffect(() => {
    const timeout = setTimeout(() => {
      const consoleScript = `
        <script>
          const originalConsoleLog = console.log;
          console.log = (...args) => {
            originalConsoleLog(...args); // Still log to iframe's console
            // Use a try-catch block to prevent errors from crashing the iframe script
            try {
              window.parent.postMessage({
                type: 'console',
                payload: args.map(arg => {
                  if (typeof arg === 'object' && arg !== null) {
                    try {
                      return JSON.stringify(arg); // Stringify objects to avoid DataCloneError
                    } catch (e) {
                      return String(arg); // Fallback for circular structures or complex objects
                    }
                  }
                  return arg;
                })
              }, '*');
            } catch (e) {
              originalConsoleLog('Error sending console message to parent:', e);
            }
          };
          window.onerror = (message, source, lineno, colno, error) => {
            try {
              window.parent.postMessage({ type: 'error', payload: { message, source, lineno, colno, error: error ? error.stack : null } }, '*');
            } catch (e) {
              originalConsoleLog('Error sending error message to parent:', e);
            }
            return false; // Allow default error handling
          };
        </script>
      `;

      setSrcDoc(`
        <html>
          <head>
            <style>${css}</style>
          </head>
          <body>
            ${consoleScript}
            ${html}
            <script>${js}</script>
          </body>
        </html>
      `);
    }, 500);

    return () => clearTimeout(timeout);
  }, [html, css, js]);

  // Effect to listen for messages from the iframe (Console output)
  useEffect(() => {
    const handleMessage = (event) => {
      if (iframeRef.current && event.source === iframeRef.current.contentWindow) {
        const { type, payload } = event.data;
        if (type === 'console') {
          setConsoleLogs(prev => [...prev, { type: 'log', message: payload.join(' ') }]);
        } else if (type === 'error') {
          setConsoleLogs(prev => [...prev, { type: 'error', message: payload.message }]);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Auto-scroll console to bottom when logs update
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [consoleLogs]);

  const downloadCode = () => {
    const content = `
<!DOCTYPE html>
<html>
  <head>
    <title>learnFlow Project</title>
    <style>${css}</style>
  </head>
  <body>
    ${html}
    <script>${js}</script>
  </body>
</html>`;
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lab-project.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: "html", label: "HTML", color: "text-orange-500" },
    { id: "css", label: "CSS", color: "text-blue-500" },
    { id: "js", label: "JS", color: "text-yellow-500" },
    { id: "console", label: "Console", color: "text-purple-500" },
  ];

  const getCode = () => {
    if (activeTab === "html") return html;
    if (activeTab === "css") return css;
    return js;
  };

  const setCode = (val) => {
    if (activeTab === "html") setHtml(val);
    else if (activeTab === "css") setCss(val);
    else setJs(val);
  };

  return (
    <div className={`flex flex-col ${isEmbedded ? 'h-full' : 'h-screen'} ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Lab Header - Simplified when embedded */}
      <div className={`flex items-center justify-between px-6 py-3 border-b ${isEmbedded ? 'h-14' : 'h-16'} ${
        darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}>
        {!isEmbedded ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">L</div>
            <span className={`font-bold text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>Frontend Coding Lab</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-purple-600">
             <span className="text-lg">💻</span> Workspace
          </div>
        )}
        <div className="flex items-center gap-2">
          {!isEmbedded && (
            <div className="mr-2">
              <NotificationBell darkMode={darkMode} />
            </div>
          )}
          <button 
            onClick={downloadCode}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span>📥</span> Download
          </button>
          {!isEmbedded && (
            <>
              <button 
                onClick={() => navigate("/")}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                  darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span>🏠</span> Dashboard
              </button>
              <LogoutButton
                onLogout={onLogout}
                darkMode={darkMode}
                className="px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
              />
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Editor Section */}
        <div className="w-1/2 flex flex-col border-r border-gray-200 dark:border-gray-700">
          <div className="flex bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? `border-purple-600 ${tab.color} bg-white dark:bg-gray-900`
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex-1 relative">
            {activeTab === "console" ? (
              <div className="flex-1 flex flex-col bg-gray-900 h-full overflow-hidden">
                <div className="flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Output Terminal</span>
                  <button 
                    onClick={() => setConsoleLogs([])}
                    className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <span>🧹</span> Clear
                  </button>
                </div>
                <div className="flex-1 p-4 font-mono text-sm overflow-auto custom-scrollbar">
                  {consoleLogs.length === 0 ? (
                    <span className="text-gray-600 italic">No logs to display...</span>
                  ) : (
                    consoleLogs.map((log, index) => (
                      <div key={index} className={`mb-1 flex gap-2 ${log.type === 'error' ? 'text-red-400' : 'text-gray-300'}`}>
                        <span className="text-gray-600 shrink-0">{'>'}</span>
                        <span className="break-all">{log.message}</span>
                      </div>
                    ))
                  )}
                  <div ref={consoleEndRef} />
                </div>
              </div>
            ) : (
              <textarea
                value={getCode()}
                onChange={(e) => setCode(e.target.value)}
                className={`w-full h-full p-4 font-mono text-sm resize-none focus:outline-none ${
                  darkMode 
                    ? "bg-gray-900 text-gray-300 selection:bg-purple-500/30" 
                    : "bg-white text-gray-800 selection:bg-purple-100"
                }`}
                spellCheck="false"
                placeholder={`Enter your ${activeTab.toUpperCase()} code here...`}
              />
            )}
          </div>
        </div>

        {/* Preview Section */}
        <div className="w-1/2 flex flex-col bg-white">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Live Preview</span>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
            </div>
          </div>
          <div className="flex-1 bg-white">
            <iframe
              ref={iframeRef}
              srcDoc={srcDoc}
              title="output"
              sandbox="allow-scripts"
              frameBorder="0"
              width="100%"
              height="100%"
              className="bg-white"
            />
          </div>
        </div>
      </div>
      
      {/* Status Bar */}
      <div className={`px-4 py-2 text-xs border-t ${
        darkMode ? "bg-gray-800 border-gray-700 text-gray-400" : "bg-gray-100 border-gray-200 text-gray-500"
      } flex justify-between`}>
        <div>Ready to code</div>
        <div className="flex gap-4">
          <span>UTF-8</span>
          <span>{activeTab.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};

export default FrontendCodingLab;