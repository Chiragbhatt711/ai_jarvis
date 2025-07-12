import React, { useState,useEffect,useRef  } from 'react';
import "bootstrap/dist/css/bootstrap.min.css";
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import './App.css';
import JarvisVoicePopup from './JarvisVoicePopup';
import logo from './assets/logo.jpeg';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import GoogleLoginButton from './GoogleLoginButton';
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showVoicePopup, setShowVoicePopup] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userDetails, setUserDetails] = useState(null);
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
  const textareaRef = useRef();
  const { chat_id } = useParams();
  const navigate = useNavigate();
  const [chatId, setChatId] = useState(chat_id || '');
  console.log("Chat id:- "+chat_id);
  

  const GoogleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const GoogleClientSecret = process.env.REACT_APP_GOOGLE_CLIENT_SECRET;
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  console.log(API_BASE_URL);
  
  useEffect(() => {
    const user_id = localStorage.getItem("user_id");
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    if (user_id) {
      axios.post(`${API_BASE_URL}/get-user`, {
        user_id: String(user_id),
      })
        .then((response) => {
          if (response.data.status === 'success') {
            setUserDetails(response.data.user); // ✅ use React state
          } else {
            localStorage.removeItem("user_id");
            console.error("Error fetching user:", response.data.message);
          }
        })
        .catch((error) => {
          console.error("API error:", error);
        });
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    if (!chat_id) {
      const newChatId = uuidv4();
      setChatId(newChatId);
      navigate(`/c/${newChatId}`, { replace: true });
    } else {
      setChatId(chat_id);
    }
  }, [chat_id, navigate]);
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { from: "user", text: input };
    const user_id = localStorage.getItem("user_id");
    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await axios.post(`${API_BASE_URL}/chat`, {
        message: input,
        web_search: isWebSearchEnabled,
        user_id: String(user_id),
        chat_id: String(chatId),
      });

      const jarvisReply = {
        from: "jarvis",
        text: res.data.response,
      };
      setMessages((prev) => [...prev, jarvisReply]);
    } catch (error) {
      const errorMessage = {
        from: "jarvis",
        text: "Error: Could not connect to Jarvis API",
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setInput("");
  };

  return (
    <div className="d-flex">
      {/* Left Sidebar */}
      <Sidebar isOpen={isSidebarOpen} />

      {/* Main content area */}
      <div className="flex-grow-1" style={{ marginLeft: isSidebarOpen ? '223px' : '-25px', transition: 'margin-left 0.3s', marginRight:'-25px' }}>
        {/* Header or Top Navigation */}
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} userDetails={userDetails} />
        <GoogleLoginButton setUserDetails={setUserDetails} />
        {/* Page content */}
        <main className="p-1 mt-4">
          <div className="chat">
            <div className="chat-container">
              <div id="call" className="user-bar"></div>
              <div className="conversation">
                <div className="conversation-container">
                  <span id="ap">
                    {messages.map((msg, idx) => (
                      <div key={idx} className={`message ${msg.from === 'user' ? 'user' : ''}`}>
                        {msg.from === "jarvis" ? (
                          <div className="d-flex align-items-start mb-2">
                            <div className="me-2">
                              <img
                                src={logo}
                                alt="Jarvis"
                                className="rounded-circle"
                                style={{ width: '34px', height: '31px', marginTop: '-6px', marginLeft: '-18px' }}
                              />
                            </div>
                            <div className="markdown-response">
                              <ReactMarkdown
                                children={msg.text}
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeHighlight]}
                                components={{
                                  pre: ({ node, ...props }) => (
                                    <pre style={{ background: '#1e1e1e', padding: '12px', borderRadius: '8px', overflowX: 'auto' }} {...props} />
                                  ),
                                  code: ({ node, inline, className, children, ...props }) => (
                                    <code style={{ fontFamily: 'monospace', fontSize: '0.9rem' }} {...props}>
                                      {children}
                                    </code>
                                  ),
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          msg.text
                        )}
                      </div>
                    ))}
                  </span>
                </div>
              </div>
              <div id="form" className="input-group d-flex flex-column" style={{ backgroundColor:'white',borderRadius: '20px', padding: '10px',top:'-5px' }}>
                {/* Speak Icon Placeholder */}
                <span id="speak" className="me-2"></span>

                {/* Input Field */}
                <textarea
                  ref={textareaRef}
                  className="form-control"
                  placeholder="Ask anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                  style={{
                    resize: 'none',
                    borderRadius: '20px',
                    padding: '10px 15px',
                    minHeight: '45px',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    width: '100%',
                  }}
                />

                {/* Buttons Row */}
                <div className="d-flex justify-content-end mt-2 gap-2">
                  <div className="me-auto" style={{ cursor: 'pointer' }} onClick={() => setIsWebSearchEnabled(prev => !prev)}>
                    <span className="d-flex align-items-center text-secondary fw-medium mt-2" style={{ marginLeft: '15px' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="16"
                        height="16"
                        fill={isWebSearchEnabled ? "#0d6efd" : "gray"}
                        className="bi bi-globe2 me-1">
                        <path d="M57.7 193l9.4 16.4c8.3 14.5 21.9 25.2 38 29.8L163 255.7c17.2 4.9 29 20.6 29 38.5l0 39.9c0 11 6.2 21 16 25.9s16 14.9 16 25.9l0 39c0 15.6 14.9 26.9 29.9 22.6c16.1-4.6 28.6-17.5 32.7-33.8l2.8-11.2c4.2-16.9 15.2-31.4 30.3-40l8.1-4.6c15-8.5 24.2-24.5 24.2-41.7l0-8.3c0-12.7-5.1-24.9-14.1-33.9l-3.9-3.9c-9-9-21.2-14.1-33.9-14.1L257 256c-11.1 0-22.1-2.9-31.8-8.4l-34.5-19.7c-4.3-2.5-7.6-6.5-9.2-11.2c-3.2-9.6 1.1-20 10.2-24.5l5.9-3c6.6-3.3 14.3-3.9 21.3-1.5l23.2 7.7c8.2 2.7 17.2-.4 21.9-7.5c4.7-7 4.2-16.3-1.2-22.8l-13.6-16.3c-10-12-9.9-29.5 .3-41.3l15.7-18.3c8.8-10.3 10.2-25 3.5-36.7l-2.4-4.2c-3.5-.2-6.9-.3-10.4-.3C163.1 48 84.4 108.9 57.7 193zM464 256c0-36.8-9.6-71.4-26.4-101.5L412 164.8c-15.7 6.3-23.8 23.8-18.5 39.8l16.9 50.7c3.5 10.4 12 18.3 22.6 20.9l29.1 7.3c1.2-9 1.8-18.2 1.8-27.5zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"/>
                      </svg>
                      
                      <span style={{ color: isWebSearchEnabled ? "#0d6efd" : "gray" }}>Web Search</span>
                    </span>
                  </div>

                  {/* Mic Button */}
                  <button
                    id="speak"
                    type="button"
                    className="btn btn-secondary d-flex align-items-center justify-content-center p-0"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                    }}
                    onClick={() => setShowVoicePopup(true)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      fill="white"
                      className="bi bi-mic"
                      viewBox="0 0 16 16"
                    >
                      <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5" />
                      <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3" />
                    </svg>
                  </button>

                  {/* Send Button */}
                  <button
                    type="button"
                    onClick={handleSend}
                    className="btn btn-primary d-flex align-items-center justify-content-center p-0"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      fill="white"
                      className="bi bi-send"
                      viewBox="0 0 16 16"
                    >
                      <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z" />
                    </svg>
                  </button>
                </div>

                {/* Voice Popup Component */}
                {showVoicePopup && (
                  <JarvisVoicePopup
                    show={showVoicePopup}
                    onHide={() => setShowVoicePopup(false)}
                  />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
