// src/components/LiveVideoClass.jsx
import React, { useState, useRef, useEffect } from "react"
import { X, Mic, MicOff, Video, VideoOff, Users, MessageCircle, Send, Camera } from "lucide-react"

const LiveVideoClass = ({ darkMode, isInstructor, userName, roomId, onClose }) => {
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const videoRef = useRef(null)

  useEffect(() => {
    if (videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => { videoRef.current.srcObject = stream })
        .catch(() => {})
    }
  }, [])

  const sendMessage = (e) => {
    e.preventDefault()
    if (newMessage.trim()) {
      setMessages([...messages, { id: Date.now(), user: userName || "You", text: newMessage, time: new Date().toLocaleTimeString() }])
      setNewMessage("")
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className={`w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>
        <div className={`flex items-center justify-between p-4 ${darkMode ? "bg-gray-800" : "bg-white"} rounded-t-2xl`}>
          <div className="flex items-center gap-3">
            <Camera className="w-5 h-5 text-purple-500" />
            <h3 className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Live Class: {roomId}</h3>
            <span className={`text-xs px-2 py-1 rounded ${darkMode ? "bg-gray-700 text-green-400" : "bg-green-100 text-green-700"}`}>● Live</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="flex-1 p-4">
            <div className={`relative rounded-xl overflow-hidden ${darkMode ? "bg-gray-800" : "bg-black"} aspect-video`}>
              <video ref={videoRef} autoPlay muted={isMuted} className={`w-full h-full object-cover ${isVideoOff ? "hidden" : ""}`} />
              {isVideoOff && <div className="w-full h-full flex items-center justify-center text-white"><VideoOff className="w-16 h-16 mx-auto mb-4 opacity-50" /><p>Camera is off</p></div>}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
                <button onClick={() => setIsMuted(!isMuted)} className={`p-2 rounded-full transition ${isMuted ? "bg-red-600" : "bg-gray-600 hover:bg-gray-500"}`}>
                  {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
                </button>
                <button onClick={() => setIsVideoOff(!isVideoOff)} className={`p-2 rounded-full transition ${isVideoOff ? "bg-red-600" : "bg-gray-600 hover:bg-gray-500"}`}>
                  {isVideoOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
                </button>
              </div>
            </div>
          </div>
          <div className={`w-full md:w-80 flex flex-col ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className={`flex items-center justify-between p-3 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
              <span className="flex items-center gap-2 text-sm font-medium"><MessageCircle className="w-4 h-4" /> Chat</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[300px]">
              {messages.map(msg => (
                <div key={msg.id}><span className={`text-xs font-medium ${darkMode ? "text-purple-400" : "text-purple-600"}`}>{msg.user}</span> <span className={`text-[10px] ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{msg.time}</span><p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{msg.text}</p></div>
              ))}
            </div>
            <form onSubmit={sendMessage} className={`p-3 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className="flex gap-2">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className={`flex-1 px-3 py-2 rounded-lg text-sm outline-none ${darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"}`} />
                <button type="submit" disabled={!newMessage.trim()} className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"><Send className="w-4 h-4" /></button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveVideoClass

