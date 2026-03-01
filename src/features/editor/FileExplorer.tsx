import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, FileCode, FileJson, Folder, Plus, FolderPlus, Search, X, Menu, AlertCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useStore } from '../../store/useStore';
import { translations } from '../../i18n/translations';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  icon?: string;
  children?: FileNode[];
  gitStatus?: 'M' | 'A' | 'U' | null;
}

export function FileExplorer() {
  const { activeFile, setActiveFile, openFiles, setOpenFiles, language, files, updateFile, deleteFile, markers, folders, addFolder } = useStore();
  const t = translations[language].ide.fileExplorer;
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const newFileInputRef = useRef<HTMLInputElement>(null);

  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  // Mock git status for demonstration
  const getMockGitStatus = (fileName: string): 'M' | 'A' | 'U' | null => {
    if (fileName === 'index.html') return 'M';
    if (fileName === 'script.js') return 'U';
    if (fileName === 'styles.css') return 'A';
    return null;
  };

  // Generate file tree from store files and folders
  const fileTree: FileNode[] = [
    ...(folders || []).map(folderName => ({
      name: folderName,
      type: 'folder' as const,
      children: []
    })),
    ...Object.keys(files).map(fileName => ({
      name: fileName,
      type: 'file' as const,
      icon: fileName.endsWith('.html') ? '🌐' : fileName.endsWith('.css') ? '🎨' : '⚡',
      gitStatus: getMockGitStatus(fileName)
    }))
  ];

  useEffect(() => {
    if (isCreatingFile && newFileInputRef.current) {
      newFileInputRef.current.focus();
    }
  }, [isCreatingFile]);

  useEffect(() => {
    if (isCreatingFolder && newFolderInputRef.current) {
      newFolderInputRef.current.focus();
    }
  }, [isCreatingFolder]);

  const handleFileClick = (fileName: string) => {
    if (!openFiles.includes(fileName)) {
      setOpenFiles([...openFiles, fileName]);
    }
    setActiveFile(fileName);
  };

  const handleNewFile = () => {
    setIsCreatingFolder(false);
    setIsCreatingFile(true);
    setNewFileName('');
  };

  const handleNewFolder = () => {
    setIsCreatingFile(false);
    setIsCreatingFolder(true);
    setNewFolderName('');
  };

  const submitNewFile = () => {
    if (newFileName.trim() && !files[newFileName]) {
      updateFile(newFileName, '');
      if (!openFiles.includes(newFileName)) {
        setOpenFiles([...openFiles, newFileName]);
      }
      setActiveFile(newFileName);
    }
    setIsCreatingFile(false);
    setNewFileName('');
  };

  const submitNewFolder = () => {
    if (newFolderName.trim() && !(folders || []).includes(newFolderName)) {
      addFolder(newFolderName);
    }
    setIsCreatingFolder(false);
    setNewFolderName('');
  };

  const handleNewFileKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submitNewFile();
    } else if (e.key === 'Escape') {
      setIsCreatingFile(false);
      setNewFileName('');
    }
  };

  const handleNewFolderKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submitNewFolder();
    } else if (e.key === 'Escape') {
      setIsCreatingFolder(false);
      setNewFolderName('');
    }
  };

  const renderTree = (nodes: FileNode[], level = 0) => {
    return nodes.map((node) => {
      const isFolder = node.type === 'folder';
      const isActive = node.name === activeFile;
      
      const fileMarkers = markers[node.name] || [];
      const hasErrors = fileMarkers.some(m => m.severity === 8);
      const hasWarnings = fileMarkers.some(m => m.severity === 4);

      return (
        <div key={node.name}>
          <div
            className={cn(
              "flex items-center gap-1.5 py-1 px-2 cursor-pointer hover:bg-white/5 text-sm transition-colors group",
              isActive && !isFolder ? "bg-indigo-500/20 text-indigo-300" : "text-white/70",
              hasErrors && !isActive ? "text-red-400" : hasWarnings && !isActive ? "text-yellow-400" : ""
            )}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={() => !isFolder && handleFileClick(node.name)}
          >
            {isFolder ? (
              <ChevronDown size={14} className="opacity-50 shrink-0" />
            ) : (
              <span className="w-3.5 flex items-center justify-center shrink-0 opacity-50 text-[10px]">
                {/* Placeholder for alignment if no chevron */}
              </span>
            )}
            
            {isFolder ? (
              <Folder size={14} className="text-blue-400 shrink-0" />
            ) : (
              <span className={cn(
                "text-xs font-mono shrink-0",
                node.name.endsWith('.ts') || node.name.endsWith('.tsx') || node.name.endsWith('.js') ? "text-blue-400" :
                node.name.endsWith('.json') ? "text-yellow-400" :
                node.name.endsWith('.css') ? "text-pink-400" :
                node.name.endsWith('.html') ? "text-orange-400" : "text-white/50"
              )}>
                {node.icon || '≡'}
              </span>
            )}
            
            <span className={cn(
              "truncate flex-1",
              node.gitStatus === 'M' ? "text-blue-300" :
              node.gitStatus === 'A' ? "text-emerald-300" :
              node.gitStatus === 'U' ? "text-emerald-400" : ""
            )}>
              {node.name}
            </span>
            
            {/* Error/Warning Indicators */}
            {!isFolder && (hasErrors || hasWarnings) && (
              <span className="shrink-0 mr-1 opacity-70 group-hover:opacity-100 transition-opacity">
                {hasErrors ? (
                  <AlertCircle size={12} className="text-red-400" />
                ) : (
                  <AlertTriangle size={12} className="text-yellow-400" />
                )}
              </span>
            )}

            {/* Git Status Indicator */}
            {!isFolder && node.gitStatus && (
              <span className={cn(
                "shrink-0 text-[10px] font-mono font-bold ml-1 opacity-70",
                node.gitStatus === 'M' ? "text-blue-400" :
                node.gitStatus === 'A' ? "text-emerald-400" :
                node.gitStatus === 'U' ? "text-emerald-500" : ""
              )}>
                {node.gitStatus}
              </span>
            )}

            {/* Delete Button */}
            {!isFolder && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Are you sure you want to delete ${node.name}?`)) {
                    deleteFile(node.name);
                  }
                }}
                className="shrink-0 ml-2 opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 transition-all"
                title="Delete File"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
          {isFolder && node.children && (
            <div>{renderTree(node.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="w-64 h-full flex flex-col bg-[#1e1e1e] border-r border-white/5 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between h-10 px-3 border-b border-white/5 shrink-0">
        <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">{t.title}</span>
        <div className="flex items-center gap-1">
          <button onClick={handleNewFile} className="p-1 text-white/50 hover:text-white hover:bg-white/10 rounded" title={t.newFile}>
            <Plus size={14} />
          </button>
          <button onClick={handleNewFolder} className="p-1 text-white/50 hover:text-white hover:bg-white/10 rounded" title="New Folder">
            <FolderPlus size={14} />
          </button>
          <button className="p-1 text-white/50 hover:text-white hover:bg-white/10 rounded">
            <Search size={14} />
          </button>
          <button className="p-1 text-white/50 hover:text-white hover:bg-white/10 rounded">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
        {renderTree(fileTree)}
        {isCreatingFile && (
          <div className="flex items-center gap-1.5 py-1 px-2 text-sm" style={{ paddingLeft: '20px' }}>
            <span className="w-3.5 flex items-center justify-center shrink-0 opacity-50 text-[10px]"></span>
            <span className="text-xs font-mono shrink-0 text-white/50">≡</span>
            <input
              ref={newFileInputRef}
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={handleNewFileKeyDown}
              onBlur={submitNewFile}
              className="flex-1 bg-transparent border border-indigo-500/50 outline-none text-white px-1 py-0.5 rounded-sm"
              placeholder="filename.ext"
            />
          </div>
        )}
        {isCreatingFolder && (
          <div className="flex items-center gap-1.5 py-1 px-2 text-sm" style={{ paddingLeft: '20px' }}>
            <ChevronDown size={14} className="opacity-50 shrink-0" />
            <Folder size={14} className="text-blue-400 shrink-0" />
            <input
              ref={newFolderInputRef}
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={handleNewFolderKeyDown}
              onBlur={submitNewFolder}
              className="flex-1 bg-transparent border border-indigo-500/50 outline-none text-white px-1 py-0.5 rounded-sm"
              placeholder="folder name"
            />
          </div>
        )}
      </div>
    </div>
  );
}


