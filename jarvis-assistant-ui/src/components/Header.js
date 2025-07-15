// src/components/Header.js
import React from 'react';
import "bootstrap/dist/css/bootstrap.min.css";
import GoogleLoginButton from '../GoogleLoginButton';

export default function Header({ toggleSidebar, isSidebarOpen, userDetails }) {
  return (
    // <header>
    //     <nav className="navbar navbar-dark bg-dark fixed-top px-3 d-flex justify-content-between align-items-center" style={{ zIndex: 1030, left: isSidebarOpen ? "250px" : "0px" }}>
    //         {/* Hamburger Icon */}
    //         <button className="btn btn-outline-light" onClick={toggleSidebar} >
    //         <i class="fa-solid fa-bars"></i>
    //         </button>

    //         {/* Brand Text */}
    //         {/* <span className="navbar-brand mb-0 h6">Welcome to Chirag's AI</span> */}

    //         {userDetails && userDetails.name ? (
    //         <span className="navbar-text text-light">
    //             Hey, {userDetails.name}!
    //         </span>
    //         ) : (
    //         <button className="btn btn-outline-light btn-sm" data-bs-toggle="modal" data-bs-target="#loginModal">
    //             Login
    //         </button>
    //         )}
    //     </nav>
    //     <div className="modal" tabIndex="-1" id="loginModal">
    //         <div class="modal-dialog modal-dialog-centered">
    //             <div className="modal-content">
    //                 <div className="modal-header">
    //                     <h5 className="modal-title w-100 text-center">Signin / Signup</h5>
    //                     <button type="button" id='modalCloseBtn' className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    //                 </div>

    //                 <div className="modal-body text-center mt-4 mb-4">

    //                     {/* Centered Button */}
    //                     <div className="d-flex justify-content-center">
    //                         <GoogleLoginButton />
    //                     </div>
    //                 </div>
    //             </div>
    //         </div>
    //     </div>
    // </header>

    <header class="md:hidden flex items-center justify-between p-2 bg-black/80 backdrop-blur-sm border-b border-white/10 sticky top-0 ">
        <button id="menu-btn" class="p-2 rounded-lg hover:bg-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
        </button>
        <h1 class="text-lg font-semibold">New Chat</h1>
        <button class="p-2 rounded-lg hover:bg-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        </button>
    </header>
  );
}
