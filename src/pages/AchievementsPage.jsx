import React, { useState, useEffect } from "react";
import { Award, Trophy, Star, Zap, Crown, Target } from "lucide-react";

const AchievementsPage = ({ darkMode }) => {
  const [xp, setXp] = useState(1250);
  const leaderboard = [
    { rank: 1, name: "Sarah J.", xp: 15400, level: 32, avatar: "SJ" },
    { rank: 2, name: "Michael C.", xp: 12100, level: 25, avatar: "MC" },
    { rank: 3, name: "Emma R.", xp: 9800, level: 20, avatar: "ER" },
    { rank: 4, name: "You", xp: 1250, level: 3, avatar: "U", isMe: true },
    { rank: 5, name: "Alex T.", xp: 1100, level: 3, avatar: "AT" }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-amber-500 rounded-2xl text-white shadow-lg">
          <Trophy size={24} />
        </div>
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Achievements & Ranking</h1>
          <p className="text-gray-500">Your path to becoming a learning legend</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Global Leaderboard */}
        <div className={`lg:col-span-2 rounded-3xl border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
          <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
            <h2 className="font-bold text-xl flex items-center gap-2">
              <Crown size={20} className="text-amber-500" /> Global Leaderboard
            </h2>
            <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">Season 4</span>
          </div>
          <div className="divide-y dark:divide-gray-700">
            {leaderboard.map((user) => (
              <div key={user.rank} className={`p-4 flex items-center gap-4 transition-colors ${user.isMe ? (darkMode ? 'bg-purple-900/20' : 'bg-purple-50') : ''}`}>
                <div className={`w-8 h-8 flex items-center justify-center font-bold ${user.rank <= 3 ? 'text-amber-500' : 'text-gray-400'}`}>
                  #{user.rank}
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                  {user.avatar}
                </div>
                <div className="flex-1">
                  <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.name}</div>
                  <div className="text-xs text-gray-500">Level {user.level}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-purple-600">{user.xp.toLocaleString()}</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Total XP</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats and Badges */}
        <div className="space-y-6">
          <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-100'}`}>
            <h3 className="font-bold mb-4 flex items-center gap-2 text-indigo-600">
              <Zap size={18} /> My Stats
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Progress to Level 4</span>
                  <span className="font-bold">250 / 500 XP</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: '50%' }}></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center p-3 rounded-2xl bg-white/50 dark:bg-gray-800/50">
                  <div className="text-2xl font-bold text-indigo-600">3</div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Courses</div>
                </div>
                <div className="text-center p-3 rounded-2xl bg-white/50 dark:bg-gray-800/50">
                  <div className="text-2xl font-bold text-indigo-600">12</div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Streak</div>
                </div>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Award size={18} className="text-purple-500" /> Recent Badges
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {['🌱', '🔥', '🛡️', '🎯', '✨', '⚡'].map((emoji, i) => (
                <div key={i} className={`aspect-square rounded-2xl flex items-center justify-center text-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} border dark:border-gray-600`}>
                  {emoji}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementsPage;