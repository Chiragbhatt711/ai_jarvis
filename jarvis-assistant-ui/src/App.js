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
      <div className="flex-grow-1" style={{ marginLeft: isSidebarOpen ? '250px' : '0', transition: 'margin-left 0.3s' }}>
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
                <div id="form" className="input-group d-flex align-items-center" style={{ top: '40px' }}>
                  {/* Speak Icon Placeholder */}
                  <span id="speak" className="me-2"></span>

                  {/* Input Field */}
                  <textarea
                    ref={textareaRef}
                    className="form-control me-2"
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
                    }}
                  />

                  {/* Send Button */}
                  <button
                    type="button"
                    onClick={handleSend}
                    className="btn btn-primary me-2 d-flex align-items-center justify-content-center"
                    style={{ width: '45px', height: '45px', borderRadius: '50%' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" className="bi bi-send" viewBox="0 0 16 16">
                      <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z" />
                    </svg>
                  </button>

                  {/* Mic Button */}
                  <button
                    id="speak"
                    type="button"
                    className="btn btn-secondary d-flex align-items-center justify-content-center"
                    style={{ width: '45px', height: '45px', borderRadius: '50%' }}
                    onClick={() => setShowVoicePopup(true)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="25px" height="25px" fill="white" className="bi bi-mic" viewBox="0 0 16 16">
                      <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5" />
                      <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3" />
                    </svg>
                  </button>

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
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
