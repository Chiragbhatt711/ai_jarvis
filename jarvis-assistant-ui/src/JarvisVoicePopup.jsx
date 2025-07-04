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
      const res = await axios.post(`${API_BASE_URL}/chat`, {
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
    }
  };

  let selectedVoice = null;

  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    
    selectedVoice = voices.find(v => v.name === "Google US English")
                  || voices.find(v => v.name === "Microsoft Zira - English (United States)")
                  || voices.find(v => v.name === "Google UK English Female")
                  || voices.find(v => v.lang === "en-US");

    if (!selectedVoice) {
      console.warn("⚠️ No preferred voice found. Voices loaded:", voices.map(v => v.name));
    } else {
      console.log("✅ Selected voice:", selectedVoice.name);
    }
  };

  // Attach listener for when voices are ready
  window.speechSynthesis.onvoiceschanged = loadVoices;

  // Also try loading immediately (in case voices are already available)
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
      <div style={styles.waveContainer}>
        <VoiceVisualizer active={isListening} />
      </div>

      {/* Close button */}
      <button style={styles.closeBtn} onClick={handleClose} className='circle'>Back</button>
    </div>
  );
};

const styles = {
  popup: {
    position: 'fixed',
    top: '63px',
    left: '269px',
    width: '78vw',
    height: '84vh',
    overflow: 'hidden',
    zIndex: 9999,
  },
  bgImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  waveContainer: {
    position: 'absolute',
    bottom: '23%',  // Adjust to align with mouth
    left: '45%',
    width: '317px',
    height: '200px',
    zIndex: 2,
    pointerEvents: 'none',
    backgroundColor: 'transparent',
    backdropFilter: 'none',
  },
  closeBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: '10px 20px',
    border: 'none',
    background: '#fff',
    color: '#000',
    fontWeight: 'bold',
    borderRadius: '5px',
    zIndex: 3,
    cursor: 'pointer',
  }
};

export default JarvisVoicePopup;
