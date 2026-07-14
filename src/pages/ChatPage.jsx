import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, MoreHorizontal, Search, Plus, Users, X, UserPlus, Trash2, Camera, Save, Send, Check, CheckCheck, Lock, Unlock } from "lucide-react";
import { useSocket } from "../context/SocketContext";
import { apiEndpoints } from "../config/apiConfig";

const ChatPage = ({ darkMode }) => {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedPeers, setSelectedPeers] = useState([]);
  const [showManageGroupModal, setShowManageGroupModal] = useState(false);
  const [currentGroupMembers, setCurrentGroupMembers] = useState([]);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [membersToAdd, setMembersToAdd] = useState([]);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [filter, setFilter] = useState("all"); // 'all', 'online', 'unread'
  const [messagesBlocked, setMessagesBlocked] = useState(false);
  const [showInstructorSettings, setShowInstructorSettings] = useState(false);
  const [updatingBlock, setUpdatingBlock] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const socket = useSocket();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    const diffDays = Math.floor(diffSeconds / 86400);

    if (diffDays > 1) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    if (diffDays === 1) {
      return 'Yesterday';
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Offline';
    const now = new Date();
    const lastSeenDate = new Date(timestamp);
    const diffSeconds = Math.floor((now - lastSeenDate) / 1000);
  
    if (diffSeconds < 60) return 'last seen just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `last seen ${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `last seen ${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `last seen ${diffDays}d ago`;
    
    return `last seen on ${lastSeenDate.toLocaleDateString()}`;
  };

  const getMessageTime = (msg) => {
    const t = msg?.timestamp || msg?.created_at;
    return t ? new Date(t) : null;
  };

  const isSameDay = (d1, d2) =>
    d1 && d2 &&
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const formatDateSeparator = (date) => {
    if (!date) return "";
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (isSameDay(date, now)) return "Today";
    if (isSameDay(date, yesterday)) return "Yesterday";
    return date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
  };

  const filteredContacts = contacts.filter(contact => {
    if (!contact.name) return false;
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'online') {
      return matchesSearch && contact.is_online;
    }
    if (filter === 'unread') {
      return matchesSearch && (contact.unread_count || 0) > 0;
    }

    return matchesSearch;
  });

  const fetchContacts = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    if (!isSilent) setError(null);
    try {
      const response = await fetch(apiEndpoints.messages.chatContacts, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ Backend returned error, using mock contacts data');
          const mockContacts = [
            { id: 1, name: 'Dr. Sarah Johnson', role: 'instructor', is_online: true, last_seen: null, last_message_content: 'Great question! Let me explain...', last_message_at: new Date(Date.now() - 120000).toISOString(), unread_count: 3 },
            { id: 2, name: 'Prof. Michael Chen', role: 'instructor', is_online: false, last_seen: new Date(Date.now() - 3600000).toISOString(), last_message_content: 'Please submit your assignment by Friday', last_message_at: new Date(Date.now() - 7200000).toISOString(), unread_count: 1 },
            { id: 3, name: 'Emily Davis', role: 'student', is_online: true, last_seen: null, last_message_content: 'Can you help me with the project?', last_message_at: new Date(Date.now() - 300000).toISOString(), unread_count: 0 },
            { id: 4, name: 'James Wilson', role: 'student', is_online: false, last_seen: new Date(Date.now() - 86400000).toISOString(), last_message_content: 'Thanks for the feedback!', last_message_at: new Date(Date.now() - 86400000).toISOString(), unread_count: 0 },
            { id: 5, name: 'Dr. Amanda Lee', role: 'instructor', is_online: false, last_seen: new Date(Date.now() - 7200000).toISOString(), last_message_content: 'Office hours are tomorrow at 3pm', last_message_at: new Date(Date.now() - 10800000).toISOString(), unread_count: 0 }
          ];
          setContacts(mockContacts);
          setLoading(false);
          return;
        }
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || `Server Error (${response.status})`);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setContacts((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
          return data;
        });
      } else {
        setContacts([]);
      }
    } catch (err) {
        if (!isSilent) {
            console.error("Chat Fetch Error:", err);
            setError(err.message || 'Failed to fetch contacts');
            setContacts([]);
        }
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const fetchInstructorChatSettings = async () => {
    if (user.role !== 'instructor') return;
    try {
      const response = await fetch(apiEndpoints.messages.instructorAccess, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMessagesBlocked(data.messages_blocked || false);
      }
    } catch (err) {
      console.error("Error fetching instructor chat settings:", err);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch(apiEndpoints.messages.createGroup.replace('/groups', '/groups'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.groups && Array.isArray(data.groups)) {
          const groupContacts = data.groups.map(g => ({
            id: g.id,
            name: g.name,
            is_group: true,
            group_icon: g.group_icon,
            creator_id: g.creator_id,
            members: g.members || [],
            last_message_content: g.last_message_content || 'Group created.',
            last_message_at: g.created_at,
            unread_count: 0,
          }));
          setContacts(prev => {
            const withoutGroups = prev.filter(c => !c.is_group);
            return [...withoutGroups, ...groupContacts];
          });
        }
      }
    } catch (e) {
      console.error("Failed to load groups", e);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchContacts();
    fetchGroups();
    if (user.role === 'instructor') {
      fetchInstructorChatSettings();
    }
  }, [token, user.role]);

  const toggleBlockAllMessages = async () => {
    if (user.role !== 'instructor') return;
    setUpdatingBlock(true);
    try {
      const endpoint = messagesBlocked ? apiEndpoints.messages.instructorUnblockAll : apiEndpoints.messages.instructorBlockAll;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setMessagesBlocked(!messagesBlocked);
      }
    } catch (err) {
      console.error("Error updating block status:", err);
    } finally {
      setUpdatingBlock(false);
    }
  };

  const toggleUserAccess = async (contactId) => {
    if (user.role !== 'instructor') return;
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;
    const newStatus = contact.chat_access_status === 'blocked' ? 'allowed' : 'blocked';
    try {
      const response = await fetch(apiEndpoints.messages.instructorAccess, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: contactId, status: newStatus })
      });
      if (response.ok) {
        setContacts(prev => prev.map(c => c.id === contactId ? { ...c, chat_access_status: newStatus } : c));
      }
    } catch (err) {
      console.error("Error updating user access:", err);
    }
  };

  const fetchMessages = useCallback(async (contact, isSilent = false) => {
      if (!isSilent) setMessagesLoading(true);
      try {
        let url;
        if (contact.is_group) {
          url = apiEndpoints.messages.groupHistory(contact.id);
        } else {
          url = apiEndpoints.messages.history(contact.id);
        }

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            if (import.meta.env.DEV) {
                console.warn(`⚠️ Backend error fetching messages for ${contact.name}, using mock messages.`);
            }
            throw new Error(errData.error || `Failed to fetch messages (${response.status})`);
        }

        if (response.ok) {
          const data = await response.json();
          setMessages((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
            return data;
          });
        }
      } catch (err) {
        if (!isSilent) console.error("Error fetching messages:", err);
      } finally {
        if (!isSilent) setMessagesLoading(false);
      }
    }, [token, user.id]);

  const markAsRead = useCallback(async (contact) => {
      if (!contact) return;
      try {
        let url;
        if (contact.is_group) {
          url = apiEndpoints.messages.markGroupRead(contact.id);
        } else {
          url = apiEndpoints.messages.markRead(contact.id);
        }
        await fetch(url, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Error marking messages as read:", err);
      }
    }, [token]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;

    const content = newMessage.trim();
    const tempMessage = {
      content: content,
      timestamp: new Date().toISOString(),
    };
    
    const body = { content };
    if (selectedContact.is_group) {
      body.group_id = selectedContact.id;
      tempMessage.group_id = selectedContact.id;
      tempMessage.sender_name = user.name;
    } else {
      body.receiver_id = selectedContact.id;
      tempMessage.receiver_id = selectedContact.id;
    }
    tempMessage.sender_id = user.id;
    setMessages((prev) => [...prev, tempMessage]);
    setContacts(prev => {
        const contactIndex = prev.findIndex(c => c.id === selectedContact.id);
        if (contactIndex === -1) return prev;
        const updatedContact = { 
          ...prev[contactIndex], 
          last_message_content: `You: ${content}`, 
          last_message_at: tempMessage.timestamp,
          unread_count: 0
        };
        return [updatedContact, ...prev.filter((_, i) => i !== contactIndex)];
    });
    setNewMessage("");
    handleStopTyping();

    try {
      await fetch(apiEndpoints.messages.send, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body),
      });
    } catch (err) {
      console.error("Send message error:", err);
      setMessages(prev => prev.map(m => m.timestamp === tempMessage.timestamp ? {...m, error: true} : m));
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (socket && selectedContact && !selectedContact.is_group) {
      if (!typingTimeoutRef.current) {
        socket.emit("typing", { recipient_id: selectedContact.id });
      }
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(handleStopTyping, 2000);
    }
  };

  const handleStopTyping = () => {
    if (socket && selectedContact && !selectedContact.is_group) {
      socket.emit("stop_typing", { recipient_id: selectedContact.id });
    }
    typingTimeoutRef.current = null;
  };

  const handleOpenManageGroupModal = async () => {
    if (!selectedContact?.is_group) return;
    
    try {
      const response = await fetch(apiEndpoints.messages.groupDetails(selectedContact.id), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentGroupMembers(data.group.members);
        setEditingGroupName(data.group.name);
        setShowManageGroupModal(true);
      } else {
        alert('Failed to load group details.');
      }
    } catch (error) {
      console.error('Error fetching group details:', error);
      alert('An error occurred while fetching group details.');
    }
  };

  const handleUpdateGroupDetails = async (newIconUrl = undefined) => {
    if (!selectedContact) return;
    const payload = {};
    const nameChanged = editingGroupName.trim() && editingGroupName !== selectedContact.name;

    if (nameChanged) {
      payload.name = editingGroupName.trim();
    }
    if (newIconUrl !== undefined) {
      payload.group_icon = newIconUrl;
    }

    if (Object.keys(payload).length === 0) return;

    setIsUpdatingGroup(true);
    try {
      const response = await fetch(apiEndpoints.messages.updateGroup(selectedContact.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to update group.');
      }
    } catch (err) {
      alert('An error occurred while updating the group.');
    } finally {
      setIsUpdatingGroup(false);
    }
  };

  const handleIconUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setIsUpdatingGroup(true);
    try {
      const res = await fetch(apiEndpoints.upload.image, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
      const data = await res.json();
      if (res.ok && data.image_url) {
        await handleUpdateGroupDetails(data.image_url);
      } else { throw new Error(data.error || 'Upload failed'); }
    } catch (err) { alert(`Icon upload failed: ${err.message}`); }
    finally { setIsUpdatingGroup(false); }
  }

  const handleAddMembersToGroup = async () => {
    if (membersToAdd.length === 0) {
        setIsAddingMembers(false);
        return;
    }
    try {
        const response = await fetch(apiEndpoints.messages.addGroupMembers(selectedContact.id), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ member_ids: membersToAdd })
        });
        if (response.ok) {
            setIsAddingMembers(false);
            setMembersToAdd([]);
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to add members.');
        }
    } catch (err) {
        alert('An error occurred while adding members.');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
        const response = await fetch(apiEndpoints.messages.removeGroupMember(selectedContact.id, memberId), {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
            const error = await response.json();
            alert(error.error || 'Failed to remove member.');
        }
    } catch (err) {
        alert('An error occurred while removing the member.');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim() || selectedPeers.length === 0) {
      alert("Group name and at least one peer are required.");
      return;
    }
    setIsCreatingGroup(true);
    try {
      const response = await fetch(apiEndpoints.messages.createGroup, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newGroupName, member_ids: selectedPeers })
      });

      if (response.ok) {
        const newGroupData = await response.json();
        setContacts(prev => [newGroupData.group, ...prev]);
        setSelectedContact(newGroupData.group);
        setShowCreateGroupModal(false);
        setNewGroupName("");
        setSelectedPeers([]);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create group");
      }
    } catch (err) {
      console.error("Create group error:", err);
      alert("An error occurred while creating the group.");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!token) return;

    fetchContacts();
    if (user.role === 'instructor') {
      fetchInstructorChatSettings();
    }
  }, [token, user.role]);

  useEffect(() => {
    if (!socket) return;

    const handleUserOnline = ({ user_id }) => {
      setContacts(prev => prev.map(c => c.id === user_id ? { ...c, is_online: true } : c));
      setSelectedContact(prev => (prev?.id === user_id ? { ...prev, is_online: true } : prev));
    };
    const handleUserOffline = ({ user_id, last_seen }) => {
      setContacts(prev => prev.map(c => c.id === user_id ? { ...c, is_online: false, last_seen } : c));
      setSelectedContact(prev => (prev?.id === user_id ? { ...prev, is_online: false, last_seen } : prev));
    };
    const handleUserTyping = ({ sender_id }) => setTypingUsers(prev => ({ ...prev, [sender_id]: true }));
    const handleUserStopTyping = ({ sender_id }) => setTypingUsers(prev => {
      const newTypingUsers = { ...prev };
      delete newTypingUsers[sender_id];
      return newTypingUsers;
    });

    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stop_typing", handleUserStopTyping);

    return () => {
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleUserStopTyping);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const handleDirectMessage = (newMessage) => {
      const isForSelectedContact = !selectedContact?.is_group && selectedContact?.id === newMessage.sender_id;

      if (isForSelectedContact) {
        setMessages((prev) => [...prev, newMessage]);
        markAsRead(selectedContact);
      }

      setContacts((prevContacts) => {
        const contactIndex = prevContacts.findIndex(c => c.id === newMessage.sender_id);
        if (contactIndex === -1) return prevContacts;
        const updatedContact = {
          ...prevContacts[contactIndex],
          last_message_content: newMessage.content,
          last_message_at: newMessage.timestamp,
          unread_count: isForSelectedContact ? 0 : (prevContacts[contactIndex].unread_count || 0) + 1,
        };
        return [updatedContact, ...prevContacts.filter((_, i) => i !== contactIndex)];
      });
    };

    const handleGroupMessage = (newMessage) => {
      const isForSelectedGroup = selectedContact?.is_group && selectedContact.id === newMessage.group_id;

      if (isForSelectedGroup) {
        setMessages(prev => [...prev, newMessage]);
        markAsRead(selectedContact);
      }

      setContacts(prevContacts => {
        const contactIndex = prevContacts.findIndex(c => c.is_group && c.id === newMessage.group_id);
        if (contactIndex === -1) return prevContacts;

        const last_message_content = newMessage.sender_id === user.id
          ? `You: ${newMessage.content}`
          : `${newMessage.sender_name}: ${newMessage.content}`;

        const updatedContact = {
          ...prevContacts[contactIndex],
          last_message_content,
          last_message_at: newMessage.timestamp,
          unread_count: isForSelectedGroup ? 0 : (prevContacts[contactIndex].unread_count || 0) + 1,
        };
        return [updatedContact, ...prevContacts.filter((_, i) => i !== contactIndex)];
      });
    };

    socket.on("direct_message", handleDirectMessage);

    const handleNewGroup = (newGroup) => {
      setContacts(prev => [newGroup, ...prev]);
    };

    const handleGroupUpdated = (update) => {
      const { group_id, name, group_icon } = update;
      const updater = (contact) => {
        if (!contact) return contact;
        const newContact = { ...contact };
        if (name !== undefined) newContact.name = name;
        if (group_icon !== undefined) newContact.group_icon = group_icon;
        return newContact;
      };

      setContacts(prev => prev.map(c => (c.is_group && c.id === group_id) ? updater(c) : c));

      if (selectedContact?.is_group && selectedContact.id === group_id) {
        setSelectedContact(updater);
        if (name !== undefined) setEditingGroupName(name);
      }
    };

    const handleMembersUpdated = ({ group_id, members }) => {
        if (selectedContact?.is_group && selectedContact.id === group_id) {
            setCurrentGroupMembers(members);
        }
    };

    const handleRemovedFromGroup = ({ group_id, group_name }) => {
        setContacts(prev => prev.filter(c => !(c.is_group && c.id === group_id)));
        if (selectedContact?.is_group && selectedContact.id === group_id) {
            setSelectedContact(null);
        }
        alert(`You have been removed from the group: ${group_name}`);
    };
    
    const handleGroupDeleted = ({ group_id, group_name }) => {
        setContacts(prev => prev.filter(c => !(c.is_group && c.id === group_id)));
        if (selectedContact?.is_group && selectedContact.id === group_id) {
            setSelectedContact(null);
        }
        alert(`The group "${group_name}" has been deleted by the creator.`);
    };

    socket.on("group_message", handleGroupMessage);
    socket.on("new_group_chat", handleNewGroup);
    socket.on('group_updated', handleGroupUpdated);
    socket.on('members_updated', handleMembersUpdated);
    socket.on('removed_from_group', handleRemovedFromGroup);
    socket.on('group_deleted', handleGroupDeleted);

    return () => {
      socket.off("direct_message", handleDirectMessage);
      socket.off("group_message", handleGroupMessage);
      socket.off("new_group_chat", handleNewGroup);
      socket.off('group_updated', handleGroupUpdated);
      socket.off('members_updated', handleMembersUpdated);
      socket.off('removed_from_group', handleRemovedFromGroup);
      socket.off('group_deleted', handleGroupDeleted);
    };
  }, [socket, selectedContact, markAsRead, user.id]);

  useEffect(() => {
    if (selectedContact?.id) {
      setMessages([]);
      fetchMessages(selectedContact, false);
      markAsRead(selectedContact);
      setContacts(prev => prev.map(c =>
        (c.id === selectedContact.id && !!c.is_group === !!selectedContact.is_group) ? { ...c, unread_count: 0 } : c
      ));
    }
  }, [selectedContact?.id, fetchMessages, markAsRead]);

  const ContactSkeleton = () => (
    <div className="animate-pulse flex items-center gap-3 p-4">
      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
      </div>
    </div>
  );

  const renderMessageList = () => {
    const rows = [];
    let lastDate = null;
    let prevMsg = null;

    messages.forEach((msg, idx) => {
      const date = getMessageTime(msg);
      const isOwn = msg.sender_id === user.id;

      if (date && (!lastDate || !isSameDay(date, lastDate))) {
        rows.push(
          <div key={`sep-${idx}`} className="flex justify-center my-4">
            <span className={`px-3 py-1 rounded-full text-[11px] font-medium tracking-wide ${darkMode ? "bg-gray-800 text-gray-400" : "bg-gray-200 text-gray-500"}`}>
              {formatDateSeparator(date)}
            </span>
          </div>
        );
        lastDate = date;
      }

      const prevTime = prevMsg ? getMessageTime(prevMsg) : null;
      const timeDiff =
        date && prevTime ? date - prevTime : Infinity;
      const grouped =
        prevMsg &&
        prevMsg.sender_id === msg.sender_id &&
        timeDiff < 5 * 60000;

      rows.push(
        <div
          key={msg.id || idx}
          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`flex flex-col max-w-[78%] ${isOwn ? "items-end" : "items-start"} ${
              grouped ? "mt-1" : "mt-3"
            }`}
          >
            {selectedContact.is_group && !isOwn && !grouped && (
              <span className="text-xs text-purple-500 dark:text-purple-400 ml-3 mb-1 font-semibold">
                {msg.sender_name}
              </span>
            )}
            <div
              className={`px-4 py-2 shadow-sm ${
                msg.error
                  ? "bg-red-500/10 text-red-500 border border-red-400/40 rounded-2xl rounded-br-md"
                  : isOwn
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl rounded-br-md"
                    : darkMode
                      ? "bg-gray-800 text-gray-200 rounded-2xl rounded-bl-md"
                      : "bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-md"
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {msg.content}
              </p>
            </div>
            <div
              className={`flex items-center gap-1 mt-1 px-1 ${
                isOwn ? "flex-row-reverse" : ""
              }`}
            >
              <span
                className={`text-[10px] ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {date
                  ? date.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </span>
              {isOwn &&
                (msg.error ? (
                  <span className="text-[10px] text-red-400">Failed</span>
                ) : msg.is_read ? (
                  <CheckCheck size={14} className="text-blue-400" />
                ) : (
                  <Check size={14} className={darkMode ? "text-gray-500" : "text-gray-400"} />
                ))}
            </div>
          </div>
        </div>
      );

      prevMsg = msg;
    });

    return rows;
  };

  return (
    <div
      className={`flex h-[calc(100vh-64px)] ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}
    >
      {/* Sidebar: Contacts List */}
      <div
        className={`w-80 border-r flex flex-col ${darkMode ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"}`}
      >
        <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between gap-3">
          <div
            onClick={() => navigate(-1)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${darkMode ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-100 text-gray-600"}`}
            aria-label="Go back"
            title="Back"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </div>
          <h2 className="text-xl font-bold">Messages</h2>
          <button onClick={() => setShowCreateGroupModal(true)} title="Create Group" className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
            <Plus size={20} />
          </button>
        </div>

        {/* Search and Filter Section */}
        <div className="p-4 border-b dark:border-gray-800">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-purple-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}
            />
          </div>
          <div className="flex gap-2 mt-3">
            {['all', 'online', 'unread'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)} 
                className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${filter === f 
                  ? 'bg-purple-600 text-white shadow' 
                  : `bg-gray-200 dark:bg-gray-700 ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300'}`}`
                }
              >{f.charAt(0).toUpperCase() + f.slice(1)}</button>
            ))}
          </div>
        </div>

        {user.role === 'instructor' && (
          <div className={`p-3 border-b ${darkMode ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock size={16} className={messagesBlocked ? 'text-red-500' : 'text-green-500'} />
                <span className="text-xs font-medium">
                  {messagesBlocked ? 'Messages Blocked' : 'Messages Allowed'}
                </span>
              </div>
              <button
                onClick={toggleBlockAllMessages}
                disabled={updatingBlock}
                className={`text-xs px-2 py-1 rounded-md transition-colors disabled:opacity-50 ${
                  messagesBlocked
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {updatingBlock ? 'Saving...' : messagesBlocked ? 'Unblock All' : 'Block All'}
              </button>
            </div>
            {messagesBlocked && (
              <p className="text-[10px] text-gray-500 mt-1">Students cannot send you messages unless explicitly allowed.</p>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            [...Array(5)].map((_, i) => <ContactSkeleton key={i} />)
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-500 text-sm mb-4">{error}</p>
              <button
                onClick={() => fetchContacts()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs"
              >
                Retry
              </button>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4 opacity-20">💬</div>
              <p
                className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                No contacts found.{searchTerm && " Try a different search."}
              </p>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`w-full flex items-center gap-3 p-4 transition-colors cursor-pointer ${
                  selectedContact?.id === contact.id 
                    ? darkMode ? "bg-purple-900/30" : "bg-purple-50"
                    : darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"
                }`}
              >
                <div className="relative w-10 h-10 shrink-0">
                  {contact.is_group ? (
                    contact.group_icon ? (
                      <img src={contact.group_icon} alt={contact.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center text-white font-bold">
                        <Users size={20} />
                      </div>
                    )
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {contact.name?.charAt(0) || '?'}
                    </div>
                  )}
                  {!contact.is_group && contact.is_online && (
                    <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-900" title="Online"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <div className={`font-semibold text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {contact.name}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {formatTime(contact.last_message_at)}
                      </span>
                      {user.role === 'instructor' && !contact.is_group && (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleUserAccess(contact.id); }}
                          className={`p-1 rounded-md transition-colors ${
                            contact.chat_access_status === 'blocked'
                              ? 'text-green-500 hover:bg-green-100 dark:hover:bg-green-900/20'
                              : 'text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20'
                          }`}
                          title={contact.chat_access_status === 'blocked' ? 'Allow messages' : 'Block messages'}
                        >
                          {contact.chat_access_status === 'blocked' ? <Unlock size={14} /> : <Lock size={14} />}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-start mt-0.5">
                    <p className={`text-xs truncate pr-2 ${contact.unread_count > 0 ? (darkMode ? 'text-white font-bold' : 'text-gray-800 font-bold') : (darkMode ? 'text-gray-400' : 'text-gray-500')}`}>
                      {contact.last_message_content || (contact.is_group ? 'Group created.' : 'No messages yet.')}
                    </p>
                    {contact.unread_count > 0 && (
                      <span className="bg-purple-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shrink-0">
                        {contact.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div
              className={`p-4 border-b flex items-center gap-3 ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
              {selectedContact.is_group ? (
                selectedContact.group_icon ? (
                  <img src={selectedContact.group_icon} alt={selectedContact.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center text-white font-bold">
                    <Users size={20} />
                  </div>
                )
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {selectedContact.name?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              <div>
                <div className="font-bold">{selectedContact.name}</div>
                {selectedContact.is_group ? <div className="text-xs text-gray-400">Group Chat</div> : typingUsers[selectedContact.id] ? (
                  <div className="text-xs text-purple-500 flex items-center gap-1">
                    typing
                    <MoreHorizontal size={16} className="animate-pulse" />
                  </div>
                ) : selectedContact.is_online ? (
                  <div className="text-xs text-green-500 flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Online
                  </div>
                ) : (
                  <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {formatLastSeen(selectedContact.last_seen)}
                  </div>
                )}
              </div>
              </div>
              <div className="flex items-center gap-2">
                  {selectedContact.is_group && user.id === selectedContact.creator_id && (
                      <button onClick={handleOpenManageGroupModal} title="Manage Members" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                          <Users size={20} />
                      </button>
                  )}
                  {user.role === 'instructor' && !selectedContact.is_group && (
                    <button
                      onClick={() => toggleUserAccess(selectedContact.id)}
                      className={`p-2 rounded-full transition-colors ${
                        selectedContact.chat_access_status === 'blocked'
                          ? 'text-green-500 hover:bg-green-100 dark:hover:bg-green-900/20'
                          : 'text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20'
                      }`}
                      title={selectedContact.chat_access_status === 'blocked' ? 'Allow messages' : 'Block messages'}
                    >
                      {selectedContact.chat_access_status === 'blocked' ? <Unlock size={20} /> : <Lock size={20} />}
                    </button>
                  )}
              </div>
            </div>

            {/* Message List */}
            <div className="flex-1 p-4 overflow-y-auto space-y-0">
              {messagesLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div
                  className={`text-center py-10 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  No messages yet. Say hello! 👋
                </div>
              ) : (
                renderMessageList()
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form
              onSubmit={handleSendMessage}
              className={`p-4 border-t ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  className={`flex-1 px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    darkMode
                      ? "bg-gray-800 border-gray-700 text-white"
                      : "bg-gray-100 border-transparent text-gray-900"
                  }`}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition disabled:opacity-50 shrink-0"
                  aria-label="Send message"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="p-6 bg-purple-100 dark:bg-purple-900/20 rounded-full mb-6 text-purple-700 dark:text-purple-300">
              <MessageSquare size={48} strokeWidth={1.5} />
            </div>
            <h2
              className={`text-2xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}
            >
              Select a conversation
            </h2>
            <p
              className={`max-w-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Choose a contact from the sidebar to start chatting with your
              instructors or fellow students.
            </p>
          </div>
        )}
      </div>
      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateGroupModal(false)} />
          <div className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center">
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Create Group Chat
                </h2>
                <button onClick={() => setShowCreateGroupModal(false)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition`}>
                  <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Group Name *</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none`}
                  placeholder="e.g., Project Alpha Team"
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Select Members *</label>
                <div className={`max-h-48 overflow-y-auto rounded-xl border ${darkMode ? 'border-gray-600' : 'border-gray-300'} p-3 space-y-2`}>
                  {contacts.filter(c => !c.is_group).length === 0 ? (
                    <p className={`text-sm text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No contacts available</p>
                  ) : (
                    contacts.filter(c => !c.is_group).map((contact) => (
                      <label key={contact.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${selectedPeers.includes(contact.id) ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}>
                        <input
                          type="checkbox"
                          checked={selectedPeers.includes(contact.id)}
                          onChange={() => {
                            setSelectedPeers(prev =>
                              prev.includes(contact.id)
                                ? prev.filter(id => id !== contact.id)
                                : [...prev, contact.id]
                            );
                          }}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-600"
                        />
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {contact.name?.charAt(0) || '?'}
                        </div>
                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{contact.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowCreateGroupModal(false)} className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                  Cancel
                </button>
                <button type="submit" disabled={isCreatingGroup} className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50">
                  {isCreatingGroup ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Manage Group Modal */}
      {showManageGroupModal && selectedContact?.is_group && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowManageGroupModal(false); setIsAddingMembers(false); setMembersToAdd([]); }} />
            <div className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-center">
                        <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {isAddingMembers ? 'Add Members' : 'Group Members'}
                        </h2>
                        <button onClick={() => { setShowManageGroupModal(false); setIsAddingMembers(false); setMembersToAdd([]); }} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition`}>
                            <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                        </button>
                    </div>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {!isAddingMembers && user.id === selectedContact.creator_id && (
                        <div className="mb-6 p-4 border rounded-lg dark:border-gray-700 space-y-4">
                            <h3 className="font-semibold text-sm">Edit Group</h3>
                            <div className="flex items-center gap-3">
                                <div className="relative group">
                                    {selectedContact.group_icon ? (
                                        <img src={selectedContact.group_icon} alt={selectedContact.name} className="w-16 h-16 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center text-white">
                                            <Users size={32} />
                                        </div>
                                    )}
                                    <label htmlFor="group-icon-upload" className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition cursor-pointer">
                                        <Camera size={20} />
                                    </label>
                                    <input type="file" id="group-icon-upload" accept="image/*" className="hidden" onChange={handleIconUpload} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Group Name</label>
                                    <input
                                        type="text"
                                        value={editingGroupName}
                                        onChange={(e) => setEditingGroupName(e.target.value)}
                                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} focus:ring-1 focus:ring-purple-500 outline-none`}
                                    />
                                </div>
                                <button onClick={() => handleUpdateGroupDetails()} disabled={isUpdatingGroup || editingGroupName === selectedContact.name} className="self-end p-2 bg-purple-600 text-white rounded-lg disabled:opacity-50 hover:bg-purple-700">
                                    <Save size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {isAddingMembers ? (
                        <div className="space-y-2">
                            {contacts.filter(c => !c.is_group && !currentGroupMembers.some(m => m.id === c.id)).map(contact => (
                                <label key={contact.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${membersToAdd.includes(contact.id) ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={membersToAdd.includes(contact.id)}
                                        onChange={() => {
                                            setMembersToAdd(prev => prev.includes(contact.id) ? prev.filter(id => id !== contact.id) : [...prev, contact.id]);
                                        }}
                                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-600"
                                    />
                                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{contact.name}</span>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm">{currentGroupMembers.length} Members</h3>
                            {currentGroupMembers.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                            {member.name?.charAt(0) || '?'}
                                        </div>
                                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{member.name}</span>
                                        {member.id === selectedContact.creator_id && <span className="text-xs text-purple-500 font-bold">(Creator)</span>}
                                    </div>
                                    {user.id === selectedContact.creator_id && user.id !== member.id && (
                                        <button onClick={() => handleRemoveMember(member.id)} title="Remove member" className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={`flex gap-3 p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    {isAddingMembers ? (
                        <>
                            <button onClick={() => setIsAddingMembers(false)} className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                                Back
                            </button>
                            <button onClick={handleAddMembersToGroup} className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition">
                                Add Selected
                            </button>
                        </>
                    ) : (
                        user.id === selectedContact.creator_id ? (
                            <button onClick={() => setIsAddingMembers(true)} className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2">
                                <UserPlus size={16} /> Add Members
                            </button>
                        ) : <p className="text-xs text-center text-gray-500 w-full">Only the group creator can manage members.</p>
                    )}
                </div>
            </div>
        </div>
    )}
    </div>
  );
};

export default ChatPage;