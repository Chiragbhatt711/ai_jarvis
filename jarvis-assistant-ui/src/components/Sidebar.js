import React, { useEffect, useState, useRef } from 'react';
import logo from '../assets/logo.jpeg';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import GoogleLoginButton from '../GoogleLoginButton';

export default function Sidebar({ isOpen, userDetails, setUserDetails, onLogout }) {
  const [chatHistory, setChatHistory] = useState([]);
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const user_id = userDetails?.id;
  const [showDropdown, setShowDropdown] = useState(false);
  const profileRef = useRef();

  // Fetch chat history when user logs in
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/chat-lables/${user_id}`);
        setChatHistory(res.data.chats || []);
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    };

    if (userDetails && userDetails.id) {
      fetchChats();
    }
  }, [userDetails]);

  const handleNewChat = () => {
    navigate(`/`);
  };

  const handleSelectChat = (chatId) => {
    navigate(`/c/${chatId}`);
  };

  const handleLogout = () => {
    localStorage.clear();
    onLogout();
    setChatHistory([]);
    navigate('/c');
    window.Swal.fire({
      toast: true,
      icon: 'success',
      title: 'Logged out successfully!',
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000
    });
  };

  const stripMarkdown = (text) => {
    return text
      .replace(/[#_*~`>[\]()]/g, '')  // remove markdown symbols
      .replace(/!\[.*?\]\(.*?\)/g, '') // remove images
      .replace(/\[(.*?)\]\(.*?\)/g, '$1'); // convert [text](link) to text
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <aside
      id="sidebar"
      className={`bg-black/90 w-72 p-4 flex flex-col fixed inset-y-0 left-0 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-30 backdrop-blur-sm border-r border-white/10`}
    >
      {/* Logo and Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="bg-white/10 p-1.5 rounded-lg">
            <img src={logo} alt="Logo" className="w-6 h-6" />
          </div>
          <span className="font-semibold text-lg">RudraGPT</span>
        </div>
        <button className="p-2 rounded-lg hover:bg-white/10 md:hidden">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* New Chat */}
      <button
        onClick={handleNewChat}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition mb-4"
      >
        <i className="bi bi-chat-left-text" /> New Chat
      </button>

      {/* Recent Chats */}
      <div className="flex-grow -mr-2 pr-2">
        <h3 className="px-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Recent Chats
        </h3>

        {chatHistory.length > 0 ? (
          <nav className="flex flex-col gap-1 overflow-y-auto max-h-[300px] custom-scrollbar pr-1">
            {chatHistory.map((chat) => (
              <button
                key={chat.id}
                onClick={() => handleSelectChat(chat.chat_id)}
                className="group flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-white bg-white/5 hover:bg-white/10 transition w-full text-left"
                title={chat.label}
              >
                <i className="bi bi-chat-left-text text-blue-400 group-hover:text-blue-300"></i>
                <span className="truncate flex-1">{stripMarkdown(chat.label)}</span>
              </button>
            ))}
          </nav>
        ) : (
          <p className="text-xs text-gray-500 px-3">No chats yet.</p>
        )}
      </div>

      {/* Footer Section */}
      <div className="border-t border-white/10 pt-1 mt-1">
        {userDetails ? (
          <>
            <div
              ref={profileRef}
              className="relative px-3 py-2 mb-2 cursor-pointer"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="flex items-center gap-3 text-white text-sm">
                {userDetails.profile_picture ? (
                  <img
                    src={userDetails.profile_picture}
                    alt="User Avatar"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                    {userDetails.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <span className="truncate">{userDetails.name}</span>
                <i className="bi bi-chevron-down text-white/70 text-xs"></i>
              </div>

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute left-3 right-3 mt-2 bg-black border border-white/10 rounded-lg shadow-lg z-10">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 rounded-b-lg"
                  >
                    <i className="bi bi-box-arrow-right mr-2"></i> Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <GoogleLoginButton setUserDetails={setUserDetails} />
        )}
      </div>
    </aside>
  );
}
