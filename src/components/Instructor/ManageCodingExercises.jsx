import React, { useState } from 'react';

const ManageCodingExercises = ({ darkMode }) => {
  const [exercises, setExercises] = useState([
    { id: 1, title: 'JavaScript Array Methods', difficulty: 'Easy', submissions: 45, successRate: 78 },
    { id: 2, title: 'Python List Comprehension', difficulty: 'Medium', submissions: 32, successRate: 65 },
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExercise, setNewExercise] = useState({ title: '', description: '', difficulty: 'Easy' });

  const addExercise = () => {
    if (!newExercise.title) return alert('Please enter title');
    setExercises([...exercises, { id: exercises.length + 1, ...newExercise, submissions: 0, successRate: 0 }]);
    setShowAddModal(false);
    setNewExercise({ title: '', description: '', difficulty: 'Easy' });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>💻 Coding Exercises</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Create and manage coding exercises</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">+ Add Exercise</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exercises.map((ex) => (
          <div key={ex.id} className={`rounded-xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <h3 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{ex.title}</h3>
            <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Difficulty: {ex.difficulty}</p>
            <div className="flex justify-between text-sm text-gray-500 mb-4">
              <span>📝 {ex.submissions} submissions</span>
              <span>✅ {ex.successRate}% success</span>
            </div>
            <div className="flex gap-2"> {/* Added onClick handlers */}
              <button onClick={() => alert(`Editing exercise: ${ex.title}`)} className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Edit</button>
              <button onClick={() => alert(`Deleting exercise: ${ex.title}`)} className="px-3 py-2 border border-red-600 text-red-600 rounded-lg text-sm hover:bg-red-50">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className={`rounded-xl p-6 max-w-md w-full ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Add Coding Exercise</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Title" value={newExercise.title} onChange={(e) => setNewExercise({...newExercise, title: e.target.value})} 
                className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`} />
              <textarea placeholder="Description" rows="3" value={newExercise.description} onChange={(e) => setNewExercise({...newExercise, description: e.target.value})}
                className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`} />
              <select value={newExercise.difficulty} onChange={(e) => setNewExercise({...newExercise, difficulty: e.target.value})}
                className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`}>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg">Cancel</button>
              <button onClick={addExercise} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg">Add Exercise</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCodingExercises;