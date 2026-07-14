// src/components/LiveCodeSession.jsx
import React, { useState } from "react"
import { X, Play, Terminal, Code2, Users } from "lucide-react"

const LiveCodeSession = ({ darkMode, isInstructor, roomId, onClose }) => {
  const [code, setCode] = useState(`// Welcome to the live code session!\nfunction greet(name) {\n  return \`Hello, \${name}!\`;\n}\nconsole.log(greet("Student"));`)
  const [output, setOutput] = useState("")
  const [isRunning, setIsRunning] = useState(false)

  const runCode = () => {
    setIsRunning(true)
    try {
      const logs = []
      const originalLog = console.log
      console.log = (...args) => { logs.push(args.join(" ")); originalLog(...args) }
      eval(code)
      console.log = originalLog
      setOutput(logs.join("\n") || "Code executed successfully")
    } catch (error) {
      setOutput(`Error: ${error.message}`)
    }
    setIsRunning(false)
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className={`flex items-center justify-between p-4 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
          <div className="flex items-center gap-3">
            <Code2 className="w-5 h-5 text-purple-500" />
            <h3 className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Live Code Session</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          <div className="flex-1 p-4">
            <div className={`rounded-lg overflow-hidden border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className={`flex items-center gap-2 px-4 py-2 ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>
                <Terminal className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-medium">JavaScript</span>
              </div>
              <textarea value={code} onChange={(e) => setCode(e.target.value)} className={`w-full h-64 p-4 font-mono text-sm focus:outline-none resize-none ${darkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-900"}`} spellCheck="false" />
            </div>
            {isInstructor && (
              <button onClick={runCode} disabled={isRunning} className="flex items-center gap-2 px-4 py-2 mt-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50">
                <Play className="w-4 h-4" /> {isRunning ? "Running..." : "Run Code"}
              </button>
            )}
          </div>
          <div className={`w-full md:w-80 border-t md:border-t-0 md:border-l ${darkMode ? "border-gray-700" : "border-gray-200"} p-4`}>
            <h4 className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Output</h4>
            <div className={`w-full h-48 p-3 rounded-lg font-mono text-xs overflow-auto ${darkMode ? "bg-gray-900 text-gray-300" : "bg-gray-50 text-gray-900"}`}>
              {output || 'Click "Run Code" to see output...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveCodeSession
