import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Code2, Zap, Layout, TerminalSquare, ArrowRight, Globe, UserCircle, ChevronDown, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { translations } from '../i18n/translations';
import { cn } from '../utils/cn';

export function LandingPage() {
  const { language, setLanguage, isAuthenticated, user, setPendingPrompt, setPendingModel } = useStore();
  const t = translations[language].landing;
  const [index, setIndex] = useState(0);
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('Gemini 3 Flash');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const modelRef = useRef<HTMLDivElement>(null);

  const models = [
    { id: 'Gemini 3 Flash', isNew: true, provider: 'Google' },
    { id: 'Qwen 3 Coder', isNew: true, provider: 'Ollama' },
    { id: 'GPT-OSS 120B', isNew: true, provider: 'Ollama' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % t.words.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [t.words.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'vi' : 'en');
  };

  const handleTryNow = () => {
    setShowPromptInput(true);
  };

  const handleSubmitPrompt = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setPendingPrompt(prompt);
    setPendingModel(selectedModel);

    const hasOnboarded = localStorage.getItem('vibecraft_onboarding');

    if (isAuthenticated) {
      navigate(hasOnboarded ? '/editor' : '/onboarding');
    } else {
      navigate(`/auth?mode=signup&redirect=${hasOnboarded ? 'editor' : 'onboarding'}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitPrompt();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-indigo-900/20 blur-[120px] mix-blend-screen" />
        <div className="absolute top-[60%] -right-[20%] w-[60%] h-[60%] rounded-full bg-emerald-900/10 blur-[120px] mix-blend-screen" />
        <div className="absolute top-[20%] left-[40%] w-[40%] h-[40%] rounded-full bg-purple-900/10 blur-[100px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20 mix-blend-overlay" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">VibeCraft</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium border border-white/10"
          >
            <Globe size={14} />
            {language === 'en' ? 'EN' : 'VI'}
          </button>

          {isAuthenticated ? (
            <Link to="/editor" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors border border-white/10">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full" />
              ) : (
                <UserCircle size={18} />
              )}
              {user?.name || 'Dashboard'}
            </Link>
          ) : (
            <>
              <Link to="/auth" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                {t.login}
              </Link>
              <Link to="/auth?mode=signup" className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors">
                {t.signup}
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-indigo-300 mb-8"
        >
          <Sparkles size={14} />
          <span>{t.badge}</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight flex flex-col items-center justify-center"
        >
          <span>{t.titlePrefix}</span>
          <div className="h-[1.2em] relative overflow-hidden flex items-center justify-center w-full mt-2">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={index}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -40, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 animate-gradient"
              >
                {t.words[index]}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-white/60 max-w-2xl mb-10 mt-4"
        >
          {t.description}
        </motion.p>

        <AnimatePresence mode="wait">
          {!showPromptInput ? (
            <motion.div
              key="try-now-btn"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex justify-center w-full"
            >
              <button
                onClick={handleTryNow}
                className="px-10 py-4 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors shadow-[0_0_30px_rgba(99,102,241,0.3)] flex items-center gap-2 text-lg"
              >
                Try now
                <ArrowRight size={20} />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="prompt-input"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, type: "spring", bounce: 0.4 }}
              className="w-full max-w-2xl bg-[#1e1e1e] border border-white/10 rounded-2xl p-2 shadow-2xl relative z-20"
            >
              <div className="flex flex-col bg-[#2a2a2a] border border-white/10 rounded-xl focus-within:border-white/20 transition-all">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="What do you want to build? (e.g. A personal portfolio with a dark theme)"
                  className="w-full bg-transparent border-none text-white placeholder:text-white/40 resize-none outline-none min-h-[80px] max-h-[200px] text-[15px] p-4 custom-scrollbar"
                  rows={3}
                  autoFocus
                />

                <div className="flex items-center justify-between p-3 pt-0 border-t border-white/5 mt-2">
                  <div className="relative" ref={modelRef}>
                    <button
                      onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors border border-white/5"
                    >
                      {selectedModel}
                      <ChevronDown size={14} />
                    </button>

                    <AnimatePresence>
                      {isModelDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          transition={{ duration: 0.1 }}
                          className="absolute bottom-full left-0 mb-2 w-64 bg-[#2a2a2a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                        >
                          <div className="px-3 py-2 text-xs font-medium text-white/40 border-b border-white/5">
                            Select Model
                          </div>
                          <div className="p-1 max-h-[200px] overflow-y-auto custom-scrollbar">
                            {models.map(m => (
                              <button
                                key={m.id}
                                onClick={() => { setSelectedModel(m.id); setIsModelDropdownOpen(false); }}
                                className={cn(
                                  "w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors",
                                  selectedModel === m.id ? "bg-white/10 text-white" : "text-white/70"
                                )}
                              >
                                <div className="flex flex-col items-start">
                                  <span className="text-[13px] font-medium">{m.id}</span>
                                  <span className="text-[10px] text-white/40">{m.provider}</span>
                                </div>
                                {m.isNew && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">New</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    onClick={handleSubmitPrompt}
                    disabled={!prompt.trim()}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[13px] font-medium"
                  >
                    Generate
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full text-left"
        >
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-4">
              <Zap size={20} className="text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t.features.fast.title}</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              {t.features.fast.desc}
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4">
              <Layout size={20} className="text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t.features.ui.title}</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              {t.features.ui.desc}
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
              <TerminalSquare size={20} className="text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t.features.tools.title}</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              {t.features.tools.desc}
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}


