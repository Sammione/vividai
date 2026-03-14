import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Video, Type, Play, Plus, Loader2, Wand2, Image as ImageIcon, Download, Pause, Square } from 'lucide-react';
import { generateVideoConcept, generateImagePrompt } from './openai';
import './App.css';

function App() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [currentScene, setCurrentScene] = useState(0);
  const [sceneImages, setSceneImages] = useState([]);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [keyMissing, setKeyMissing] = useState(!import.meta.env.VITE_OPENAI_API_KEY);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setIsPlaying(false);
    try {
      const data = await generateVideoConcept(prompt);
      setResult(data);
      setCurrentScene(0);
      setSceneImages([]);
    } catch (error) {
      console.error(error);
      alert('Failed to generate concept. Check console.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImages = async () => {
    if (!result) return;
    setGeneratingImages(true);
    try {
      const images = await Promise.all(
        result.scenes.map(scene => generateImagePrompt(scene.description))
      );
      setSceneImages(images);
    } catch (error) {
      console.error(error);
      alert('Failed to generate images.');
    } finally {
      setGeneratingImages(false);
    }
  };

  useEffect(() => {
    let interval;
    if (isPlaying && result && sceneImages.length > 0) {
      interval = setInterval(() => {
        setCurrentScene((prev) => (prev + 1) % result.scenes.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, result, sceneImages]);

  const startRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    recordedChunks.current = [];
    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      bitsPerSecond: 5000000 
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vividai-production-${Date.now()}.mp4`; // Naming it mp4 so users can play it easily
      a.click();
      setIsRecording(false);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    setIsPlaying(true);
    setCurrentScene(0);

    // Stop recording after full loop (15 seconds for 3 scenes)
    setTimeout(() => {
        if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            setIsPlaying(false);
        }
    }, 15000);
  };

  const togglePlayback = () => {
    if (sceneImages.length === 0) {
        alert("Please generate images first!");
        return;
    }
    setIsPlaying(!isPlaying);
  };

  const downloadAssets = async () => {
    if (!sceneImages.length) return;
    
    sceneImages.forEach((url, index) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = `vividai-scene-${index + 1}.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  return (
    <div className="container">
      <nav className="navbar">
        <div className="logo">
          <Sparkles className="icon-purple" />
          <span>VividAI</span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#pricing">Enterprise</a>
          <button className="btn-secondary">Sign In</button>
        </div>
      </nav>

      <main>
        <div className="hero">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glow-text"
          >
            Animate Your Ideas <br /> Instantly.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="hero-subtitle"
          >
            The world's first AI Video Assistant that turns prompts into complete 
            storyboards, scripts, and production-ready animations.
          </motion.p>

          {keyMissing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="key-warning glass-card"
            >
              <p>⚠️ OpenAI API Key is missing. Please add <strong>VITE_OPENAI_API_KEY</strong> to your Vercel Environment Variables.</p>
            </motion.div>
          )}

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="input-container glass-card"
          >
            <div className="input-wrapper">
              <Wand2 className="input-icon" />
              <input 
                type="text" 
                placeholder="Describe your video idea (e.g., A cyberpunk cat in a neon city)..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
              />
              <button 
                className="btn-primary" 
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? <Loader2 className="spin" /> : 'Generate'}
              </button>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {result && (
            <motion.section 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="result-section"
            >
              <div className="grid-container">
                {/* Preview Panel */}
                <div className="preview-panel glass-card">
                  <div className="panel-header">
                    <h3><Video className="icon-small" /> Visual Production</h3>
                    {!sceneImages.length ? (
                        <button 
                            className="btn-text" 
                            onClick={handleGenerateImages}
                            disabled={generatingImages}
                        >
                            {generatingImages ? <Loader2 className="spin" size={16} /> : <><ImageIcon size={16} /> Generate Assets</>}
                        </button>
                    ) : null}
                  </div>
                  
                  <div className="video-viewport">
                    {sceneImages.length > 0 ? (
                        <div className="canvas-container" style={{ width: '100%', height: '100%' }}>
                            <CanvasRenderer 
                                currentScene={currentScene}
                                images={sceneImages}
                                subtitles={result.subtitles}
                                canvasRef={canvasRef}
                                isPlaying={isPlaying}
                            />
                        </div>
                    ) : (
                        <div className="placeholder-preview">
                            <Play className="play-icon" />
                            <p>Scene {currentScene + 1} Preview</p>
                            <p className="scene-desc-short">{result.scenes[currentScene].description}</p>
                        </div>
                    )}
                  </div>

                  <div className="playback-controls">
                    <button className="btn-circle" onClick={togglePlayback} disabled={sceneImages.length === 0}>
                        {isPlaying ? <Pause /> : <Play />}
                    </button>
                    <div className="progress-bar">
                        <motion.div 
                            className="progress-fill"
                            animate={{ width: isPlaying ? '100%' : '0%' }}
                            transition={{ duration: 15, ease: "linear" }}
                            key={isPlaying}
                        />
                    </div>
                  </div>

                  <div className="scene-controls">
                    {result.scenes.map((_, idx) => (
                      <button 
                        key={idx}
                        className={`scene-dot ${currentScene === idx ? 'active' : ''}`}
                        onClick={() => setCurrentScene(idx)}
                      >
                        Scene {idx + 1}
                      </button>
                    ))}
                  </div>

                  {sceneImages.length > 0 && (
                    <div className="action-row">
                         <button className="btn-download" onClick={startRecording} disabled={isRecording}>
                            {isRecording ? <><Loader2 className="spin" size={18} /> Recording Video...</> : <><Download size={18} /> Export as MP4 Video</>}
                        </button>
                    </div>
                  )}
                </div>

                {/* Script Panel */}
                <div className="script-panel glass-card">
                  <h3><Type className="icon-small" /> Production Script</h3>
                  <div className="script-content">
                    {result.scenes.map((scene, idx) => (
                      <div 
                        key={idx} 
                        className={`script-item ${currentScene === idx ? 'active' : ''}`}
                        onClick={() => setCurrentScene(idx)}
                      >
                        <span className="scene-number">0{idx + 1}</span>
                        <div className="script-text">
                          <h4>Scene Description</h4>
                          <p>{scene.description}</p>
                          <h4>Voiceover / Script</h4>
                          <p className="voiceover">"{scene.script}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="subtitles-track glass-card">
                <h3>Subtitles Timeline</h3>
                <div className="subs-list">
                    {result.subtitles.map((sub, idx) => (
                        <div key={idx} className="sub-tag">
                            <span className="sub-time">{sub.time}s</span>
                            <span className="sub-text">{sub.text}</span>
                        </div>
                    ))}
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <footer className="footer">
        <p>&copy; 2024 VividAI. Powered by GPT-4o & DALL-E 3.</p>
      </footer>
    </div>
  );
}

function CanvasRenderer({ currentScene, images, subtitles, canvasRef, isPlaying }) {
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrame;

        // Set dimensions
        canvas.width = 1280;
        canvas.height = 720;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = images[currentScene];

        let startTime = Date.now();

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw background image with slight pan (Ken Burns effect)
            const elapsed = (Date.now() - startTime) / 1000;
            const factor = isPlaying ? 1 + (elapsed * 0.05) : 1;
            
            const w = canvas.width * factor;
            const h = canvas.height * factor;
            const x = (canvas.width - w) / 2;
            const y = (canvas.height - h) / 2;
            
            ctx.drawImage(img, x, y, w, h);

            // Overlay Subtitles
            const currentTime = (currentScene * 5) + (isPlaying ? elapsed % 5 : 0);
            const currentSub = subtitles.find(s => {
                const sTime = parseInt(s.time);
                return sTime <= currentTime && (sTime + 2.5) > currentTime;
            });

            if (currentSub) {
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(100, canvas.height - 120, canvas.width - 200, 80);
                
                ctx.font = 'bold 40px Inter, sans-serif';
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.fillText(currentSub.text, canvas.width / 2, canvas.height - 65);
            }

            // Watermark
            ctx.globalAlpha = 0.5;
            ctx.font = '24px Inter';
            ctx.fillStyle = 'cyan';
            ctx.fillText('VividAI Production', 150, 50);
            ctx.globalAlpha = 1.0;

            animationFrame = requestAnimationFrame(render);
        };

        img.onload = () => {
            render();
        };

        return () => cancelAnimationFrame(animationFrame);
    }, [currentScene, images, subtitles, isPlaying]);

    return (
        <canvas 
            ref={canvasRef} 
            style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                borderRadius: '16px' 
            }} 
        />
    );
}

export default App;
