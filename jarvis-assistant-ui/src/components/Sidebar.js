// src/components/Sidebar.js
import React from 'react';
import logo from '../assets/logo.jpeg';

export default function Sidebar({ isOpen }) {
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

      {/* Sidebar Links */}
      <ul className="nav nav-pills flex-column mb-auto">
        <li className="nav-item">
          <a href="#" className="nav-link text-white active">
            <i className="bi bi-chat-left-text me-2"></i> New Chat
          </a>
        </li>
        <li>
          <a href="#" className="nav-link text-white">
            <i className="bi bi-clock-history me-2"></i> History
          </a>
        </li>
        <li>
          <a href="#" className="nav-link text-white">
            <i className="bi bi-gear me-2"></i> Settings
          </a>
        </li>
      </ul>

      {/* Footer */}
      <div className="mt-auto">
        <hr className="text-white" />
        <a href="#" className="nav-link text-white">
          <i className="bi bi-box-arrow-right me-2"></i> Logout
        </a>
      </div>
    </div>
  );
}
