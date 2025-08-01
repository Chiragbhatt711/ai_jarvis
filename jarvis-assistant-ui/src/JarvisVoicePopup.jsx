import React, { useState, useEffect, useRef } from 'react';
import "bootstrap/dist/css/bootstrap.min.css";
import axios from 'axios';
import VoiceVisualizer from './VoiceVisualizer';
import bgImage from './assets/voice.png';

const JarvisVoicePopup = ({ show, onHide }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [message, setMessage] = useState('');
  const recognitionRef = useRef(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  // Setup speech recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition not supported in your browser!");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('🎤 Listening...');
      setIsListening(true);
    };

    recognition.onend = () => {
      console.log('🛑 Stopped listening.');
      setIsListening(false);
    };

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setMessage(text);
      console.log(`📝 Recognized text: ${text}`);
      
      await getAIResponse(text);
    };

    recognitionRef.current = recognition;
  }, []);

  // Start listening when popup is shown
  useEffect(() => {
    if (show && recognitionRef.current) {
      recognitionRef.current.start();
    }
  }, [show]);

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleClose = () => {
    window.speechSynthesis.cancel(); // 🔇 Stop speaking
    if (recognitionRef.current) {
        recognitionRef.current.abort(); // 🛑 Stop listening
    }
    onHide();
  };

  const getAIResponse = async (text) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/voice-chat`, {
        message: text,
      });

      const jarvisReply = res.data?.response || "Sorry, I didn't catch that.";
      setResponse(jarvisReply);
      speakOutLoud(jarvisReply);
    } catch (err) {
      console.error('Error getting response:', err);
      const errorText = "There was an error processing your request.";
      setResponse(errorText);
      speakOutLoud(errorText);
      setIsListening(true);
    }
  };

  let selectedVoice = null;

  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices();

    if (!voices.length) {
      // Voice list not ready yet
      return;
    }

    selectedVoice = voices.find(v => v.name === "Google US English")
                  || voices.find(v => v.name === "Microsoft Zira - English (United States)")
                  || voices.find(v => v.name === "Google UK English Female")
                  || voices.find(v => v.lang === "en-US");
    console.log("🔊 Available voices:", selectedVoice);
    
    if (!selectedVoice) {
      console.warn("⚠️ No preferred voice found. Voices loaded:", voices.map(v => v.name));
    } else {
      console.log("✅ Selected voice:", selectedVoice.name);
    }
  };

  // Wait for voices to be loaded
  if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  // Also try to load immediately in case voices are already available
  loadVoices();

  const speakOutLoud = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.voice = selectedVoice || window.speechSynthesis.getVoices()[0]; // Fallback to first available voice
    console.log(selectedVoice);
    
     

    utterance.onend = () => {
      console.log("🗣️ Finished speaking, restarting listening...");
      startListening();
    };

    window.speechSynthesis.speak(utterance);
  };

  

  if (!show) return null; // Don't render when not visible

  return (
    <div style={styles.popup}>
      {/* Background image */}
      <img src={bgImage} alt="Jarvis AI" style={styles.bgImage} />

      {/* Voice visualizer aligned at mouth */}
      {isListening && (
        <div style={styles.waveContainer}>
          <VoiceVisualizer active={true} />
        </div>
      )}

      {/* Close button */}
      <button style={styles.closeBtn} onClick={handleClose} className='circle'>Back</button>
    </div>
  );
};

const styles = {
  popup: {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    zIndex: 9999,
    borderRadius: '20px',
    boxShadow: '0 0 20px rgba(0, 255, 255, 0.2)',
  },
  bgImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: 'brightness(1.1) saturate(1.2)',
  },
  waveContainer: {
    position: 'absolute',
    bottom: '24%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '240px',
    height: '150px',
    zIndex: 2,
    pointerEvents: 'none',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.9)',
    color: '#000',
    fontWeight: 'bold',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    zIndex: 3,
    boxShadow: '0 0 10px rgba(255,255,255,0.3)',
  }
};

export default JarvisVoicePopup;
