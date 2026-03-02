import { create } from 'zustand';
import { Language } from '../i18n/translations';
import type { FileChange } from '../services/agentService';

export type ProjectMode = 'beginner' | 'advanced';
export type DeviceView = 'mobile' | 'tablet' | 'desktop';
export type BottomPanelTab = 'problems' | 'output' | 'debug' | 'terminal' | 'ports';
export type EditorTheme = 'vs-dark' | 'hc-black' | 'vs';
export type Keybinding = 'standard' | 'vim' | 'emacs';

export interface ConsoleLog {
  type: 'log' | 'warn' | 'error' | 'info';
  content: string;
  timestamp: number;
}

export interface Settings {
  theme: EditorTheme;
  fontSize: number;
  keybinding: Keybinding;
  formatOnSave: boolean;
}

interface User {
  name: string;
  email: string;
  avatar?: string;
  uid?: string;
}

export interface Marker {
  message: string;
  severity: number;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

interface AppState {
  language: Language;
  setLanguage: (lang: Language) => void;

  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;

  user: User | null;
  setUser: (user: User | null) => void;

  mode: ProjectMode;
  setMode: (mode: ProjectMode) => void;

  projectName: string;
  setProjectName: (name: string) => void;

  code: string;
  setCode: (code: string) => void;

  deviceView: DeviceView;
  setDeviceView: (view: DeviceView) => void;

  activeTab: 'code' | 'mentor' | 'ideas';
  setActiveTab: (tab: 'code' | 'mentor' | 'ideas') => void;

  isAgentPanelOpen: boolean;
  setAgentPanelOpen: (isOpen: boolean) => void;

  isFileExplorerOpen: boolean;
  setFileExplorerOpen: (isOpen: boolean) => void;

  openFiles: string[];
  setOpenFiles: (files: string[]) => void;

  activeFile: string;
  setActiveFile: (file: string) => void;

  files: Record<string, string>;
  updateFile: (name: string, content: string) => void;
  deleteFile: (name: string) => void;

  folders: string[];
  addFolder: (name: string) => void;

  markers: Record<string, Marker[]>;
  setMarkers: (file: string, markers: Marker[]) => void;

  isBottomPanelOpen: boolean;
  setBottomPanelOpen: (isOpen: boolean) => void;

  bottomPanelTab: BottomPanelTab;
  setBottomPanelTab: (tab: BottomPanelTab) => void;

  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;

  isSettingsOpen: boolean;
  setSettingsOpen: (isOpen: boolean) => void;

  pendingPrompt: string | null;
  setPendingPrompt: (prompt: string | null) => void;

  pendingModel: string | null;
  setPendingModel: (model: string | null) => void;

  pendingFileChanges: FileChange[] | null;
  setPendingFileChanges: (changes: FileChange[] | null) => void;
  applyPendingChanges: () => void;

  consoleLogs: ConsoleLog[];
  addConsoleLog: (log: ConsoleLog) => void;
  clearConsoleLogs: () => void;
}

const defaultFiles: Record<string, string> = {
  'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Project</title>
</head>
<body>
  
</body>
</html>`
};

export const useStore = create<AppState>((set) => ({
  language: 'en',
  setLanguage: (language) => set({ language }),

  isAuthenticated: false,
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

  user: null,
  setUser: (user) => set({ user }),

  mode: 'advanced',
  setMode: (mode) => set({ mode }),

  projectName: localStorage.getItem('vibecraft_project_name') || 'My Project',
  setProjectName: (projectName) => { localStorage.setItem('vibecraft_project_name', projectName); set({ projectName }); },

  code: defaultFiles['index.html'],
  setCode: (code) => set({ code }),

  deviceView: 'desktop',
  setDeviceView: (deviceView) => set({ deviceView }),

  activeTab: 'code',
  setActiveTab: (activeTab) => set({ activeTab }),

  isAgentPanelOpen: true,
  setAgentPanelOpen: (isAgentPanelOpen) => set({ isAgentPanelOpen }),

  isFileExplorerOpen: true,
  setFileExplorerOpen: (isFileExplorerOpen) => set({ isFileExplorerOpen }),

  openFiles: ['index.html'],
  setOpenFiles: (openFiles) => set({ openFiles }),

  activeFile: 'index.html',
  setActiveFile: (activeFile) => set({ activeFile }),

  files: defaultFiles,
  updateFile: (name, content) => set((state) => ({ files: { ...state.files, [name]: content } })),
  deleteFile: (name) => set((state) => {
    const newFiles = { ...state.files };
    delete newFiles[name];
    const newOpenFiles = state.openFiles.filter(f => f !== name);
    return {
      files: newFiles,
      openFiles: newOpenFiles,
      activeFile: state.activeFile === name ? (newOpenFiles[0] || '') : state.activeFile
    };
  }),

  folders: [],
  addFolder: (name) => set((state) => ({ folders: [...state.folders, name] })),

  markers: {},
  setMarkers: (file, markers) => set((state) => ({ markers: { ...state.markers, [file]: markers } })),

  isBottomPanelOpen: true,
  setBottomPanelOpen: (isBottomPanelOpen) => set({ isBottomPanelOpen }),

  bottomPanelTab: 'problems',
  setBottomPanelTab: (bottomPanelTab) => set({ bottomPanelTab }),

  settings: {
    theme: 'vs-dark',
    fontSize: 14,
    keybinding: 'standard',
    formatOnSave: true,
  },
  updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),

  isSettingsOpen: false,
  setSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),

  pendingPrompt: null,
  setPendingPrompt: (pendingPrompt) => set({ pendingPrompt }),

  pendingModel: null,
  setPendingModel: (pendingModel) => set({ pendingModel }),

  pendingFileChanges: null,
  setPendingFileChanges: (pendingFileChanges) => set({ pendingFileChanges }),
  applyPendingChanges: () => set((state) => {
    if (!state.pendingFileChanges) return {};
    const newFiles = { ...state.files };
    const newOpenFiles = [...state.openFiles];
    let newActiveFile = state.activeFile;

    for (const change of state.pendingFileChanges) {
      if (change.action === 'create' || change.action === 'modify') {
        newFiles[change.path] = change.content || '';
        if (!newOpenFiles.includes(change.path)) {
          newOpenFiles.push(change.path);
        }
        newActiveFile = change.path;
      } else if (change.action === 'delete') {
        delete newFiles[change.path];
        const idx = newOpenFiles.indexOf(change.path);
        if (idx !== -1) newOpenFiles.splice(idx, 1);
        if (newActiveFile === change.path) {
          newActiveFile = newOpenFiles[0] || '';
        }
      }
    }

    return {
      files: newFiles,
      openFiles: newOpenFiles,
      activeFile: newActiveFile,
      pendingFileChanges: null,
    };
  }),

  consoleLogs: [],
  addConsoleLog: (log) => set((state) => ({ consoleLogs: [...state.consoleLogs, log] })),
  clearConsoleLogs: () => set({ consoleLogs: [] }),
}));






