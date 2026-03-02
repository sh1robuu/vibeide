import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Code2, Sparkles, Lightbulb, Loader2, Plus, ChevronDown, Mic, ArrowRight, User, Trash2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { agentService, PromptEvaluation, IdeaSuggestion } from '../../services/agentService';
import type { FileChange } from '../../services/agentService';
import { cn } from '../../utils/cn';
import { PromptEvaluationCard } from './PromptEvaluationCard';
import { FileChangesCard } from './FileChangesCard';
import { translations } from '../../i18n/translations';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
  fileChanges?: FileChange[];
};

export function AgentPanel() {
  const { activeTab, setActiveTab, files, language, user, pendingPrompt, pendingModel, setPendingPrompt, setPendingModel, pendingFileChanges, setPendingFileChanges, applyPendingChanges } = useStore();
  const t = translations[language].ide.agent;
  const [prompt, setPrompt] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<PromptEvaluation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState<IdeaSuggestion[]>([]);
  const [isFetchingIdeas, setIsFetchingIdeas] = useState(false);

  const [conversationMode, setConversationMode] = useState('Planning');
  const [selectedModel, setSelectedModel] = useState('Gemini 3 Flash');
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [mentorModel, setMentorModel] = useState('Gemini 3 Flash');

  const getChatKey = () => `vibebot-chat-history-${user?.uid || 'guest'}`;

  // Load chat from localStorage (scoped per user)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(`vibebot-chat-history-${user?.uid || 'guest'}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  const modeRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Reload chat when user changes (login/logout/switch)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(getChatKey());
      setChatHistory(saved ? JSON.parse(saved) : []);
    } catch {
      setChatHistory([]);
    }
  }, [user?.uid]);

  // Save chat to localStorage whenever it changes (scoped per user)
  useEffect(() => {
    try {
      const toSave = chatHistory.filter(m => m.id !== streamingMessageId);
      localStorage.setItem(getChatKey(), JSON.stringify(toSave));
    } catch {
      // Ignore storage errors
    }
  }, [chatHistory, streamingMessageId, user?.uid]);

  useEffect(() => {
    if (pendingPrompt) {
      setPrompt(pendingPrompt);
      if (pendingModel) {
        setSelectedModel(pendingModel);
      }
      // Clear the pending state
      setPendingPrompt(null);
      setPendingModel(null);

      // Auto-trigger generation after a short delay to allow state to settle
      setTimeout(() => {
        handleGenerateWithPrompt(pendingPrompt, pendingModel || 'Gemini 3 Flash');
      }, 500);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modeRef.current && !modeRef.current.contains(event.target as Node)) {
        setIsModeDropdownOpen(false);
      }
      if (modelRef.current && !modelRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const handleEvaluate = async () => {
    if (!prompt.trim()) return;
    setIsEvaluating(true);
    setEvaluation(null);
    const result = await agentService.evaluatePrompt(prompt, language, mentorModel);
    setEvaluation(result);
    setIsEvaluating(false);
  };

  const handleGenerateWithPrompt = async (text: string, model: string) => {
    if (!text.trim()) return;

    const userMessageId = Date.now().toString();
    const assistantMsgId = (Date.now() + 1).toString();

    setChatHistory(prev => [...prev, { id: userMessageId, role: 'user', content: text }]);

    setIsGenerating(true);
    setStreamingMessageId(assistantMsgId);

    // Add to prompt history
    setPromptHistory(prev => [text, ...prev]);
    setHistoryIndex(-1);
    setPrompt('');

    // Add placeholder streaming message
    setChatHistory(prev => [...prev, {
      id: assistantMsgId,
      role: 'assistant',
      content: '⏳ Thinking...',
    }]);

    try {
      const response = await agentService.chatStream(text, files, model, (liveText) => {
        // Update the streaming message with progressive text
        setChatHistory(prev => prev.map(m =>
          m.id === assistantMsgId ? { ...m, content: liveText || '⏳ Thinking...' } : m
        ));
      });

      // Finalize the message with the complete response + fileChanges
      setChatHistory(prev => prev.map(m =>
        m.id === assistantMsgId ? {
          ...m,
          content: response.message,
          fileChanges: response.fileChanges,
        } : m
      ));

      // Store file changes as pending for review
      if (response.hasCodeChange && response.fileChanges) {
        setPendingFileChanges(response.fileChanges);
      }
    } catch (error: any) {
      setChatHistory(prev => prev.map(m =>
        m.id === assistantMsgId ? {
          ...m,
          content: `Error: ${error.message || 'Failed to connect to AI API'}`,
          isError: true,
        } : m
      ));
    } finally {
      setIsGenerating(false);
      setStreamingMessageId(null);
    }
  };

  const clearChat = () => {
    setChatHistory([]);
    setPendingFileChanges(null);
    localStorage.removeItem(getChatKey());
  };

  const handleGenerate = () => {
    handleGenerateWithPrompt(prompt, selectedModel);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < promptHistory.length - 1) {
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setPrompt(promptHistory[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const prevIndex = historyIndex - 1;
        setHistoryIndex(prevIndex);
        setPrompt(promptHistory[prevIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setPrompt('');
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (activeTab === 'mentor') {
        handleEvaluate();
      } else {
        handleGenerate();
      }
    }
  };

  const loadIdeas = async () => {
    setIsFetchingIdeas(true);
    const result = await agentService.generateIdeas(files, language);
    setIdeas(result);
    setIsFetchingIdeas(false);
  };

  const modes = [
    { id: 'Planning', title: 'Planning', desc: 'Agent can plan before executing tasks. Use for deep research, complex tasks, or collaborative work' },
    { id: 'Fast', title: 'Fast', desc: 'Agent will execute tasks directly. Use for simple tasks that can be completed faster' }
  ];

  const models = [
    { id: 'Gemini 3 Flash', isNew: true, provider: 'Google' },
    { id: 'Qwen 3 Coder', isNew: true, provider: 'Ollama' },
    { id: 'GPT-OSS 120B', isNew: true, provider: 'Ollama' },
  ];

  return (
    <div className="flex flex-col h-full w-full rounded-2xl overflow-hidden border border-white/10 bg-[#1e1e1e] shadow-2xl relative">
      {/* Tabs */}
      <div className="flex items-center h-12 bg-black/20 border-b border-white/5 px-2 z-10 shrink-0">
        <button
          onClick={() => setActiveTab('code')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 h-8 rounded-lg text-sm font-medium transition-all",
            activeTab === 'code' ? "bg-white/10 text-white shadow-inner" : "text-white/50 hover:text-white hover:bg-white/5"
          )}
        >
          <Code2 size={16} />
          <span>Code</span>
        </button>
        <button
          onClick={() => setActiveTab('mentor')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 h-8 rounded-lg text-sm font-medium transition-all",
            activeTab === 'mentor' ? "bg-emerald-500/20 text-emerald-300 shadow-inner" : "text-white/50 hover:text-white hover:bg-white/5"
          )}
        >
          <Sparkles size={16} />
          <span>Mentor</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('ideas');
            if (ideas.length === 0) loadIdeas();
          }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 h-8 rounded-lg text-sm font-medium transition-all",
            activeTab === 'ideas' ? "bg-amber-500/20 text-amber-300 shadow-inner" : "text-white/50 hover:text-white hover:bg-white/5"
          )}
        >
          <Lightbulb size={16} />
          <span>Ideas</span>
        </button>
        {/* New Chat button */}
        {activeTab === 'code' && chatHistory.length > 0 && (
          <button
            onClick={clearChat}
            className="ml-1 p-1.5 text-white/30 hover:text-white/70 hover:bg-white/5 rounded-lg transition-colors"
            title="New Chat"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
        <AnimatePresence mode="wait">
          {activeTab === 'code' && (
            <motion.div
              key="code"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/80">
                Hi! I'm your Code Agent. Tell me what you want to build or change in your project.
              </div>

              {chatHistory.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  <div className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "")}>
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      msg.role === 'user' ? "bg-indigo-500/20 text-indigo-300" : "bg-emerald-500/20 text-emerald-300"
                    )}>
                      {msg.role === 'user' ? <User size={16} /> : <Code2 size={16} />}
                    </div>
                    <div className={cn(
                      "px-4 py-2.5 rounded-2xl max-w-[85%] text-sm",
                      msg.role === 'user'
                        ? "bg-indigo-500/20 text-indigo-100 rounded-tr-sm whitespace-pre-wrap"
                        : msg.isError
                          ? "bg-red-500/20 text-red-200 border border-red-500/30 rounded-tl-sm whitespace-pre-wrap"
                          : "bg-white/5 text-white/80 border border-white/10 rounded-tl-sm whitespace-pre-wrap"
                    )}>
                      {/* Streaming / Thinking indicator */}
                      {msg.role === 'assistant' && msg.id === streamingMessageId ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-emerald-400">
                            <Loader2 size={14} className="animate-spin" />
                            <span className="text-xs font-medium uppercase tracking-wider">Thinking...</span>
                          </div>
                          <div className="bg-black/30 rounded-lg p-3 border border-white/5 text-xs text-white/50 max-h-[200px] overflow-y-auto custom-scrollbar font-mono leading-relaxed">
                            {msg.content || '...'}
                          </div>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>

                  {/* Show Review Changes card for messages with file changes */}
                  {msg.role === 'assistant' && msg.fileChanges && msg.fileChanges.length > 0 && pendingFileChanges && (
                    <div className="ml-11">
                      <FileChangesCard
                        fileChanges={msg.fileChanges}
                        currentFiles={files}
                        onAccept={() => {
                          applyPendingChanges();
                          setChatHistory(prev => [...prev, {
                            id: Date.now().toString(),
                            role: 'assistant',
                            content: '✅ Changes applied successfully!',
                          }]);
                        }}
                        onReject={() => {
                          setPendingFileChanges(null);
                          setChatHistory(prev => [...prev, {
                            id: Date.now().toString(),
                            role: 'assistant',
                            content: '❌ Changes rejected.',
                          }]);
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}


              <div ref={chatEndRef} />
            </motion.div>
          )}

          {activeTab === 'mentor' && (
            <motion.div
              key="mentor"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-4 text-sm text-emerald-200/80">
                {language === 'vi'
                  ? 'Xin chào! Tôi là chuyên gia Prompt Engineering cho coding. Viết prompt bên dưới để được đánh giá và cải thiện chất lượng prompt coding của bạn! 🚀'
                  : 'Hi! I\'m your Coding Prompt Expert! Write a coding prompt below and I\'ll help you improve it with technical details and best practices.'}
              </div>

              {/* Mentor Model Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40">{language === 'vi' ? 'Model:' : 'Model:'}</span>
                <div className="flex rounded-lg border border-white/10 overflow-hidden">
                  {['Gemini 3 Flash', 'GPT-OSS 120B'].map(m => (
                    <button
                      key={m}
                      onClick={() => setMentorModel(m)}
                      className={cn(
                        "px-3 py-1 text-xs transition-colors",
                        mentorModel === m
                          ? "bg-emerald-500/20 text-emerald-300 font-medium"
                          : "text-white/50 hover:text-white hover:bg-white/5"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {isEvaluating ? (
                <div className="flex items-center justify-center py-8 text-emerald-400">
                  <Loader2 className="animate-spin" size={24} />
                </div>
              ) : evaluation ? (
                <PromptEvaluationCard
                  evaluation={evaluation}
                  onUseImproved={(improved) => {
                    setPrompt(improved);
                    setActiveTab('code');
                  }}
                />
              ) : null}
            </motion.div>
          )}

          {activeTab === 'ideas' && (
            <motion.div
              key="ideas"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-200/80">
                {language === 'vi'
                  ? 'Bí ý tưởng? Đây là gợi ý dựa trên project của bạn! 💡'
                  : 'Stuck? Here are some ideas based on your project! 💡'}
              </div>

              {isFetchingIdeas ? (
                <div className="flex items-center justify-center py-8 text-amber-400">
                  <Loader2 className="animate-spin" size={24} />
                </div>
              ) : (
                <div className="space-y-3">
                  {ideas.map((idea) => (
                    <div key={idea.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer group">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-amber-300 group-hover:text-amber-200">{idea.title}</h4>
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                          {idea.type}
                        </span>
                      </div>
                      <p className="text-sm text-white/70">{idea.description}</p>
                    </div>
                  ))}
                  <button
                    onClick={loadIdeas}
                    className="w-full py-2 rounded-lg border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-colors text-sm"
                  >
                    {language === 'vi' ? 'Tạo thêm ý tưởng' : 'Generate More Ideas'}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#1e1e1e] shrink-0">
        <div className="flex flex-col bg-[#2a2a2a] border border-white/10 rounded-xl focus-within:border-white/20 transition-all">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={activeTab === 'mentor' ? "Type a prompt to evaluate..." : "Ask anything, @ to mention, / for workflows"}
            className="w-full bg-transparent border-none text-white placeholder:text-white/40 resize-none outline-none min-h-[60px] max-h-[200px] text-[13px] p-3 custom-scrollbar"
            rows={2}
          />

          <div className="flex items-center justify-between p-2 pt-0">
            <div className="flex items-center gap-1">
              <button className="p-1.5 text-white/50 hover:text-white hover:bg-white/5 rounded-md transition-colors">
                <Plus size={16} />
              </button>

              <div className="relative" ref={modeRef}>
                <button
                  onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-[12px] text-white/60 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                >
                  <ChevronDown size={14} />
                  {conversationMode}
                </button>

                <AnimatePresence>
                  {isModeDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.1 }}
                      className="absolute bottom-full left-0 mb-1 w-64 bg-[#2a2a2a] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50"
                    >
                      <div className="px-3 py-2 text-xs font-medium text-white/40 border-b border-white/5">
                        Conversation mode
                      </div>
                      <div className="p-1">
                        {modes.map(m => (
                          <button
                            key={m.id}
                            onClick={() => { setConversationMode(m.id); setIsModeDropdownOpen(false); }}
                            className={cn(
                              "w-full text-left p-2 rounded-md hover:bg-white/5 transition-colors",
                              conversationMode === m.id ? "bg-white/5" : ""
                            )}
                          >
                            <div className="text-[13px] text-white/90 font-medium mb-0.5">{m.title}</div>
                            <div className="text-[11px] text-white/40 leading-tight">{m.desc}</div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative" ref={modelRef}>
                <button
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-[12px] text-white/60 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                >
                  <ChevronDown size={14} />
                  {selectedModel}
                </button>

                <AnimatePresence>
                  {isModelDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.1 }}
                      className="absolute bottom-full left-0 mb-1 w-64 bg-[#2a2a2a] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50"
                    >
                      <div className="px-3 py-2 text-xs font-medium text-white/40 border-b border-white/5">
                        Model
                      </div>
                      <div className="p-1">
                        {models.map(m => (
                          <button
                            key={m.id}
                            onClick={() => { setSelectedModel(m.id); setIsModelDropdownOpen(false); }}
                            className={cn(
                              "w-full flex items-center justify-between p-2 rounded-md hover:bg-white/5 transition-colors",
                              selectedModel === m.id ? "bg-white/5" : ""
                            )}
                          >
                            <div className="flex flex-col">
                              <span className="text-[13px] text-white/80">{m.id}</span>
                              <span className="text-[10px] text-white/40">{m.provider}</span>
                            </div>
                            {m.isNew && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60">New</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button className="p-1.5 text-white/50 hover:text-white hover:bg-white/5 rounded-md transition-colors">
                <Mic size={16} />
              </button>

              {activeTab === 'mentor' ? (
                <button
                  onClick={handleEvaluate}
                  disabled={!prompt.trim() || isEvaluating}
                  className="p-1.5 rounded-md bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Evaluate Prompt"
                >
                  <Sparkles size={16} />
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="p-1.5 rounded-md bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Send"
                >
                  {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
