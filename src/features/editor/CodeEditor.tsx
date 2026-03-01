import React, { useRef, useEffect } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { X, Play, Wand2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { PreviewFrame } from '../preview/PreviewFrame';
import { translations } from '../../i18n/translations';
import type { editor } from 'monaco-editor';

export function CodeEditor() {
  const { openFiles, setOpenFiles, activeFile, setActiveFile, language, settings, files, updateFile, setMarkers } = useStore();
  const t = translations[language].ide.editor;
  const monaco = useMonaco();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('vibe-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
          { token: 'keyword', foreground: 'ff79c6' },
          { token: 'string', foreground: 'f1fa8c' },
        ],
        colors: {
          'editor.background': '#1e1e1e', // Match VS Code dark background
          'editor.lineHighlightBackground': '#ffffff0a',
          'editorLineNumber.foreground': '#6272a4',
          'editorIndentGuide.background': '#ffffff1a',
        }
      });
      monaco.editor.setTheme(settings.theme === 'vs-dark' ? 'vibe-dark' : settings.theme);

      // Listen for marker changes (errors/warnings)
      const disposable = monaco.editor.onDidChangeMarkers((uris) => {
        uris.forEach(uri => {
          const markers = monaco.editor.getModelMarkers({ resource: uri });
          // Convert monaco uri path to our file name (e.g. /index.html -> index.html)
          const fileName = uri.path.replace(/^\//, '');
          setMarkers(fileName, markers.map(m => ({
            message: m.message,
            severity: m.severity,
            startLineNumber: m.startLineNumber,
            startColumn: m.startColumn,
            endLineNumber: m.endLineNumber,
            endColumn: m.endColumn
          })));
        });
      });

      return () => disposable.dispose();
    }
  }, [monaco, settings.theme, setMarkers]);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
  };

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  const closeFile = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newOpenFiles = openFiles.filter(f => f !== fileName);
    setOpenFiles(newOpenFiles);
    if (activeFile === fileName) {
      setActiveFile(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : '');
    }
  };

  const openPreview = () => {
    if (!openFiles.includes('Preview')) {
      setOpenFiles([...openFiles, 'Preview']);
    }
    setActiveFile('Preview');
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && activeFile && activeFile !== 'Preview') {
      updateFile(activeFile, value);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full rounded-2xl overflow-hidden border border-white/10 bg-[#1e1e1e] shadow-2xl relative">
      {/* Tab Bar */}
      <div className="flex items-center h-10 bg-[#181818] border-b border-white/5 overflow-x-auto custom-scrollbar shrink-0">
        {openFiles.map((fileName) => {
          const isActive = fileName === activeFile;
          const isPreview = fileName === 'Preview';
          const icon = isPreview ? <Play size={12} className="text-emerald-400" /> : fileName.endsWith('.json') ? '{}' : '≡';
          const iconColor = fileName.endsWith('.json') ? 'text-yellow-400' : 'text-blue-400';
          
          return (
            <div
              key={fileName}
              onClick={() => setActiveFile(fileName)}
              className={cn(
                "flex items-center gap-2 px-3 h-full min-w-max cursor-pointer border-r border-white/5 transition-colors group",
                isActive ? "bg-[#1e1e1e] border-t-2 border-t-indigo-500 text-white" : "bg-transparent border-t-2 border-t-transparent text-white/50 hover:bg-white/5"
              )}
            >
              {isPreview ? (
                icon
              ) : (
                <span className={cn("text-xs font-mono", iconColor)}>{icon}</span>
              )}
              <span className="text-xs">{isPreview ? t.preview : fileName}</span>
              <button 
                onClick={(e) => closeFile(fileName, e)}
                className={cn(
                  "p-0.5 rounded hover:bg-white/10 transition-colors",
                  isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
        <div className="ml-auto px-2 flex items-center gap-2">
          {activeFile && activeFile !== 'Preview' && (
            <button 
              onClick={handleFormat}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-white/50 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium"
              title="Format Document"
            >
              <Wand2 size={12} />
            </button>
          )}
          <button 
            onClick={openPreview}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-xs font-medium"
          >
            <Play size={12} />
            <span>{t.preview}</span>
          </button>
        </div>
      </div>
      
      {/* Editor Area */}
      <div className="flex-1 relative">
        {activeFile === 'Preview' ? (
          <PreviewFrame />
        ) : activeFile ? (
          <Editor
            height="100%"
            path={activeFile} // Important for Monaco to associate markers with the correct file
            defaultLanguage={activeFile.endsWith('.json') ? 'json' : activeFile.endsWith('.css') ? 'css' : activeFile.endsWith('.html') ? 'html' : 'javascript'}
            value={files[activeFile] || ''}
            theme={settings.theme === 'vs-dark' ? 'vibe-dark' : settings.theme}
            onMount={handleEditorDidMount}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: settings.fontSize,
              fontFamily: "'JetBrains Mono', monospace",
              lineHeight: Math.round(settings.fontSize * 1.5),
              padding: { top: 16, bottom: 16 },
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              formatOnPaste: settings.formatOnSave,
              formatOnType: settings.formatOnSave,
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-white/30 text-sm">
            Select a file to view its contents
          </div>
        )}
      </div>
    </div>
  );
}



