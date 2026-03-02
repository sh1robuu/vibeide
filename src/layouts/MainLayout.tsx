import { ReactNode, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Code2, Layout, Settings, Sparkles, TerminalSquare, UserCircle, LogOut, Globe, Zap, Save, MessageSquare, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import { MenuBar } from '../components/ui/MenuBar';
import { useNavigate } from 'react-router-dom';
import { translations } from '../i18n/translations';
import { SettingsPanel } from '../features/settings/SettingsPanel';
import { logout, saveWorkspace } from '../services/firebaseService';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const {
    mode, setMode,
    isFileExplorerOpen, setFileExplorerOpen,
    user, setIsAuthenticated, setUser,
    language, setLanguage,
    setSettingsOpen,
    isBottomPanelOpen, setBottomPanelOpen,
    bottomPanelTab, setBottomPanelTab,
    files, folders
  } = useStore();
  const t = translations[language].ide;
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleSaveWorkspace = async () => {
    if (!user?.uid) return;
    setIsSaving(true);
    try {
      await saveWorkspace(user.uid, files, folders);
      setToast({
        message: language === 'en' ? 'Workspace saved successfully!' : 'Lưu không gian làm việc thành công!',
        type: 'success'
      });
    } catch (error: any) {
      console.error("Failed to save workspace", error);
      setToast({
        message: language === 'en' ? `Failed to save workspace: ${error.message}` : `Lỗi khi lưu: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'vi' : 'en');
  };

  const handleTerminalClick = () => {
    if (isBottomPanelOpen && bottomPanelTab === 'terminal') {
      setBottomPanelOpen(false);
    } else {
      setBottomPanelOpen(true);
      setBottomPanelTab('terminal');
    }
  };

  const handleEditorClick = () => {
    setFileExplorerOpen(false);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0a0a] text-white overflow-hidden font-sans selection:bg-indigo-500/30">

      {/* Toast Notification */}
      <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[100]">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl text-sm font-medium min-w-[300px]",
                toast.type === 'success'
                  ? "bg-[#1e1e1e] border-emerald-500/30 text-emerald-400 shadow-[0_10px_40px_rgba(16,185,129,0.2)]"
                  : "bg-[#1e1e1e] border-red-500/30 text-red-400 shadow-[0_10px_40px_rgba(239,68,68,0.2)]"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                toast.type === 'success' ? "bg-emerald-500/10" : "bg-red-500/10"
              )}>
                {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              </div>
              <p className="flex-1">{toast.message}</p>
              <button
                onClick={() => setToast(null)}
                className="p-1.5 hover:bg-white/5 rounded-md transition-colors shrink-0"
              >
                <X size={14} className="text-white/50 hover:text-white" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Top Menu Bar */}
      <div className="h-9 w-full bg-[#181818] border-b border-white/5 flex items-center justify-between px-3 shrink-0 z-[100] relative">
        <div className="flex items-center gap-4">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.4)]">
            <Sparkles size={12} className="text-white" />
          </div>
          <MenuBar />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[13px] text-white/50 px-4">
            My Awesome Project - VibeCraft
          </div>
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/10 transition-colors text-xs font-medium text-white/70 hover:text-white"
          >
            <Globe size={12} />
            {language === 'en' ? 'EN' : 'VI'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-indigo-900/20 blur-[120px] mix-blend-screen" />
          <div className="absolute top-[60%] -right-[20%] w-[60%] h-[60%] rounded-full bg-emerald-900/10 blur-[120px] mix-blend-screen" />
          <div className="absolute top-[20%] left-[40%] w-[40%] h-[40%] rounded-full bg-purple-900/10 blur-[100px] mix-blend-screen" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20 mix-blend-overlay" />
        </div>

        {/* Sidebar */}
        <aside className="w-16 flex flex-col items-center py-4 border-r border-white/5 bg-black/40 backdrop-blur-xl z-20 relative">
          <nav className="flex-1 flex flex-col gap-4 w-full px-2">
            <NavItem
              icon={<Layout size={20} />}
              label={t.sidebar.files}
              active={isFileExplorerOpen}
              onClick={() => setFileExplorerOpen(!isFileExplorerOpen)}
            />
            <NavItem
              icon={<Code2 size={20} />}
              label={t.sidebar.editor}
              active={!isFileExplorerOpen}
              onClick={handleEditorClick}
            />
            <NavItem
              icon={<TerminalSquare size={20} />}
              label={t.sidebar.console}
              active={isBottomPanelOpen && bottomPanelTab === 'terminal'}
              onClick={handleTerminalClick}
            />
          </nav>

          <div className="mt-auto flex flex-col gap-4 w-full px-2 relative" ref={profileRef}>
            <button
              onClick={() => setMode(mode === 'beginner' ? 'advanced' : 'beginner')}
              className={cn(
                "p-3 rounded-xl flex items-center justify-center transition-all group relative",
                mode === 'beginner' ? "bg-emerald-500/20 text-emerald-400" : "text-white/40 hover:text-white hover:bg-white/5"
              )}
              title="Toggle Mode"
            >
              <Zap size={20} className={cn(mode === 'beginner' && "animate-pulse")} />
            </button>
            <NavItem
              icon={<Settings size={20} />}
              label={t.sidebar.settings}
              onClick={() => setSettingsOpen(true)}
            />
            <NavItem
              icon={
                user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full" />
                ) : (
                  <UserCircle size={20} />
                )
              }
              label={t.sidebar.profile}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              active={isProfileOpen}
            />

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -10, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-0 left-full ml-2 w-48 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100]"
                >
                  <div className="p-3 border-b border-white/10">
                    <div className="font-medium text-sm truncate">{user?.name || 'User'}</div>
                    <div className="text-xs text-white/50 truncate">{user?.email || 'user@example.com'}</div>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => navigate('/profile')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <UserCircle size={16} />
                      {language === 'en' ? 'Edit Profile' : 'Chỉnh sửa hồ sơ'}
                    </button>
                    <button
                      onClick={() => navigate('/feedback')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <MessageSquare size={16} />
                      {language === 'en' ? 'Feedback' : 'Phản hồi'}
                    </button>
                    <div className="h-px w-full bg-white/10 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <LogOut size={16} />
                      {t.sidebar.logout}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative z-10 p-4 gap-4 overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between h-12 rounded-2xl bg-white/5 border border-white/10 px-4 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 pr-4">
                <h1 className="font-semibold tracking-tight text-white/90">My Awesome Project</h1>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] uppercase tracking-wider text-white/60 font-medium">
                  {mode} {t.header.mode}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user?.uid && (
                <button
                  onClick={handleSaveWorkspace}
                  disabled={isSaving}
                  data-action="save-workspace"
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white/5 text-white/80 text-sm font-medium hover:bg-white/10 transition-colors border border-white/10 disabled:opacity-50"
                >
                  <Save size={14} className={cn(isSaving && "animate-pulse")} />
                  {isSaving ? "Saving..." : "Save Workspace"}
                </button>
              )}
              <button
                onClick={() => alert('Share link copied to clipboard! (Simulated)')}
                className="px-4 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 text-sm font-medium hover:bg-indigo-500/30 transition-colors border border-indigo-500/30"
              >
                {t.header.share}
              </button>
              <button
                onClick={() => alert('Project published successfully! (Simulated)')}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 text-black text-sm font-medium hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.4)]"
              >
                {t.header.publish}
              </button>
            </div>
          </header>

          {/* Workspace */}
          <div className="flex-1 flex gap-4 overflow-hidden">
            {children}
          </div>
        </main>
      </div>

      {/* Settings Panel */}
      <SettingsPanel />

      {/* Status Bar */}
      <div className="h-6 w-full bg-[#121212] border-t border-white/5 flex items-center justify-between px-4 shrink-0 z-[100] text-[10px] text-white/40 font-mono tracking-wider overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-6 whitespace-nowrap">
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></div>
            GEMINI 3 FLASH <span className="text-white/30 mx-1">·</span> <span className="text-white/60">Google</span>
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50"></div>
            QWEN 3 CODER <span className="text-white/30 mx-1">·</span> <span className="text-white/60">Ollama</span>
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50"></div>
            GPT-OSS 120B <span className="text-white/30 mx-1">·</span> <span className="text-white/60">Ollama</span>
          </span>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <span>API STATUS: <span className="text-emerald-400">ONLINE</span></span>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-3 rounded-xl flex items-center justify-center transition-all group relative",
        active ? "bg-white/10 text-white shadow-inner" : "text-white/40 hover:text-white hover:bg-white/5"
      )}
      title={label}
    >
      {icon}
      {/* Tooltip */}
      <div className="absolute left-full ml-2 px-2 py-1 bg-black/80 text-white text-xs rounded border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
        {label}
      </div>
    </button>
  );
}


