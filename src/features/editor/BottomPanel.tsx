import React, { useState, useRef, useEffect } from 'react';
import { X, AlertTriangle, Terminal as TerminalIcon, ShieldAlert, PlayCircle, Radio, AlertCircle, Trash2 } from 'lucide-react';
import { useStore, BottomPanelTab } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'motion/react';
import { translations } from '../../i18n/translations';

export function BottomPanel() {
  const { isBottomPanelOpen, setBottomPanelOpen, bottomPanelTab, setBottomPanelTab, language, markers, setActiveFile, setOpenFiles, openFiles, consoleLogs, clearConsoleLogs } = useStore();
  const t = translations[language].ide.bottomPanel;

  const tabs: { id: BottomPanelTab; label: string; icon?: React.ReactNode }[] = [
    { id: 'problems', label: t.problems },
    { id: 'output', label: t.output },
    { id: 'debug', label: t.debug },
    { id: 'terminal', label: t.terminal },
    { id: 'ports', label: t.ports },
  ];

  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  const [terminalInput, setTerminalInput] = useState('');
  const [outputContent, setOutputContent] = useState<string>('');
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (bottomPanelTab === 'terminal' && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    if (bottomPanelTab === 'terminal' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [terminalHistory, bottomPanelTab]);

  const handleTerminalSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (terminalInput.trim() === 'clear') {
        setTerminalHistory([]);
      } else if (terminalInput.trim() === 'node script.js') {
        setTerminalHistory([...terminalHistory, `~/vibe-craft $ ${terminalInput}`]);
        setOutputContent('> node script.js\nVibeCraft initialized! ✨\n\n[Process completed in 0.12s]');
        setBottomPanelTab('output');
      } else if (terminalInput.trim()) {
        setTerminalHistory([...terminalHistory, `~/vibe-craft $ ${terminalInput}`, `bash: ${terminalInput}: command not found`]);
      } else {
        setTerminalHistory([...terminalHistory, `~/vibe-craft $`]);
      }
      setTerminalInput('');
    }
  };

  // Flatten markers into a single array for rendering
  const allMarkers = Object.entries(markers).flatMap(([file, fileMarkers]) =>
    fileMarkers.map(marker => ({ file, ...marker }))
  );

  const errorCount = allMarkers.filter(m => m.severity === 8).length;
  const warningCount = allMarkers.filter(m => m.severity === 4).length;

  const handleMarkerClick = (file: string) => {
    if (!openFiles.includes(file)) {
      setOpenFiles([...openFiles, file]);
    }
    setActiveFile(file);
  };

  if (!isBottomPanelOpen) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 250, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full bg-[#1e1e1e] border-t border-white/10 flex flex-col shrink-0 relative z-10"
    >
      {/* Tabs Header */}
      <div className="flex items-center justify-between h-9 border-b border-white/5 px-2 bg-[#181818]">
        <div className="flex items-center h-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setBottomPanelTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 h-full px-3 text-[11px] uppercase tracking-wider font-medium transition-colors border-b-2",
                bottomPanelTab === tab.id
                  ? "text-white border-indigo-500"
                  : "text-white/50 border-transparent hover:text-white/80"
              )}
            >
              {tab.label}
              {tab.id === 'problems' && (errorCount > 0 || warningCount > 0) && (
                <div className="flex items-center gap-1.5 ml-1">
                  {errorCount > 0 && <span className="flex items-center gap-0.5 text-red-400"><AlertCircle size={10} />{errorCount}</span>}
                  {warningCount > 0 && <span className="flex items-center gap-0.5 text-yellow-400"><AlertTriangle size={10} />{warningCount}</span>}
                </div>
              )}
              {tab.icon}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 pr-2">
          <button
            onClick={() => setBottomPanelOpen(false)}
            className="p-1 text-white/50 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div
        className="flex-1 overflow-auto custom-scrollbar p-3 text-sm font-mono text-white/80"
        onClick={() => {
          if (bottomPanelTab === 'terminal' && inputRef.current) {
            inputRef.current.focus();
          }
        }}
      >
        {bottomPanelTab === 'problems' && (
          <div className="flex flex-col gap-2">
            {allMarkers.length === 0 ? (
              <div className="text-white/50 italic">No problems have been detected in the workspace.</div>
            ) : (
              allMarkers.map((marker, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-2 hover:bg-white/5 rounded cursor-pointer transition-colors"
                  onClick={() => handleMarkerClick(marker.file)}
                >
                  <div className="mt-0.5 shrink-0">
                    {marker.severity === 8 ? (
                      <AlertCircle size={14} className="text-red-400" />
                    ) : marker.severity === 4 ? (
                      <AlertTriangle size={14} className="text-yellow-400" />
                    ) : (
                      <ShieldAlert size={14} className="text-blue-400" />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-white/90">{marker.message}</div>
                    <div className="text-xs text-white/50 flex items-center gap-2">
                      <span className="text-blue-400">{marker.file}</span>
                      <span>[{marker.startLineNumber}, {marker.startColumn}]</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {bottomPanelTab === 'terminal' && (
          <div className="flex flex-col gap-1">
            {terminalHistory.map((line, i) => (
              <div key={i} className={line.startsWith('~/vibe-craft $') ? 'text-white/80' : 'text-white/60'}>
                {line.startsWith('~/vibe-craft $') ? (
                  <>
                    <span className="text-emerald-400">~/vibe-craft $</span>
                    {line.replace('~/vibe-craft $', '')}
                  </>
                ) : (
                  line
                )}
              </div>
            ))}
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 shrink-0">~/vibe-craft $</span>
              <input
                ref={inputRef}
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={handleTerminalSubmit}
                className="flex-1 bg-transparent border-none outline-none text-white/80 font-mono text-sm"
                spellCheck={false}
                autoComplete="off"
              />
            </div>
            <div ref={terminalEndRef} />
          </div>
        )}

        {bottomPanelTab === 'output' && (
          <div className="flex flex-col gap-0">
            {/* Output header with count and clear */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Console Output</span>
                {consoleLogs.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50">
                    {consoleLogs.length} log{consoleLogs.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {consoleLogs.length > 0 && (
                <button
                  onClick={clearConsoleLogs}
                  className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white/70 transition-colors"
                >
                  <Trash2 size={10} />
                  Clear
                </button>
              )}
            </div>

            {consoleLogs.length === 0 ? (
              <div className="text-white/50 italic text-xs">
                No console output yet. Add <code className="bg-white/10 px-1 rounded text-emerald-300">console.log()</code> to your code to see output here.
              </div>
            ) : (
              consoleLogs.map((log, idx) => {
                const time = new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-start gap-2 py-1 px-2 border-b border-white/[0.03] hover:bg-white/[0.02] text-xs font-mono",
                      log.type === 'error' && "bg-red-500/5",
                      log.type === 'warn' && "bg-yellow-500/5",
                    )}
                  >
                    <span className="text-white/20 shrink-0 w-16 text-[10px]">{time}</span>
                    <span className={cn(
                      "shrink-0 w-4",
                      log.type === 'log' && "text-emerald-400",
                      log.type === 'info' && "text-blue-400",
                      log.type === 'warn' && "text-yellow-400",
                      log.type === 'error' && "text-red-400",
                    )}>
                      {log.type === 'error' ? '✕' : log.type === 'warn' ? '⚠' : log.type === 'info' ? 'ℹ' : '›'}
                    </span>
                    <span className={cn(
                      "whitespace-pre-wrap break-all flex-1",
                      log.type === 'error' ? "text-red-300" :
                        log.type === 'warn' ? "text-yellow-200" :
                          log.type === 'info' ? "text-blue-300" :
                            "text-white/80"
                    )}>
                      {log.content}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}

        {bottomPanelTab === 'debug' && (
          <div className="text-white/50 italic">Please start a debug session to evaluate expressions.</div>
        )}

        {bottomPanelTab === 'ports' && (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-4 gap-4 text-xs font-sans text-white/50 pb-2 border-b border-white/10 uppercase tracking-wider">
              <div>Port</div>
              <div>Process</div>
              <div>Address</div>
              <div>Status</div>
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm font-mono items-center">
              <div className="text-blue-400">5173</div>
              <div className="text-white/80">vite</div>
              <div className="text-white/60 hover:text-white hover:underline cursor-pointer">localhost:5173</div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                Active
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

