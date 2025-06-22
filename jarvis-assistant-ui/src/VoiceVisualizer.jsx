// src/VoiceVisualizer.jsx
import React, { useRef, useEffect } from 'react';

const VoiceVisualizer = ({ active }) => {
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true }); // ✅ Enable alpha for full transparency
    canvas.width = 300;
    canvas.height = 200;

    if (!active) return;

    const startAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;

        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);

        sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
        sourceRef.current.connect(analyserRef.current);

        draw();
      } catch (error) {
        console.error('Microphone access error:', error);
      }
    };

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      const ctx = canvasRef.current.getContext('2d');
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      const volume = dataArrayRef.current.reduce((a, b) => a + b, 0) / dataArrayRef.current.length;

      // ✅ Clear with full transparency
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw glowing wave
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 25;
      ctx.shadowColor = 'cyan';

      for (let x = 0; x < canvas.width; x++) {
        const wave = Math.sin(x * 0.02 + Date.now() * 0.005);
        const y = canvas.height / 2 + wave * volume * 0.2;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    };

    startAudio();

    return () => {
      cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent', // ✅ No background
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
      }}
    />
  );
};

export default VoiceVisualizer;
