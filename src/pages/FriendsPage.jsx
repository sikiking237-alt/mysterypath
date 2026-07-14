import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Users, UserPlus, Search, X, Check, XCircle,
  UserCheck, UserX, Send, Clock, Mail
} from "lucide-react";
import { apiCall } from "../config/apiConfig";

const FriendsPage = ({ darkMode }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("friends");
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (activeTab === "friends") fetchFriends();
    else if (activeTab === "requests") fetchRequests();
  }, [activeTab]);

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const data = await apiCall("/api/friends");
      if (data && !data.error) {
        setFriends(data.friends || []);
      }
    } catch (e) {
      console.error("Failed to load friends", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await apiCall("/api/friends/requests");
      if (data && !data.error) {
        setRequests(data.requests || []);
      }
    } catch (e) {
      console.error("Failed to load requests", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setSearching(true);
    try {
      const data = await apiCall(`/api/friends/search?q=${encodeURIComponent(searchTerm.trim())}`);
      if (data && !data.error) {
        setSearchResults(data.users || []);
      }
    } catch (e) {
      console.error("Search failed", e);
    } finally {
      setSearching(false);
    }
  };

  const sendFriendRequest = async (userId) => {
    setProcessingId(userId);
    try {
      const data = await apiCall("/api/friends/request", {
        method: "POST",
        body: { addressee_id: userId },
      });
      if (data && !data.error) {
        toast.success("Friend request sent!");
        setSearchResults((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, friendship_status: "pending" } : u
          )
        );
      } else {
        toast.error(data?.error || "Failed to send request");
      }
    } catch (e) {
      toast.error("Something went wrong");
    } finally {
      setProcessingId(null);
    }
  };

  const acceptRequest = async (friendshipId) => {
    setProcessingId(friendshipId);
    try {
      const data = await apiCall("/api/friends/accept", {
        method: "POST",
        body: { friendship_id: friendshipId },
      });
      if (data && !data.error) {
        toast.success("Friend request accepted!");
        fetchRequests();
        fetchFriends();
      } else {
        toast.error(data?.error || "Failed to accept request");
      }
    } catch (e) {
      toast.error("Something went wrong");
    } finally {
      setProcessingId(null);
    }
  };

  const rejectRequest = async (friendshipId) => {
    setProcessingId(friendshipId);
    try {
      const data = await apiCall("/api/friends/reject", {
        method: "POST",
        body: { friendship_id: friendshipId },
      });
      if (data && !data.error) {
        toast.success("Friend request rejected");
        fetchRequests();
      } else {
        toast.error(data?.error || "Failed to reject request");
      }
    } catch (e) {
      toast.error("Something went wrong");
    } finally {
      setProcessingId(null);
    }
  };

  const removeFriend = async (friendshipId) => {
    if (!window.confirm("Are you sure you want to remove this friend?")) return;
    setProcessingId(friendshipId);
    try {
      const data = await apiCall(`/api/friends/${friendshipId}`, {
        method: "DELETE",
      });
      if (data && !data.error) {
        toast.success("Friend removed");
        fetchFriends();
      } else {
        toast.error(data?.error || "Failed to remove friend");
      }
    } catch (e) {
      toast.error("Something went wrong");
    } finally {
      setProcessingId(null);
    }
  };

  const startChat = (userId) => {
    navigate("/chat", { state: { contactId: userId } });
  };

  const getFriendshipStatus = (userId) => {
    const friend = friends.find((f) => f.id === userId);
    if (friend) return "accepted";
    const searchUser = searchResults.find((u) => u.id === userId);
    if (searchUser) return searchUser.friendship_status;
    return null;
  };

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg">
            <Users className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Friends</h1>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Manage your friends and connections
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("friends")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "friends"
                ? "bg-purple-600 text-white"
                : darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            My Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 rounded-lg font-medium transition relative ${
              activeTab === "requests"
                ? "bg-purple-600 text-white"
                : darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Requests
            {requests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {requests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "search"
                ? "bg-purple-600 text-white"
                : darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Find People
          </button>
        </div>

        {/* Friends Tab */}
        {activeTab === "friends" && (
          <div className={`rounded-xl border ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            ) : friends.length === 0 ? (
              <div className="p-8 text-center">
                <Users className={`w-12 h-12 mx-auto mb-3 ${darkMode ? "text-gray-600" : "text-gray-400"}`} />
                <p className={`text-lg font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  No friends yet
                </p>
                <p className={`text-sm mt-1 ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                  Search for people to add them as friends
                </p>
                <button
                  onClick={() => setActiveTab("search")}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
                >
                  Find People
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className={`p-4 flex items-center gap-4 ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"}`}
                  >
                    <div className="relative">
                      {friend.profile_image ? (
                        <img src={friend.profile_image} alt={friend.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg">
                          {friend.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                      )}
                      {friend.is_online && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{friend.name}</div>
                      <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {friend.role === "instructor" ? "Instructor" : "Student"}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startChat(friend.id)}
                        className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
                        title="Message"
                      >
                        <Send size={18} />
                      </button>
                      <button
                        onClick={() => removeFriend(friend.friendship_id)}
                        disabled={processingId === friend.friendship_id}
                        className={`p-2 rounded-lg transition ${
                          darkMode ? "text-red-400 hover:bg-red-900/20" : "text-red-600 hover:bg-red-50"
                        } disabled:opacity-50`}
                        title="Remove friend"
                      >
                        <UserX size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <div className={`rounded-xl border ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            ) : requests.length === 0 ? (
              <div className="p-8 text-center">
                <Mail className={`w-12 h-12 mx-auto mb-3 ${darkMode ? "text-gray-600" : "text-gray-400"}`} />
                <p className={`text-lg font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  No pending requests
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className={`p-4 flex items-center gap-4 ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"}`}
                  >
                    <div className="relative">
                      {req.profile_image ? (
                        <img src={req.profile_image} alt={req.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                          {req.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                      )}
                      {req.is_online && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{req.name}</div>
                      <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Wants to be your friend
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptRequest(req.id)}
                        disabled={processingId === req.id}
                        className="p-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
                        title="Accept"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => rejectRequest(req.id)}
                        disabled={processingId === req.id}
                        className={`p-2 rounded-lg transition ${
                          darkMode ? "text-red-400 hover:bg-red-900/20" : "text-red-600 hover:bg-red-50"
                        } disabled:opacity-50`}
                        title="Reject"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Tab */}
        {activeTab === "search" && (
          <div className={`rounded-xl border ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
            <div className="p-4 border-b border-gray-800">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name..."
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching || !searchTerm.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {searching ? "Searching..." : "Search"}
                </button>
              </form>
            </div>

            {searchResults.length > 0 && (
              <div className="divide-y divide-gray-800">
                {searchResults.map((user) => {
                  const status = getFriendshipStatus(user.id);
                  return (
                    <div
                      key={user.id}
                      className={`p-4 flex items-center gap-4 ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"}`}
                    >
                      <div className="relative">
                        {user.profile_image ? (
                          <img src={user.profile_image} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                            {user.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                        )}
                        {user.is_online && (
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{user.name}</div>
                        <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {user.role === "instructor" ? "Instructor" : "Student"}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {status === "accepted" ? (
                          <>
                            <button
                              onClick={() => startChat(user.id)}
                              className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
                              title="Message"
                            >
                              <Send size={18} />
                            </button>
                            <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"}`}>
                              Friends
                            </span>
                          </>
                        ) : status === "pending" ? (
                          <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? "bg-yellow-900/20 text-yellow-400" : "bg-yellow-50 text-yellow-700"}`}>
                            <Clock size={12} className="inline mr-1" />
                            Pending
                          </span>
                        ) : (
                          <button
                            onClick={() => sendFriendRequest(user.id)}
                            disabled={processingId === user.id}
                            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-1"
                          >
                            <UserPlus size={14} />
                            Add Friend
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {searchTerm && !searching && searchResults.length === 0 && (
              <div className="p-8 text-center">
                <Search className={`w-12 h-12 mx-auto mb-3 ${darkMode ? "text-gray-600" : "text-gray-400"}`} />
                <p className={`text-lg font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  No users found
                </p>
                <p className={`text-sm mt-1 ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                  Try a different search term
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;
