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
import CodeBlockWithCopy from './components/CodeBlockWithCopy';
import GoogleLoginButton from './GoogleLoginButton';
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showVoicePopup, setShowVoicePopup] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
  const [isDeepSearchEnabled, setIsDeepSearchEnabled] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const toggleRef = useRef(null);
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

    // Add user's message
    setMessages((prev) => [...prev, userMessage]);

    // Add placeholder message with loading state
    const placeholderId = Date.now(); // unique ID for replacement
    const thinkingMessage = {
      id: placeholderId,
      from: "jarvis",
      text: "Thinking...",
      isLoading: true
    };
    setMessages((prev) => [...prev, thinkingMessage]);
    setInput("");

    try {
      const res = await axios.post(`${API_BASE_URL}/chat`, {
        message: input,
        web_search: isWebSearchEnabled,
        deep_search: isDeepSearchEnabled,
        user_id: String(user_id),
        chat_id: String(chatId),
      });

      const jarvisReply = {
        id: placeholderId,
        from: "jarvis",
        text: res.data.response,
        isLoading: false
      };

      // Replace the placeholder with actual response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === placeholderId ? jarvisReply : msg
        )
      );
    } catch (error) {
      const errorMessage = {
        id: placeholderId,
        from: "jarvis",
        text: "Error: Something went wrong while processing your request. Please try again later.",
        isLoading: false
      };
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === placeholderId ? errorMessage : msg
        )
      );
    }
  };

    const [inputValue, setInputValue] = useState('');
    const chatContainerRef = useRef(null);
    const welcomeMessageRef = useRef(null);
    const handleSendMessage = (e) => {
        e.preventDefault();
        const message = inputValue.trim();
        if (!message) return;
        if (welcomeMessageRef.current) {
            welcomeMessageRef.current.style.display = 'none';
        }
          appendMessage(message, 'user');
        setInputValue('');
        setTimeout(() => {
            const botResponse = 'This is a simulated 2025 response. The UI has been updated to reflect the latest design trends, including a consolidated tools menu and a more polished aesthetic. Full functionality requires a backend connection.';
            appendMessage(botResponse, 'bot');
        }, 1200);
    };
    const appendMessage = (text, sender) => {
        setMessages((prevMessages) => [...prevMessages, { text, sender }]);
        setTimeout(() => {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }, 0);
    };
    const autoResizeTextarea = (e) => {
        const textarea = e.target;
        textarea.style.height = 'auto'; // reset height
        textarea.style.height = `${textarea.scrollHeight}px`;
    };

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (toggleRef.current && !toggleRef.current.contains(event.target)) {
          setShowTools(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
      if (!chatId) return;

      axios.get(`${API_BASE_URL}/chats/${chatId}/messages`)
        .then(response => {
          console.log(response);
          
          setMessages(response.data);
        })
        .catch(error => {
          console.error("Failed to load chat messages:", error);
        });
    }, [chatId]);

  return (
    <div class="flex h-screen">
      <Sidebar isOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} userDetails={userDetails} setUserDetails={setUserDetails} onLogout={() => setUserDetails(null)} />
      <main className="flex-1 flex flex-col relative bg-[#1C1C1C]">
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} userDetails={userDetails} />
        
        {/* Chat messages */}
        <div id="chat-container" className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            {!messages.length ? (
              <div id="welcome-message" className="text-center py-20">
                <div className="inline-block bg-white/10 rounded-full p-3 mb-6 shadow-lg">
                  <svg className="w-10 h-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="..." />
                  </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">How can I help you today?</h2>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`mb-4 ${msg.from === 'user' || msg.from_ === 'user' ? 'text-right' : 'text-left'} text-white`}>
                  {(msg.from === 'jarvis' || msg.from_ === 'jarvis') ? (
                    <div className="flex items-start gap-2">
                      <img src={logo} alt="Jarvis" className="w-8 h-8 rounded-full animate-pulse" />
                      <div className="markdown-response text-sm md:text-base">
                        {msg.isLoading ? (
                          <p className="text-base text-gray-400 italic animate-pulse">Thinking...</p>
                        ) : (
                          <ReactMarkdown
                            children={msg.text}
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                              p: ({ node, children }) => (
                                <p className="text-base text-gray-300 mb-3 leading-relaxed">
                                  {children}
                                </p>
                              ),
                              strong: ({ node, children }) => (
                                <strong className="text-yellow-400 font-semibold">
                                  {children}
                                </strong>
                              ),
                              pre: CodeBlockWithCopy,
                              code: ({ inline, className, children, ...props }) => {
                                const codeText = Array.isArray(children)
                                  ? children.join("")
                                  : children?.toString?.() || "";
                                return inline ? (
                                  <code className="bg-gray-800 text-green-300 px-1 py-0.5 rounded font-mono text-sm" {...props}>
                                    {children}
                                  </code>
                                ) : (
                                  <code className={`font-mono text-sm ${className}`} {...props}>
                                    {children}
                                  </code>
                                );
                              },
                              a: ({ href, children }) => (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:underline font-medium"
                                >
                                  {children}
                                </a>
                              ),
                              img: ({ src, alt }) => (
                                <img src={src} alt={alt} className="w-6 h-6 inline-block mx-1" />
                              ),
                            }}
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="inline-block bg-blue-600 rounded-xl px-4 py-2 text-white max-w-sm text-left">
                      <ReactMarkdown
                        children={msg.text}
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          pre: ({ node, ...props }) => (
                            <pre className="bg-gray-800 text-white p-2 rounded-md overflow-x-auto" {...props} />
                          ),
                          code: ({ inline, className, children, ...props }) => (
                            <code className="font-mono text-sm" {...props}>
                              {children}
                            </code>
                          ),
                        }}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Input Section */}
        <div className="w-full bg-gradient-to-t from-black/50 to-transparent pt-4">
          <div className="max-w-4xl mx-auto px-4" ref={toggleRef}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-end gap-2 relative"
            >
              {/* Toggle Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTools(prev => !prev)}
                  className="p-2 bg-[#2a2a2a] border border-white/10 rounded-lg hover:bg-white/10 transition"
                  style={{ marginBottom: '7px', height: '50px' }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>

                {/* Tools Dropdown */}
                <div
                  className={`absolute bottom-full left-0 mb-2 w-64 bg-[#2a2a2a] rounded-xl shadow-xl p-2 transition-all duration-200 ${
                    showTools ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    {/* Web Search Tool */}
                    <button
                      onClick={() => setIsWebSearchEnabled(prev => !prev)}
                      className={`flex items-start gap-2 p-2 rounded-md text-white text-left transition ${
                        isWebSearchEnabled ? 'bg-white/10 border border-white/20' : 'hover:bg-white/10'
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 mt-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"
                        />
                      </svg>
                      <div>
                        <p className="font-medium text-sm">Web Search</p>
                        <p className="text-xs text-gray-400">
                          {isWebSearchEnabled ? 'Web search is enabled' : 'Enable internet results'}
                        </p>
                      </div>
                    </button>

                    {/* Deep Search Tool */}
                    <button
                      onClick={() => setIsDeepSearchEnabled(prev => !prev)}
                      className={`flex items-start gap-2 p-2 rounded-md text-white text-left transition ${
                        isDeepSearchEnabled ? 'bg-white/10 border border-white/20' : 'hover:bg-white/10'
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 mt-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 10h4l3-3m0 0l3 3h4m-7-3v10"
                        />
                      </svg>
                      <div>
                        <p className="font-medium text-sm">Deep Search</p>
                        <p className="text-xs text-gray-400">
                          {isDeepSearchEnabled ? 'Deep search is enabled' : 'Enable AI semantic search'}
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Textarea with Send */}
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  className="w-full resize-none overflow-hidden max-h-52 bg-[#2a2a2a] border border-white/10 rounded-xl shadow-lg py-3.5 pl-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 custom-scrollbar transition-all"
                  placeholder="Ask anything..."
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    autoResizeTextarea(e);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />

                {/* Voice Button */}
                <button
                  type="button"
                  onClick={() => setShowVoicePopup(true)}
                  className="absolute right-12 top-1/2 -translate-y-1/2 p-2 bg-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
                  title="Start voice input"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 1a3 3 0 013 3v7a3 3 0 01-6 0V4a3 3 0 013-3zm6 10a6 6 0 01-12 0m6 6v4m-4 0h8"
                    />
                  </svg>
                </button>

                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </form>

            <p className="text-xs text-center text-gray-600 pt-3 pb-3">
              RudraGPT can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>


        {/* Voice popup (optional) */}
        {showVoicePopup && (
          <JarvisVoicePopup show={showVoicePopup} onHide={() => setShowVoicePopup(false)} />
        )}
      </main>
    </div>

  );
}

export default App;
