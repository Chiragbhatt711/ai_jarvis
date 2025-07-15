import React, { useEffect, useState } from 'react';
import logo from '../assets/logo.jpeg';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import GoogleLoginButton from '../GoogleLoginButton';

export default function Sidebar({ isOpen, userDetails, onLogout }) {
  const [chatHistory, setChatHistory] = useState([]);
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const user_id = userDetails?.id;

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

    if (user_id) {
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
      <div className="flex-grow overflow-y-auto custom-scrollbar -mr-2 pr-2">
        <h3 className="px-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Recent Chats
        </h3>
        {chatHistory.length > 0 ? (
          <nav className="flex flex-col gap-1">
            {chatHistory.map((chat) => (
              <a
                key={chat.id}
                href="#"
                className="px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/5 text-white truncate"
                onClick={() => handleSelectChat(chat.chat_id)}
              >
                <i className="bi bi-chat-left-text me-2"></i> {chat.label}
              </a>
            ))}
          </nav>
        ) : (
          <p className="text-xs text-gray-500 px-3">No chats yet.</p>
        )}
      </div>

      {/* Footer Section */}
      <div className="border-t border-white/10 pt-4 mt-4">
        {userDetails ? (
          <>
            {/* Optional: User Info */}
            <div className="flex items-center gap-3 px-3 py-2 text-white text-sm mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                {userDetails.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="truncate">{userDetails.name}</span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium hover:bg-white/5 text-white transition"
            >
              <i className="bi bi-box-arrow-right"></i> Logout
            </button>
          </>
        ) : (
          <GoogleLoginButton />
        )}
      </div>
    </aside>
  );
}
