import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { CodeEditor } from '../features/editor/CodeEditor';
import { FileExplorer } from '../features/editor/FileExplorer';
import { AgentPanel } from '../features/agent/AgentPanel';
import { FloatingWindow } from '../components/ui/FloatingWindow';
import { BottomPanel } from '../features/editor/BottomPanel';
import { useStore } from '../store/useStore';
import { AnimatePresence } from 'motion/react';
import { translations } from '../i18n/translations';

export function EditorPage() {
  const { mode, isFileExplorerOpen, isBottomPanelOpen, isAuthenticated, language } = useStore();
  const t = translations[language].ide;
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  return (
    <MainLayout>
      {/* Split Pane Layout */}
      <div className="flex-1 flex gap-4 overflow-hidden relative">
        {/* File Explorer */}
        {isFileExplorerOpen && (
          <div className="shrink-0 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <FileExplorer />
          </div>
        )}

        {/* Editor Area & Bottom Panel */}
        <div className="flex-1 flex flex-col gap-4 min-w-[300px] overflow-hidden">
          <CodeEditor />
          <AnimatePresence>
            {isBottomPanelOpen && (
              <div className="shrink-0 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <BottomPanel />
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Agent Panel (Fixed in advanced mode, floating in beginner mode) */}
        {mode === 'advanced' ? (
          <div className="w-[350px] shrink-0 flex flex-col gap-4">
            <AgentPanel />
          </div>
        ) : (
          <FloatingWindow 
            title={`✨ ${t.agent.title}`}
            defaultPosition={{ x: 50, y: 50 }}
            className="w-[350px] h-[500px]"
          >
            <AgentPanel />
          </FloatingWindow>
        )}
      </div>
    </MainLayout>
  );
}
