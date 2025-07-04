// src/components/Sidebar.js
import React, { useEffect, useState } from 'react';
import logo from '../assets/logo.jpeg';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Sidebar({ isOpen }) {
  const [chatHistory, setChatHistory] = useState([]);
  const navigate = useNavigate();
  const user_id = localStorage.getItem("user_id");
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  // Fetch chat history
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/chat-lables/${user_id}`);
        console.log(res.data.chats);
        
        setChatHistory(res.data.chats); // expects an array of { id, label }
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    };

    if (user_id) {
      fetchChats();
    }
  }, [user_id]);

  const handleNewChat = () => {
    // Clear any current chat and navigate to new one
    navigate(`/`);
  };

  const handleSelectChat = (chatId) => {
    navigate(`/c/${chatId}`);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div
      className={`bg-dark text-white vh-100 d-flex flex-column p-3 sidebar ${isOpen ? 'open' : 'closed'}`}
      style={{
        width: '250px',
        position: 'fixed',
        top: 0,
        left: isOpen ? '0' : '-250px',
        transition: 'left 0.3s',
        zIndex: 1020,
      }}
    >
      {/* Logo and Title */}
      <div className="d-flex align-items-center mb-4">
        <img src={logo} alt="Logo" style={{ width: '32px', marginRight: '10px' }} />
        <span className="fs-5 fw-bold">RudraGPT</span>
      </div>

      {/* New Chat Button */}
      <div className="nav nav-pills flex-column mb-aut mt-2">
        <button onClick={handleNewChat} className="btn btn-primary mb-2 text-white d-flex align-items-center">
          <i className="bi bi-chat-left-text me-2"></i> New chat
        </button>
      </div>

      {/* Recent Chats */}
      <div className="nav nav-pills flex-column mb-auto mt-1"> 
        <label className="text-white mb-2">Recent Chats</label>
        <ul className="list-unstyled scroll-container" style={{ maxHeight: "318px", overflowY: "auto" }}>
          {chatHistory.length > 0 ? (
            chatHistory.map((chat) => (
              <li key={chat.id}>
                <a
                  href="#"
                  className="nav-link text-white"
                  onClick={() => handleSelectChat(chat.chat_id)}
                >
                  <i className="bi bi-chat-left-text me-2"></i> {chat.label}
                </a>
              </li>
            ))
          ) : (
            <li className="text-muted">No chats yet.</li>
          )}
        </ul>
      </div>

      {/* Footer: Settings + Logout */}
      <div className="mt-auto">
        <hr className="text-white" />
        <a href="#" className="btn btn-secondary mb-2 text-white d-flex align-items-center">
          <i className="bi bi-gear me-2"></i> Settings
        </a>
        <a href="#" className="nav-link text-white" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right me-2"></i> Logout
        </a>
      </div>
    </div>
  );
}
