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
      const res = await axios.post("http://localhost:8000/chat", {
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

  const speakOutLoud = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';

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
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
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
    top: 53,
    right: 20,
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
