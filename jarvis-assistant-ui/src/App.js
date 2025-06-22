import React, { useState } from 'react';
import "bootstrap/dist/css/bootstrap.min.css";
import axios from 'axios';
import logo from './logo.svg';
import './App.css';
import JarvisVoicePopup from './JarvisVoicePopup';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showVoicePopup, setShowVoicePopup] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { from: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await axios.post("http://localhost:8000/chat", {
        message: input,
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
    <div className="App">
      <header>
        <nav class="navbar navbar-expand-md navbar-dark fixed-top bg-dark py-1 justify-content-center">
          <a class="navbar-brand fs-6" href="#">Welcome to Chirag's AI</a>
        </nav>
      </header>
      <div class="chat">
        <div class="chat-container" >
          <div id="call" class="user-bar">           
          </div>
          <div class="conversation">
            <div class="conversation-container">
              <span id="ap">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`message ${msg.from === 'user' ? 'user' : ''}`}>
                    {msg.text}
                  </div>
                ))}
              </span>
            </div>
            <div id="form" class="conversation-compose">
              <span id="speak"></span>
              <input
                class="input-msg"
                type="text"
                placeholder="Type a command..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <span class="send">
                <div class="circle">
                  <button type="button" onClick={handleSend} class="circle">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-send" viewBox="0 0 16 16">
                      <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z"/>
                    </svg>
                  </button>
                </div>
              </span>
              <span className="send">
                <div className="circle">
                  <button
                    id="speak"
                    type="button"
                    className="circle"
                    onClick={() => setShowVoicePopup(true)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="45px" height="45px" fill="currentColor" className="bi bi-mic" viewBox="0 0 16 16">
                      <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5"></path>
                      <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3"></path>
                    </svg>
                  </button>
                </div>
              </span>

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
      <footer class="footer bg-dark text-center text-white py-1 mt-auto">
        
          <span class="text-muted">© 2025 Chirag's AI. All rights reserved. Made with ❤️ by Chirag. </span>
        
      </footer>
    </div>
  );
}

export default App;
