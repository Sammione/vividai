import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Video, Type, Play, Plus, Loader2, Wand2, Image as ImageIcon, Download } from 'lucide-react';
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

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
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
                    {sceneImages[currentScene] ? (
                        <motion.img 
                            key={sceneImages[currentScene]}
                            src={sceneImages[currentScene]} 
                            initial={{ scale: 1.1, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="scene-image"
                        />
                    ) : (
                        <div className="placeholder-preview">
                            <Play className="play-icon" />
                            <p>Scene {currentScene + 1} Preview</p>
                            <p className="scene-desc-short">{result.scenes[currentScene].description}</p>
                        </div>
                    )}
                    
                    <div className="subtitle-overlay">
                      {result.subtitles.find(s => parseInt(s.time) <= (currentScene + 1) * 5 && parseInt(s.time) > currentScene * 5)?.text || 
                       result.subtitles[currentScene*2]?.text}
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
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                         <button className="btn-download" onClick={downloadAssets}>
                            <Download size={18} /> Download Production Assets
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

export default App;
