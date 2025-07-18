// src/components/Header.js
import React from 'react';
import "bootstrap/dist/css/bootstrap.min.css";
import GoogleLoginButton from '../GoogleLoginButton';

export default function Header({ toggleSidebar, isSidebarOpen, userDetails }) {
  return (
    <header className="md:hidden flex items-center justify-between p-2 bg-black/80 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10">
      {/* ☰ Sidebar Toggle Button */}
      <button
        id="menu-btn"
        className="p-2 rounded-lg hover:bg-white/10"
        onClick={toggleSidebar} // ✅ This toggles sidebar
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="w-6 h-6 text-white"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Title */}
      <h1 className="text-lg font-semibold text-white">New Chat</h1>

      {/* ➕ Add New Chat or Other */}
      <button className="p-2 rounded-lg hover:bg-white/10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="w-6 h-6 text-white"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </header>
  );
}
