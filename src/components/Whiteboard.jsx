// src/components/Whiteboard.jsx
import React, { useState, useRef, useEffect } from "react"
import { X, PenTool, Eraser, Undo, Redo, Download } from "lucide-react"

const Whiteboard = ({ darkMode, isInstructor, roomId, onClose }) => {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState("pen")
  const [color, setColor] = useState("#000000")
  const [size, setSize] = useState(3)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    canvas.width = canvas.parentElement.clientWidth - 40
    canvas.height = 400
    ctx.fillStyle = darkMode ? "#1a1a2e" : "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [darkMode])

  const startDrawing = (e) => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    const rect = canvas.getBoundingClientRect()
    setIsDrawing(true)
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.strokeStyle = tool === "eraser" ? (darkMode ? "#1a1a2e" : "#ffffff") : color
    ctx.lineWidth = size
  }

  const draw = (e) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    const rect = canvas.getBoundingClientRect()
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
  }

  const stopDrawing = () => setIsDrawing(false)

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    ctx.fillStyle = darkMode ? "#1a1a2e" : "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-5xl rounded-2xl shadow-2xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className={`flex items-center justify-between p-4 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
          <div className="flex items-center gap-3">
            <PenTool className="w-5 h-5 text-purple-500" />
            <h3 className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Whiteboard</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className={`flex items-center gap-2 p-3 border-b ${darkMode ? "border-gray-700" : "border-gray-200"} flex-wrap`}>
          <button onClick={() => setTool("pen")} className={`p-2 rounded-lg ${tool === "pen" ? "bg-purple-600 text-white" : ""}`}><PenTool className="w-4 h-4" /></button>
          <button onClick={() => setTool("eraser")} className={`p-2 rounded-lg ${tool === "eraser" ? "bg-purple-600 text-white" : ""}`}><Eraser className="w-4 h-4" /></button>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" disabled={tool === "eraser"} />
          <input type="range" min="1" max="20" value={size} onChange={(e) => setSize(parseInt(e.target.value))} className="w-24" />
          <button onClick={clearCanvas} className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600">Clear</button>
          <button onClick={() => { const link = document.createElement("a"); link.download = "whiteboard.png"; link.href = canvasRef.current?.toDataURL(); link.click(); }} className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 ml-auto"><Download className="w-4 h-4" /></button>
        </div>
        <div className="p-4">
          <canvas ref={canvasRef} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} className={`w-full rounded-lg border ${darkMode ? "border-gray-700" : "border-gray-200"}`} style={{ height: "400px", cursor: "crosshair" }} />
        </div>
      </div>
    </div>
  )
}

export default Whiteboard
