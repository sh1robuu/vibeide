import { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { useStore, BottomPanelTab } from '../../store/useStore';

type MenuItem = {
  label: string;
  shortcut?: string;
  divider?: boolean;
  action?: string;
  disabled?: boolean;
};

type MenuCategory = {
  label: string;
  items: MenuItem[];
};

const menuItems: MenuCategory[] = [
  {
    label: 'File',
    items: [
      { label: 'New File', shortcut: 'Ctrl+N', action: 'new_file' },
      { label: 'New Folder', shortcut: 'Ctrl+Shift+N', action: 'new_folder' },
      { divider: true, label: '' },
      { label: 'Save', shortcut: 'Ctrl+S', action: 'save_workspace' },
      { divider: true, label: '' },
      { label: 'Settings', shortcut: 'Ctrl+,', action: 'open_settings' }
    ]
  },
  {
    label: 'Edit',
    items: [
      { label: 'Undo', shortcut: 'Ctrl+Z', action: 'undo' },
      { label: 'Redo', shortcut: 'Ctrl+Y', action: 'redo' },
      { divider: true, label: '' },
      { label: 'Cut', shortcut: 'Ctrl+X', action: 'cut' },
      { label: 'Copy', shortcut: 'Ctrl+C', action: 'copy' },
      { label: 'Paste', shortcut: 'Ctrl+V', action: 'paste' },
      { label: 'Select All', shortcut: 'Ctrl+A', action: 'select_all' },
      { divider: true, label: '' },
      { label: 'Find', shortcut: 'Ctrl+F', action: 'find' },
      { label: 'Replace', shortcut: 'Ctrl+H', action: 'replace' }
    ]
  },
  {
    label: 'View',
    items: [
      { label: 'Explorer', shortcut: 'Ctrl+Shift+E', action: 'toggle_explorer' },
      { divider: true, label: '' },
      { label: 'Problems', shortcut: 'Ctrl+Shift+M', action: 'open_problems' },
      { label: 'Output', shortcut: 'Ctrl+Shift+U', action: 'open_output' },
      { label: 'Debug Console', shortcut: 'Ctrl+Shift+Y', action: 'open_debug' },
      { label: 'Terminal', shortcut: 'Ctrl+`', action: 'open_terminal' }
    ]
  },
  {
    label: 'Help',
    items: [
      { label: 'Welcome', action: 'help_welcome' },
      { label: 'Documentation', action: 'help_docs' },
      { divider: true, label: '' },
      { label: 'Keyboard Shortcuts', shortcut: 'Ctrl+K', action: 'help_shortcuts' },
      { divider: true, label: '' },
      { label: 'About VibeCraft', action: 'help_about' }
    ]
  }
];

export function MenuBar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [helpModal, setHelpModal] = useState<'shortcuts' | 'about' | null>(null);
  const [inputModal, setInputModal] = useState<{ type: 'file' | 'folder'; value: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    setBottomPanelOpen, setBottomPanelTab, setSettingsOpen,
    isFileExplorerOpen, setFileExplorerOpen,
    updateFile, addFolder, setActiveFile, setOpenFiles, openFiles,
    files, folders, user, language
  } = useStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      if (e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        handleAction('new_file');
      } else if (e.key === 'N' && e.shiftKey) {
        e.preventDefault();
        handleAction('new_folder');
      } else if (e.key === 's') {
        e.preventDefault();
        handleAction('save_workspace');
      } else if (e.key === ',') {
        e.preventDefault();
        handleAction('open_settings');
      } else if (e.key === 'E' && e.shiftKey) {
        e.preventDefault();
        handleAction('toggle_explorer');
      } else if (e.key === 'M' && e.shiftKey) {
        e.preventDefault();
        handleAction('open_problems');
      } else if (e.key === 'U' && e.shiftKey) {
        e.preventDefault();
        handleAction('open_output');
      } else if (e.key === '`') {
        e.preventDefault();
        handleAction('open_terminal');
      } else if (e.key === 'k') {
        e.preventDefault();
        handleAction('help_shortcuts');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFileExplorerOpen, openFiles, files, folders, user]);

  // Trigger Monaco editor actions
  const triggerMonacoAction = (actionId: string) => {
    // Find the Monaco editor instance in the DOM
    const editorElement = document.querySelector('.monaco-editor') as HTMLElement;
    if (!editorElement) return;

    // Focus the editor first
    const textarea = editorElement.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea) textarea.focus();

    // Dispatch keyboard events to trigger Monaco actions
    setTimeout(() => {
      const monacoInstance = (window as any).monaco?.editor?.getEditors?.()?.[0];
      if (monacoInstance) {
        monacoInstance.trigger('menu', actionId, null);
      }
    }, 50);
  };

  const handleAction = (action?: string) => {
    setOpenMenu(null);
    if (!action) return;

    // Bottom panel tabs
    if (action.startsWith('open_') && ['problems', 'output', 'debug', 'terminal', 'ports'].includes(action.replace('open_', ''))) {
      const tab = action.replace('open_', '') as BottomPanelTab;
      setBottomPanelTab(tab);
      setBottomPanelOpen(true);
      return;
    }

    switch (action) {
      case 'open_settings':
        setSettingsOpen(true);
        break;

      case 'toggle_explorer':
        setFileExplorerOpen(!isFileExplorerOpen);
        break;

      case 'new_file':
        setInputModal({ type: 'file', value: '' });
        break;

      case 'new_folder':
        setInputModal({ type: 'folder', value: '' });
        break;

      case 'save_workspace': {
        // Dispatch a custom event that MainLayout's save button listens for
        // This triggers the actual Firebase/localStorage save logic
        const saveBtn = document.querySelector('[data-action="save-workspace"]') as HTMLButtonElement;
        if (saveBtn) {
          saveBtn.click();
        } else {
          // Fallback: save to localStorage directly
          if (user?.uid) {
            try {
              localStorage.setItem(`workspace_${user.uid}`, JSON.stringify({
                files, folders, lastUpdated: new Date().toISOString()
              }));
            } catch (e) {
              console.error('Save failed:', e);
            }
          }
        }
        break;
      }

      // Edit actions — trigger Monaco editor commands
      case 'undo':
        triggerMonacoAction('undo');
        break;
      case 'redo':
        triggerMonacoAction('redo');
        break;
      case 'cut':
        triggerMonacoAction('editor.action.clipboardCutAction');
        break;
      case 'copy':
        triggerMonacoAction('editor.action.clipboardCopyAction');
        break;
      case 'paste':
        // Paste requires clipboard API permissions, use execCommand fallback
        navigator.clipboard.readText().then(text => {
          const monacoInstance = (window as any).monaco?.editor?.getEditors?.()?.[0];
          if (monacoInstance) {
            monacoInstance.trigger('menu', 'paste', { text });
          }
        }).catch(() => {
          document.execCommand('paste');
        });
        break;
      case 'select_all':
        triggerMonacoAction('editor.action.selectAll');
        break;
      case 'find':
        triggerMonacoAction('actions.find');
        break;
      case 'replace':
        triggerMonacoAction('editor.action.startFindReplaceAction');
        break;

      // Help actions
      case 'help_welcome':
        window.open('/', '_self');
        break;
      case 'help_docs':
        window.open('https://github.com/sh1robuu/vibeide', '_blank');
        break;
      case 'help_shortcuts':
        setHelpModal('shortcuts');
        break;
      case 'help_about':
        setHelpModal('about');
        break;
    }
  };

  return (
    <>
      <div ref={menuRef} className="flex items-center gap-0.5 text-[13px] text-white/80">
        {menuItems.map((menu) => (
          <div key={menu.label} className="relative">
            <button
              onClick={() => setOpenMenu(openMenu === menu.label ? null : menu.label)}
              onMouseEnter={() => openMenu && setOpenMenu(menu.label)}
              className={cn(
                "px-2.5 py-1 rounded-md hover:bg-white/10 transition-colors cursor-default",
                openMenu === menu.label && "bg-indigo-500/20 text-indigo-300 shadow-inner"
              )}
            >
              {menu.label}
            </button>

            {openMenu === menu.label && (
              <div className="absolute top-full left-0 mt-1 w-64 py-1.5 bg-[#1e1e1e] border border-white/10 rounded-lg shadow-2xl z-[100] backdrop-blur-xl">
                {menu.items.map((item, i) => (
                  item.divider ? (
                    <div key={i} className="h-px bg-white/10 my-1.5 mx-2" />
                  ) : (
                    <button
                      key={i}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-1.5 text-[13px] transition-colors",
                        item.disabled
                          ? "text-white/30 cursor-not-allowed"
                          : "text-white/80 hover:bg-indigo-500/20 hover:text-white"
                      )}
                      onClick={() => !item.disabled && handleAction(item.action)}
                      disabled={item.disabled}
                    >
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <span className="text-white/40 text-[11px] tracking-wider font-mono">{item.shortcut}</span>
                      )}
                    </button>
                  )
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* New File / New Folder Modal */}
      {inputModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setInputModal(null)}>
          <div
            className="bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              {inputModal.type === 'file' ? '📄' : '📁'}
              {inputModal.type === 'file'
                ? (language === 'vi' ? 'Tạo file mới' : 'New File')
                : (language === 'vi' ? 'Tạo thư mục mới' : 'New Folder')}
            </h3>
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={inputModal.value}
              onChange={e => setInputModal({ ...inputModal, value: e.target.value })}
              onKeyDown={e => {
                if (e.key === 'Enter' && inputModal.value.trim()) {
                  if (inputModal.type === 'file') {
                    updateFile(inputModal.value.trim(), '');
                    if (!openFiles.includes(inputModal.value.trim())) {
                      setOpenFiles([...openFiles, inputModal.value.trim()]);
                    }
                    setActiveFile(inputModal.value.trim());
                  } else {
                    addFolder(inputModal.value.trim());
                  }
                  setInputModal(null);
                } else if (e.key === 'Escape') {
                  setInputModal(null);
                }
              }}
              placeholder={
                inputModal.type === 'file'
                  ? (language === 'vi' ? 'Ví dụ: app.js, style.css...' : 'e.g. app.js, style.css...')
                  : (language === 'vi' ? 'Ví dụ: components, assets...' : 'e.g. components, assets...')
              }
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setInputModal(null)}
                className="px-4 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  if (!inputModal.value.trim()) return;
                  if (inputModal.type === 'file') {
                    updateFile(inputModal.value.trim(), '');
                    if (!openFiles.includes(inputModal.value.trim())) {
                      setOpenFiles([...openFiles, inputModal.value.trim()]);
                    }
                    setActiveFile(inputModal.value.trim());
                  } else {
                    addFolder(inputModal.value.trim());
                  }
                  setInputModal(null);
                }}
                disabled={!inputModal.value.trim()}
                className="px-4 py-1.5 rounded-lg text-sm font-medium bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors border border-indigo-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {language === 'vi' ? 'Tạo' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modals */}
      {helpModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setHelpModal(null)}>
          <div
            className="bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            {helpModal === 'shortcuts' && (
              <>
                <h2 className="text-lg font-bold text-white">⌨️ Keyboard Shortcuts</h2>
                <div className="space-y-1 text-sm">
                  {[
                    ['Ctrl+N', 'New File'],
                    ['Ctrl+Shift+N', 'New Folder'],
                    ['Ctrl+S', 'Save Workspace'],
                    ['Ctrl+Z', 'Undo'],
                    ['Ctrl+Y', 'Redo'],
                    ['Ctrl+F', 'Find'],
                    ['Ctrl+H', 'Find & Replace'],
                    ['Ctrl+Shift+E', 'Toggle Explorer'],
                    ['Ctrl+`', 'Toggle Terminal'],
                    ['Ctrl+,', 'Settings'],
                    ['Enter', 'Send Prompt'],
                    ['Shift+Enter', 'New Line in Prompt'],
                    ['↑ / ↓', 'Prompt History'],
                  ].map(([key, desc]) => (
                    <div key={key} className="flex items-center justify-between py-1.5 border-b border-white/5">
                      <span className="text-white/70">{desc}</span>
                      <kbd className="px-2 py-0.5 rounded bg-white/10 text-[11px] font-mono text-white/60">{key}</kbd>
                    </div>
                  ))}
                </div>
              </>
            )}
            {helpModal === 'about' && (
              <>
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <span className="text-2xl">✨</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">VibeCraft</h2>
                  <p className="text-sm text-white/50">
                    {language === 'vi'
                      ? 'IDE vibe coding dành cho học sinh cấp 2, cấp 3 dễ dàng tiếp cận lập trình và AI coding.'
                      : 'A vibe coding IDE for middle & high school students to easily learn programming and AI coding.'}
                  </p>
                  <p className="text-xs text-white/30">Version 1.0.0</p>
                </div>
              </>
            )}
            <button
              onClick={() => setHelpModal(null)}
              className="w-full py-2 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 transition-colors text-sm font-medium border border-white/10"
            >
              {language === 'vi' ? 'Đóng' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
