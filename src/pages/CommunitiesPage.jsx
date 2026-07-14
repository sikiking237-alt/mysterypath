import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Users, Plus, Search, Lock, Globe, X, ChevronRight,
  BookOpen, Code, Palette, Music, Dumbbell, Brain,
  GraduationCap, Rocket, Heart, Camera, Trash2, UserPlus, LogOut
} from "lucide-react";
import { apiCall } from "../config/apiConfig";

const SUBJECTS = [
  { value: "", label: "All Subjects" },
  { value: "Computer Science", label: "Computer Science", icon: Code },
  { value: "Mathematics", label: "Mathematics", icon: Brain },
  { value: "Science", label: "Science", icon: GraduationCap },
  { value: "Design", label: "Design", icon: Palette },
  { value: "Business", label: "Business", icon: Rocket },
  { value: "Music", label: "Music", icon: Music },
  { value: "Fitness", label: "Fitness", icon: Dumbbell },
  { value: "Languages", label: "Languages", icon: BookOpen },
  { value: "Other", label: "Other", icon: Heart },
];

const CommunitiesPage = ({ darkMode }) => {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [myCommunities, setMyCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [joinCode, setJoinCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [view, setView] = useState("discover");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    subject: "",
    is_public: true,
    max_members: 50,
    icon: "",
  });

  useEffect(() => {
    fetchCommunities();
    fetchMyCommunities();
  }, []);

  const fetchCommunities = async () => {
    setLoading(true);
    try {
      const data = await apiCall("/api/communities");
      if (data && !data.error) {
        setCommunities(data.communities || []);
      }
    } catch (e) {
      console.error("Failed to load communities", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyCommunities = async () => {
    try {
      const data = await apiCall("/api/communities/my");
      if (data && !data.error) {
        setMyCommunities(data.communities || []);
      }
    } catch (e) {
      console.error("Failed to load my communities", e);
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Community name is required");
      return;
    }
    setIsSubmitting(true);
    try {
      const data = await apiCall("/api/communities", {
        method: "POST",
        body: formData,
      });
      if (data && !data.error) {
        toast.success("Community created successfully!");
        setShowCreateModal(false);
        setFormData({ name: "", description: "", subject: "", is_public: true, max_members: 50, icon: "" });
        fetchCommunities();
        fetchMyCommunities();
        setView("my");
      } else {
        toast.error(data?.error || "Failed to create community");
      }
    } catch (e) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinCommunity = async () => {
    if (!selectedCommunity) return;
    setIsSubmitting(true);
    try {
      const data = await apiCall(`/api/communities/${selectedCommunity.id}/join`, {
        method: "POST",
        body: { join_code: joinCode },
      });
      if (data && !data.error) {
        toast.success(`Joined ${selectedCommunity.name}!`);
        setShowJoinModal(false);
        setJoinCode("");
        setSelectedCommunity(null);
        fetchCommunities();
        fetchMyCommunities();
      } else {
        toast.error(data?.error || "Failed to join community");
      }
    } catch (e) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveCommunity = async (communityId) => {
    if (!window.confirm("Are you sure you want to leave this community?")) return;
    try {
      const data = await apiCall(`/api/communities/${communityId}/leave`, {
        method: "POST",
      });
      if (data && !data.error) {
        toast.success("Left community successfully");
        fetchCommunities();
        fetchMyCommunities();
      } else {
        toast.error(data?.error || "Failed to leave community");
      }
    } catch (e) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleDeleteCommunity = async (communityId) => {
    if (!window.confirm("Are you sure you want to delete this community? This action cannot be undone.")) return;
    try {
      const data = await apiCall(`/api/communities/${communityId}`, {
        method: "DELETE",
      });
      if (data && !data.error) {
        toast.success("Community deleted successfully");
        fetchCommunities();
        fetchMyCommunities();
      } else {
        toast.error(data?.error || "Failed to delete community");
      }
    } catch (e) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const openJoinModal = (community) => {
    setSelectedCommunity(community);
    setJoinCode("");
    setShowJoinModal(true);
  };

  const filteredCommunities = communities.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !selectedSubject || c.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const filteredMyCommunities = myCommunities.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !selectedSubject || c.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const getSubjectIcon = (subject) => {
    const found = SUBJECTS.find((s) => s.value === subject);
    if (!found || !found.icon) return BookOpen;
    return found.icon;
  };

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-500" />
              Learning Communities
            </h1>
            <p className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Discover study groups, join communities, and learn together
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            <Plus className="w-5 h-5" />
            Create Community
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView("discover")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              view === "discover"
                ? "bg-purple-600 text-white"
                : darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Discover
          </button>
          <button
            onClick={() => setView("my")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              view === "my"
                ? "bg-purple-600 text-white"
                : darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            My Communities ({myCommunities.length})
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
            <input
              type="text"
              placeholder="Search communities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"
              }`}
            />
          </div>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className={`px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"
            }`}
          >
            {SUBJECTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Community Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(view === "discover" ? filteredCommunities : filteredMyCommunities).map((community) => {
              const SubjectIcon = getSubjectIcon(community.subject);
              const isMember = community.is_member || myCommunities.some((mc) => mc.id === community.id);
              const isOwner = community.creator_id === parseInt(localStorage.getItem("user")?.replace(/[^0-9]/g, "") || "0");

              return (
                <div
                  key={community.id}
                  className={`rounded-xl border p-6 transition hover:shadow-lg ${
                    darkMode ? "bg-gray-900 border-gray-800 hover:border-purple-500/30" : "bg-white border-gray-200 hover:border-purple-500/30"
                  }`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      darkMode ? "bg-purple-900/30 text-purple-400" : "bg-purple-50 text-purple-600"
                    }`}>
                      {community.icon ? (
                        <img src={community.icon} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <SubjectIcon className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate">{community.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          community.is_public
                            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                        }`}>
                          {community.is_public ? <Globe className="w-3 h-3 inline mr-1" /> : <Lock className="w-3 h-3 inline mr-1" />}
                          {community.is_public ? "Public" : "Private"}
                        </span>
                        {community.subject && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            darkMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-700"
                          }`}>
                            {community.subject}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className={`text-sm mb-4 line-clamp-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {community.description || "No description provided."}
                  </p>

                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{community.member_count} / {community.max_members}</span>
                    </div>
                    {community.join_code && (
                      <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                        darkMode ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"
                      }`}>
                        Code: {community.join_code}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {isMember ? (
                      <>
                        <button
                          onClick={() => community.chat_group_id && navigate(`/chat`, { state: { contactId: community.chat_group_id } })}
                          disabled={!community.chat_group_id}
                          className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition disabled:opacity-50"
                        >
                          Open Chat
                        </button>
                        {!isOwner && (
                          <button
                            onClick={() => handleLeaveCommunity(community.id)}
                            className={`p-2 rounded-lg border ${
                              darkMode ? "border-gray-700 text-red-400 hover:bg-red-900/20" : "border-gray-200 text-red-600 hover:bg-red-50"
                            }`}
                            title="Leave community"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        )}
                        {isOwner && (
                          <button
                            onClick={() => handleDeleteCommunity(community.id)}
                            className={`p-2 rounded-lg border ${
                              darkMode ? "border-gray-700 text-red-400 hover:bg-red-900/20" : "border-gray-200 text-red-600 hover:bg-red-50"
                            }`}
                            title="Delete community"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => openJoinModal(community)}
                        disabled={community.member_count >= community.max_members}
                        className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {community.member_count >= community.max_members ? "Full" : "Join Community"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && (view === "discover" ? filteredCommunities : filteredMyCommunities).length === 0 && (
          <div className={`text-center py-20 rounded-xl ${darkMode ? "bg-gray-900" : "bg-white"}`}>
            <Users className={`w-12 h-12 mx-auto mb-4 ${darkMode ? "text-gray-600" : "text-gray-400"}`} />
            <p className={`text-lg font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              {view === "discover" ? "No communities found" : "You haven't joined any communities yet"}
            </p>
            <p className={`text-sm mt-1 ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
              {view === "discover" ? "Try adjusting your filters or create a new community" : "Discover communities and join them to see them here"}
            </p>
          </div>
        )}
      </div>

      {/* Create Community Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl p-6 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                Create a Community
              </h2>
              <button onClick={() => setShowCreateModal(false)} className={`p-1.5 rounded-lg ${darkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-100"}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCommunity} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Community Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Web Dev Study Group"
                  className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What is this community about?"
                  rows={3}
                  className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Subject / Topic
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200"
                  }`}
                >
                  <option value="">Select a subject</option>
                  {SUBJECTS.filter((s) => s.value).map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Max Members
                </label>
                <input
                  type="number"
                  min={2}
                  max={200}
                  value={formData.max_members}
                  onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) || 2 })}
                  className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200"
                  }`}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="is_public" className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Public community (anyone can discover and join)
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={`flex-1 py-2.5 rounded-lg font-medium transition ${
                    darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Community"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Community Modal */}
      {showJoinModal && selectedCommunity && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowJoinModal(false)} />
          <div className={`relative w-full max-w-md rounded-2xl shadow-2xl p-6 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                Join {selectedCommunity.name}
              </h2>
              <button onClick={() => setShowJoinModal(false)} className={`p-1.5 rounded-lg ${darkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-100"}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {!selectedCommunity.is_public && (
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Join Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter join code"
                  className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200"
                  }`}
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowJoinModal(false)}
                className={`flex-1 py-2.5 rounded-lg font-medium transition ${
                  darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleJoinCommunity}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50"
              >
                {isSubmitting ? "Joining..." : "Join Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunitiesPage;
