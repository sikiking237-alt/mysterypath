import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Trash2, Pencil, X, Save } from "lucide-react";
import BackButton from "../components/BackButton";

const FlashcardsPage = ({ darkMode }) => {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");

  useEffect(() => {
    const savedFlashcards = JSON.parse(localStorage.getItem('user_flashcards') || '[]');
    setCards(savedFlashcards);
  }, []);

  const deleteFlashcard = (id) => {
    if (window.confirm("Are you sure you want to delete this flashcard?")) {
      const updatedCards = cards.filter(card => card.id !== id);
      setCards(updatedCards);
      localStorage.setItem('user_flashcards', JSON.stringify(updatedCards));
      setCurrentIndex(0); // Reset to first card after deletion
      setIsFlipped(false);
    }
  };

  const handleEditClick = () => {
    const card = cards[currentIndex];
    setEditFront(card.front);
    setEditBack(card.back);
    setShowEditModal(true);
  };

  const handleUpdateFlashcard = () => {
    const updatedCards = cards.map((card, idx) => {
      if (idx === currentIndex) {
        return { ...card, front: editFront, back: editBack };
      }
      return card;
    });
    setCards(updatedCards);
    localStorage.setItem('user_flashcards', JSON.stringify(updatedCards));
    setShowEditModal(false);
  };

  const nextCard = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col items-center">
      <div className="w-full mb-8 flex items-center gap-4">
        <BackButton darkMode={darkMode} />
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Study Flashcards</h1>
          <p className="text-gray-500">Test your knowledge with quick-fire cards</p>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className={`text-center py-20 rounded-2xl border-2 border-dashed ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <div className="text-6xl mb-4 opacity-20">🃏</div>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>No flashcards yet</h3>
          <p className="text-gray-500 mt-2">Add flashcards from course lessons to start studying!</p>
        </div>
      ) : (
        <div className="w-full max-w-md">
          {/* Actions for current card */}
          <div className="flex justify-end gap-2 mb-4">
            <button 
              onClick={handleEditClick}
              className="p-2 rounded-full text-gray-400 hover:text-purple-500 transition"
              title="Edit Flashcard"
            >
              <Pencil size={20} />
            </button>
            <button 
              onClick={() => deleteFlashcard(cards[currentIndex].id)}
              className="p-2 rounded-full text-gray-400 hover:text-red-500 transition"
              title="Delete Flashcard"
            >
              <Trash2 size={20} />
            </button>
          </div>
          {/* Card Container */}
          <div 
            className="h-80 w-full cursor-pointer"
            style={{ perspective: '1000px' }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className={`relative w-full h-full transition-all duration-500 shadow-xl rounded-3xl`} style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
              {/* Front */}
              <div className={`absolute inset-0 flex items-center justify-center p-8 text-center rounded-3xl border-2 ${darkMode ? 'bg-gray-800 border-purple-500/30 text-white' : 'bg-white border-purple-100 text-gray-900'}`} style={{ backfaceVisibility: 'hidden' }}>
                <div className="space-y-4">
                  <span className="text-xs font-bold text-purple-500 uppercase tracking-widest">Question</span>
                  <p className="text-2xl font-bold">{cards[currentIndex].front}</p>
                  <p className="text-xs text-gray-400 mt-4 italic">Click to reveal answer</p>
                </div>
              </div>
              {/* Back */}
              <div className={`absolute inset-0 flex items-center justify-center p-8 text-center rounded-3xl border-2 ${darkMode ? 'bg-purple-900/20 border-purple-500 text-white' : 'bg-purple-50 border-purple-300 text-gray-900'}`} style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <div className="space-y-4">
                  <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">Answer</span>
                  <p className="text-lg leading-relaxed">{cards[currentIndex].back}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-8">
            <button onClick={prevCard} className={`p-3 rounded-full ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-white hover:bg-gray-100 text-gray-900'} shadow-md transition`}>
              <ChevronLeft size={24} />
            </button>
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Card {currentIndex + 1} of {cards.length}
            </span>
            <button onClick={nextCard} className={`p-3 rounded-full ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-white hover:bg-gray-100 text-gray-900'} shadow-md transition`}>
              <ChevronRight size={24} />
            </button>
          </div>
          
          <button 
            onClick={() => { setIsFlipped(false); setCurrentIndex(0); }}
            className="flex items-center gap-2 mx-auto mt-6 text-sm font-medium text-purple-600 hover:text-purple-700 transition"
          >
            <RotateCcw size={16} /> Reset Deck
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Edit Flashcard</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Front (Question/Term)</label>
                <input 
                  type="text" 
                  value={editFront} 
                  onChange={(e) => setEditFront(e.target.value)} 
                  className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-100'}`} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Back (Answer/Definition)</label>
                <textarea 
                  rows="6" 
                  value={editBack} 
                  onChange={(e) => setEditBack(e.target.value)} 
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`} 
                />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowEditModal(false)} 
                  className={`flex-1 py-3 rounded-xl font-semibold border dark:border-gray-600 transition ${darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50'}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateFlashcard} 
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Save size={18} /> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardsPage;